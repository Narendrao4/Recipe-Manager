import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const MEALDB_API_KEY = process.env.THEMEALDB_API_KEY || '1';
const MEALDB_BASE_URL = `https://www.themealdb.com/api/json/v1/${MEALDB_API_KEY}`;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

type TheMealDbMeal = {
  idMeal: string;
  strMeal: string;
  strCategory?: string | null;
  strArea?: string | null;
  strInstructions?: string | null;
  strMealThumb?: string | null;
  strTags?: string | null;
  strYoutube?: string | null;
  strSource?: string | null;
  [key: string]: string | null | undefined;
};

type TheMealDbResponse = {
  meals: TheMealDbMeal[] | null;
};

type ImportedIngredient = {
  name: string;
  quantity: number;
  unit: string;
  substitution: string;
};

type ImportedStep = {
  instruction: string;
  timerMinutes: string;
};

type RecipeDraft = {
  externalId: string;
  source: string;
  title: string;
  description: string;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  photoUrl?: string;
  category: string;
  ingredients: ImportedIngredient[];
  steps: ImportedStep[];
  tags: string[];
};

type YouTubeSearchItem = {
  id?: {
    kind?: string;
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string; width?: number; height?: number }>;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

type YouTubeRecipeVideo = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  watchUrl: string;
  embedUrl: string;
};

function cleanText(value?: string | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeExternalPhotoUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function parseQuantityToken(token: string): number | null {
  const parts = token.trim().split(/\s+/);
  let total = 0;

  for (const part of parts) {
    if (part.includes('/')) {
      const [numerator, denominator] = part.split('/').map(Number);
      if (!numerator || !denominator) {
        return null;
      }
      total += numerator / denominator;
    } else {
      const parsed = Number(part);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      total += parsed;
    }
  }

  return total || null;
}

function parseMeasure(rawMeasure?: string | null): { quantity: number; unit: string } {
  const cleaned = cleanText(rawMeasure)
    .replace(/\u00bc/g, ' 1/4')
    .replace(/\u00bd/g, ' 1/2')
    .replace(/\u00be/g, ' 3/4')
    .replace(/\u2153/g, ' 1/3')
    .replace(/\u2154/g, ' 2/3')
    .replace(/\u215b/g, ' 1/8')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return { quantity: 1, unit: 'item' };
  }

  const quantityMatch = cleaned.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)/);

  if (!quantityMatch) {
    return { quantity: 1, unit: cleaned };
  }

  const quantity = parseQuantityToken(quantityMatch[1]);
  const unit = cleaned.slice(quantityMatch[1].length).trim();

  return {
    quantity: quantity ?? 1,
    unit: unit || 'item',
  };
}

function extractMealIngredients(meal: TheMealDbMeal): ImportedIngredient[] {
  const ingredients: ImportedIngredient[] = [];

  for (let index = 1; index <= 20; index += 1) {
    const name = cleanText(meal[`strIngredient${index}`]);
    if (!name) {
      continue;
    }

    const measure = parseMeasure(meal[`strMeasure${index}`]);
    ingredients.push({
      name,
      quantity: measure.quantity,
      unit: measure.unit,
      substitution: '',
    });
  }

  return ingredients;
}

function splitMealInstructions(instructions?: string | null): ImportedStep[] {
  const cleaned = (instructions || '').replace(/\r/g, '\n').trim();

  if (!cleaned) {
    return [{ instruction: 'Prepare and cook as desired.', timerMinutes: '' }];
  }

  const lineSteps = cleaned
    .split(/\n+/)
    .map((step) => cleanText(step).replace(/^\d+[\).]\s*/, ''))
    .filter(Boolean);

  if (lineSteps.length > 1) {
    return lineSteps.map((instruction) => ({ instruction, timerMinutes: '' }));
  }

  const numberedSteps = cleaned
    .split(/(?=\s\d+[\).]\s)/)
    .map((step) => cleanText(step).replace(/^\d+[\).]\s*/, ''))
    .filter(Boolean);

  if (numberedSteps.length > 1) {
    return numberedSteps.map((instruction) => ({ instruction, timerMinutes: '' }));
  }

  return [{ instruction: cleanText(cleaned), timerMinutes: '' }];
}

