import { Router } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get cook statistics
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const cookHistory = await prisma.cookHistory.findMany({
      where: { userId: req.userId! },
      include: { recipe: true },
      orderBy: { cookedAt: 'desc' },
    });

    // Calculate statistics
    const totalCooks = cookHistory.length;

    // Most cooked recipe
    const recipeCounts = new Map<string, { count: number; recipe: any }>();
    cookHistory.forEach((ch) => {
      const existing = recipeCounts.get(ch.recipeId);
      if (existing) {
        existing.count++;
      } else {
        recipeCounts.set(ch.recipeId, { count: 1, recipe: ch.recipe });
      }
    });

    let mostCookedRecipe = null;
    let maxCount = 0;
    recipeCounts.forEach((value) => {
      if (value.count > maxCount) {
        maxCount = value.count;
        mostCookedRecipe = value.recipe;
      }
    });

    // Favorite cuisine
    const cuisineCounts = new Map<string, number>();
    cookHistory.forEach((ch) => {
      if (ch.recipe.cuisine) {
        const count = cuisineCounts.get(ch.recipe.cuisine) || 0;
        cuisineCounts.set(ch.recipe.cuisine, count + 1);
      }
    });

    let favoriteCuisine = null;
    let maxCuisineCount = 0;
    cuisineCounts.forEach((count, cuisine) => {
      if (count > maxCuisineCount) {
        maxCuisineCount = count;
        favoriteCuisine = cuisine;
      }
    });

    // Cook streak (consecutive days)
    let cookStreak = 0;
    if (cookHistory.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dates = cookHistory.map(ch => {
        const d = new Date(ch.cookedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      });
      
      const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
      
      let expectedDate = today.getTime();
      for (const date of uniqueDates) {
        if (date === expectedDate || date === expectedDate - 86400000) {
          cookStreak++;
          expectedDate = date - 86400000;
        } else {
          break;
        }
      }
    }

    // Cooks by day of week
    const cooksByDay: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    cookHistory.forEach((ch) => {
      const day = dayNames[new Date(ch.cookedAt).getDay()];
      cooksByDay[day]++;
    });

    res.json({
      totalCooks,
      mostCookedRecipe,
      favoriteCuisine,
      cookStreak,
      cooksByDay,
      recentCooks: cookHistory.slice(0, 10),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
