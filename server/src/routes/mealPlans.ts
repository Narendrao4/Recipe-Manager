import { Router } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all meal plans
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const mealPlans = await prisma.mealPlan.findMany({
      where: { userId: req.userId! },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: true,
                tags: { include: { tag: true } },
              },
            },
          },
        },
      },
      orderBy: { weekStart: 'desc' },
    });

    res.json(mealPlans);
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// Get single meal plan
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: true,
                tags: { include: { tag: true } },
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    res.json(mealPlan);
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
  }
});

// Create meal plan
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, weekStart } = req.body;

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: req.userId!,
        name,
        weekStart: new Date(weekStart),
      },
    });

    res.status(201).json(mealPlan);
  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({ error: 'Failed to create meal plan' });
  }
});

// Add recipe to meal plan
router.post('/:id/recipes', authenticate, async (req: AuthRequest, res) => {
  try {
    const { recipeId, date, mealType } = req.body;

    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    const mealPlanRecipe = await prisma.mealPlanRecipe.create({
      data: {
        mealPlanId: req.params.id,
        recipeId,
        date: new Date(date),
        mealType,
      },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    res.status(201).json(mealPlanRecipe);
  } catch (error) {
    console.error('Add recipe to meal plan error:', error);
    res.status(500).json({ error: 'Failed to add recipe to meal plan' });
  }
});

// Remove recipe from meal plan
router.delete('/:id/recipes/:recipeId', authenticate, async (req: AuthRequest, res) => {
  try {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    await prisma.mealPlanRecipe.delete({
      where: { id: req.params.recipeId },
    });

    res.json({ message: 'Recipe removed from meal plan' });
  } catch (error) {
    console.error('Remove recipe from meal plan error:', error);
    res.status(500).json({ error: 'Failed to remove recipe from meal plan' });
  }
});

// Generate grocery list from meal plan
router.get('/:id/grocery-list', authenticate, async (req: AuthRequest, res) => {
  try {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: true,
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // Aggregate ingredients
    const ingredientMap = new Map<string, { name: string; quantity: number; unit: string; category: string }>();

    mealPlan.recipes.forEach((mpr) => {
      mpr.recipe.ingredients.forEach((ing) => {
        const key = `${ing.name.toLowerCase()}-${ing.unit}`;
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.quantity += ing.quantity;
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: categorizeIngredient(ing.name),
          });
        }
      });
    });

    const items = Array.from(ingredientMap.values()).map((item) => ({
      ...item,
      checked: false,
    }));

    // Sort by category
    const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'other'];
    items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

    res.json({ items, mealPlanId: mealPlan.id });
  } catch (error) {
    console.error('Generate grocery list error:', error);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
});

// Helper function to categorize ingredients
function categorizeIngredient(name: string): string {
  const nameLower = name.toLowerCase();
  
  const categories = {
    produce: ['lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'potato', 'pepper', 'cucumber', 'spinach', 'broccoli', 'apple', 'banana', 'lemon', 'lime'],
    meat: ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb', 'salmon', 'shrimp', 'bacon'],
    dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg'],
    pantry: ['flour', 'sugar', 'salt', 'pepper', 'oil', 'rice', 'pasta', 'beans', 'sauce', 'spice'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

export default router;