function uniqueTagNames(values: string[]): string[] {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getBestYouTubeThumbnail(
  thumbnails?: Record<string, { url?: string; width?: number; height?: number }>
): string {
  return (
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ''
  );
}

function mapYouTubeSearchItem(item: YouTubeSearchItem): YouTubeRecipeVideo | null {
  const videoId = cleanText(item.id?.videoId);

  if (item.id?.kind !== 'youtube#video' || !videoId) {
    return null;
  }

  return {
    videoId,
    title: cleanText(item.snippet?.title),
    description: cleanText(item.snippet?.description),
    channelTitle: cleanText(item.snippet?.channelTitle),
    publishedAt: cleanText(item.snippet?.publishedAt),
    thumbnailUrl: getBestYouTubeThumbnail(item.snippet?.thumbnails),
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

function mapMealToRecipeDraft(meal: TheMealDbMeal): RecipeDraft {
  const title = cleanText(meal.strMeal);
  const category = cleanText(meal.strCategory);
  const area = cleanText(meal.strArea);
  const source = cleanText(meal.strSource || meal.strYoutube);
  const ingredients = extractMealIngredients(meal);
  const steps = splitMealInstructions(meal.strInstructions);
  const mealTags = cleanText(meal.strTags)
    .split(',')
    .map((tag) => tag.trim());

  const descriptionParts = [
    category && area ? `${area} ${category} recipe imported from TheMealDB.` : '',
    source ? `Source: ${source}` : '',
  ].filter(Boolean);

  return {
    externalId: meal.idMeal,
    source: 'TheMealDB',
    title,
    description: descriptionParts.join(' '),
    cuisine: area && area.toLowerCase() !== 'unknown' ? area : '',
    difficulty: ingredients.length <= 6 && steps.length <= 4 ? 'Easy' : 'Medium',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    photoUrl: normalizeExternalPhotoUrl(meal.strMealThumb),
    category,
    ingredients,
    steps,
    tags: uniqueTagNames([...mealTags, category, area, 'TheMealDB']),
  };
}

async function fetchMealDb(pathname: string, params: Record<string, string>): Promise<TheMealDbResponse> {
  const url = new URL(`${MEALDB_BASE_URL}/${pathname}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`TheMealDB returned ${response.status}`);
    }

    return (await response.json()) as TheMealDbResponse;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchYouTubeRecipeVideos(query: string): Promise<YouTubeRecipeVideo[]> {
  const apiKey = cleanText(process.env.YOUTUBE_API_KEY);

  if (!apiKey) {
    return [];
  }

  const maxResults = clampNumber(parseInt(process.env.YOUTUBE_MAX_RESULTS || '6', 10), 1, 12);
  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', `how to make ${query}`);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', maxResults.toString());
  url.searchParams.set('order', 'relevance');
  url.searchParams.set('safeSearch', 'moderate');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('key', apiKey);

  if (process.env.YOUTUBE_REGION_CODE) {
    url.searchParams.set('regionCode', process.env.YOUTUBE_REGION_CODE);
  }

  if (process.env.YOUTUBE_RELEVANCE_LANGUAGE) {
    url.searchParams.set('relevanceLanguage', process.env.YOUTUBE_RELEVANCE_LANGUAGE);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`YouTube Data API returned ${response.status}`);
    }

    const data = (await response.json()) as YouTubeSearchResponse;

    return (data.items || [])
      .map(mapYouTubeSearchItem)
      .filter((video): video is YouTubeRecipeVideo => Boolean(video));
  } finally {
    clearTimeout(timeout);
  }
}

async function addTagsToRecipe(recipeId: string, tagNames: string[]): Promise<void> {
  for (const tagName of uniqueTagNames(tagNames)) {
    let tag = await prisma.tag.findUnique({ where: { name: tagName } });

    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
    }

    await prisma.recipeTag.create({
      data: {
        recipeId,
        tagId: tag.id,
      },
    });
  }
}

async function createRecipeFromDraft(userId: string, draft: RecipeDraft) {
  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title: draft.title,
      description: draft.description,
      cuisine: draft.cuisine,
      difficulty: draft.difficulty,
      prepTime: draft.prepTime,
      cookTime: draft.cookTime,
      servings: draft.servings,
      photoUrl: draft.photoUrl,
      ingredients: {
        create: draft.ingredients.map((ingredient, index) => ({
          name: ingredient.name,
          quantity: Number.isFinite(ingredient.quantity) ? ingredient.quantity : 1,
          unit: ingredient.unit || 'item',
          substitution: ingredient.substitution,
          order: index,
        })),
      },
      steps: {
        create: draft.steps.map((step, index) => ({
          stepNumber: index + 1,
          instruction: step.instruction,
          timerMinutes: step.timerMinutes ? parseInt(step.timerMinutes) : null,
        })),
      },
    },
  });

  await addTagsToRecipe(recipe.id, draft.tags);

  const createdRecipe = await prisma.recipe.findFirst({
    where: { id: recipe.id, userId },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { stepNumber: 'asc' } },
      tags: { include: { tag: true } },
      favorites: { where: { userId } },
    },
  });

  if (!createdRecipe) {
    throw new Error('Imported recipe was not found after creation');
  }

  return {
    ...createdRecipe,
    tags: createdRecipe.tags.map((rt) => rt.tag),
    isFavorite: createdRecipe.favorites.length > 0,
    favorites: undefined,
  };
}

// Search TheMealDB and return drafts compatible with the local recipe form.
router.get('/external/themealdb/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const query = cleanText(req.query.q as string);

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const data = await fetchMealDb('search.php', { s: query });
    const meals = (data.meals || []).map(mapMealToRecipeDraft);

    res.json(meals);
  } catch (error) {
    console.error('TheMealDB search error:', error);
    res.status(502).json({ error: 'Failed to search TheMealDB recipes' });
  }
});

// Search YouTube Data API for embeddable cooking videos matching a recipe query.
router.get('/external/youtube/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const query = cleanText(req.query.q as string);

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const configured = Boolean(cleanText(process.env.YOUTUBE_API_KEY));
    const videos = configured ? await fetchYouTubeRecipeVideos(query) : [];

    res.json({ configured, videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(502).json({ error: 'Failed to search YouTube recipe videos' });
  }
});

// Import a TheMealDB recipe directly into the user's local recipe collection.
router.post('/external/themealdb/import', authenticate, async (req: AuthRequest, res) => {
  try {
    const externalId = cleanText(req.body.externalId || req.body.idMeal);

    if (!externalId || !/^\d+$/.test(externalId)) {
      return res.status(400).json({ error: 'Valid TheMealDB recipe id required' });
    }

    const data = await fetchMealDb('lookup.php', { i: externalId });
    const meal = data.meals?.[0];

    if (!meal) {
      return res.status(404).json({ error: 'TheMealDB recipe not found' });
    }

    const recipe = await createRecipeFromDraft(req.userId!, mapMealToRecipeDraft(meal));

    res.status(201).json(recipe);
  } catch (error) {
    console.error('TheMealDB import error:', error);
    res.status(502).json({ error: 'Failed to import TheMealDB recipe' });
  }
});

// Get all recipes for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { search, cuisine, difficulty, tags } = req.query;
    
    const recipes = await prisma.recipe.findMany({
      where: {
        userId: req.userId!,
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
        ...(cuisine && { cuisine: cuisine as string }),
        ...(difficulty && { difficulty: difficulty as string }),
        ...(tags && {
          tags: {
            some: {
              tag: {
                name: { in: (tags as string).split(',') },
              },
            },
          },
        }),
      },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        tags: { include: { tag: true } },
        favorites: { where: { userId: req.userId! } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recipesWithFavorite = recipes.map((recipe) => ({
      ...recipe,
      tags: recipe.tags.map((rt) => rt.tag),
      isFavorite: recipe.favorites.length > 0,
      favorites: undefined,
    }));

    res.json(recipesWithFavorite);
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get single recipe
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        tags: { include: { tag: true } },
        favorites: { where: { userId: req.userId! } },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({
      ...recipe,
      tags: recipe.tags.map((rt) => rt.tag),
      isFavorite: recipe.favorites.length > 0,
      favorites: undefined,
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// Create recipe
router.post('/', authenticate, upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    const { title, description, cuisine, difficulty, prepTime, cookTime, servings, ingredients, steps, tags, photoUrl: externalPhotoUrl } = req.body;

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : normalizeExternalPhotoUrl(externalPhotoUrl);

    const recipe = await prisma.recipe.create({
      data: {
        userId: req.userId!,
        title,
        description,
        cuisine,
        difficulty,
        prepTime: parseInt(prepTime),
        cookTime: parseInt(cookTime),
        servings: parseInt(servings),
        photoUrl,
        ingredients: {
          create: JSON.parse(ingredients).map((ing: any, index: number) => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
            substitution: ing.substitution,
            order: index,
          })),
        },
        steps: {
          create: JSON.parse(steps).map((step: any, index: number) => ({
            stepNumber: index + 1,
            instruction: step.instruction,
            timerMinutes: step.timerMinutes ? parseInt(step.timerMinutes) : null,
          })),
        },
      },
      include: {
        ingredients: true,
        steps: true,
      },
    });

    // Handle tags
    if (tags) {
      const tagNames = JSON.parse(tags);
      for (const tagName of tagNames) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } });
        }
        await prisma.recipeTag.create({
          data: {
            recipeId: recipe.id,
            tagId: tag.id,
          },
        });
      }
    }

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', authenticate, upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    const { title, description, cuisine, difficulty, prepTime, cookTime, servings, ingredients, steps, tags, photoUrl: externalPhotoUrl } = req.body;

    // Verify ownership
    const existingRecipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : normalizeExternalPhotoUrl(externalPhotoUrl);

    // Delete old ingredients and steps
    await prisma.ingredient.deleteMany({ where: { recipeId: req.params.id } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: req.params.id } });

    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        cuisine,
        difficulty,
        prepTime: prepTime ? parseInt(prepTime) : undefined,
        cookTime: cookTime ? parseInt(cookTime) : undefined,
        servings: servings ? parseInt(servings) : undefined,
        ...(photoUrl && { photoUrl }),
        ...(ingredients && {
          ingredients: {
            create: JSON.parse(ingredients).map((ing: any, index: number) => ({
              name: ing.name,
              quantity: parseFloat(ing.quantity),
              unit: ing.unit,
              substitution: ing.substitution,
              order: index,
            })),
          },
        }),
        ...(steps && {
          steps: {
            create: JSON.parse(steps).map((step: any, index: number) => ({
              stepNumber: index + 1,
              instruction: step.instruction,
              timerMinutes: step.timerMinutes ? parseInt(step.timerMinutes) : null,
            })),
          },
        }),
      },
      include: {
        ingredients: true,
        steps: true,
      },
    });

    // Update tags
    if (tags) {
      await prisma.recipeTag.deleteMany({ where: { recipeId: req.params.id } });
      const tagNames = JSON.parse(tags);
      for (const tagName of tagNames) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } });
        }
        await prisma.recipeTag.create({
          data: {
            recipeId: recipe.id,
            tagId: tag.id,
          },
        });
      }
    }

    res.json(recipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    await prisma.recipe.delete({ where: { id: req.params.id } });

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Toggle favorite
router.post('/:id/favorite', authenticate, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.favoriteRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: req.userId!,
          recipeId: req.params.id,
        },
      },
    });

    if (existing) {
      await prisma.favoriteRecipe.delete({
        where: {
          userId_recipeId: {
            userId: req.userId!,
            recipeId: req.params.id,
          },
        },
      });
      res.json({ isFavorite: false });
    } else {
      await prisma.favoriteRecipe.create({
        data: {
          userId: req.userId!,
          recipeId: req.params.id,
        },
      });
      res.json({ isFavorite: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Ingredient matcher
router.post('/match', authenticate, async (req: AuthRequest, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients required' });
    }

    const recipes = await prisma.recipe.findMany({
      where: { userId: req.userId! },
      include: {
        ingredients: true,
        steps: true,
        tags: { include: { tag: true } },
        favorites: { where: { userId: req.userId! } },
      },
    });

    // Calculate match scores
    const recipesWithScores = recipes.map((recipe) => {
      const totalIngredients = recipe.ingredients.length;
      const matchedIngredients = recipe.ingredients.filter((ing) =>
        ingredients.some((userIng: string) =>
          ing.name.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(ing.name.toLowerCase())
        )
      ).length;

      const matchScore = totalIngredients > 0 ? (matchedIngredients / totalIngredients) * 100 : 0;
      const missingCount = totalIngredients - matchedIngredients;

      return {
        ...recipe,
        tags: recipe.tags.map((rt) => rt.tag),
        isFavorite: recipe.favorites.length > 0,
        matchScore: Math.round(matchScore),
        missingCount,
        favorites: undefined,
      };
    });

    // Sort by match score
    recipesWithScores.sort((a, b) => b.matchScore - a.matchScore);

    res.json(recipesWithScores);
  } catch (error) {
    console.error('Ingredient match error:', error);
    res.status(500).json({ error: 'Failed to match ingredients' });
  }
});

// Recipe Remix with Claude AI
router.post('/:id/remix', authenticate, async (req: AuthRequest, res) => {
  try {
    const { variation } = req.body;

    if (!['healthier', 'budget', 'gourmet'].includes(variation)) {
      return res.status(400).json({ error: 'Invalid variation type' });
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const variationPrompts = {
      healthier: 'Create a healthier version by reducing calories, using whole ingredients, and minimizing processed foods.',
      budget: 'Create a budget-friendly version using cheaper ingredients while maintaining flavor.',
      gourmet: 'Create a gourmet upgrade with premium ingredients and refined techniques.',
    };

    const prompt = `Given this recipe, ${variationPrompts[variation as keyof typeof variationPrompts]}

Recipe: ${recipe.title}
Ingredients:
${recipe.ingredients.map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`).join('\n')}

Steps:
${recipe.steps.map(step => `${step.stepNumber}. ${step.instruction}`).join('\n')}

Please provide:
1. Modified ingredient list (JSON array with name, quantity, unit)
2. Modified steps (JSON array with stepNumber, instruction)
3. Brief list of key changes made

Format your response as JSON:
{
  "ingredients": [...],
  "steps": [...],
  "changes": ["change 1", "change 2", ...]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    const responseText = content.type === 'text' ? content.text : '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const remixData = JSON.parse(jsonMatch[0]);

    res.json({
      original: recipe,
      remixed: remixData,
      variation,
    });
  } catch (error) {
    console.error('Recipe remix error:', error);
    res.status(500).json({ error: 'Failed to remix recipe' });
  }
});

// Log cook history
router.post('/:id/cook', authenticate, async (req: AuthRequest, res) => {
  try {
    const { servings, notes } = req.body;

    const cookHistory = await prisma.cookHistory.create({
      data: {
        userId: req.userId!,
        recipeId: req.params.id,
        servings: servings ? parseInt(servings) : null,
        notes,
      },
    });

    res.status(201).json(cookHistory);
  } catch (error) {
    console.error('Log cook error:', error);
    res.status(500).json({ error: 'Failed to log cook' });
  }
});

export default router;
