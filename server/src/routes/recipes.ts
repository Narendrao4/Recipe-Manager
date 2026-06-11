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
    const { title, description, cuisine, difficulty, prepTime, cookTime, servings, ingredients, steps, tags } = req.body;

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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
    const { title, description, cuisine, difficulty, prepTime, cookTime, servings, ingredients, steps, tags } = req.body;

    // Verify ownership
    const existingRecipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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
