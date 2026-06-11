import { Router } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all collections
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const collections = await prisma.collection.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(collections);
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Create collection
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    const collection = await prisma.collection.create({
      data: {
        userId: req.userId!,
        name,
      },
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Add recipe to collection
router.post('/:id/recipes', authenticate, async (req: AuthRequest, res) => {
  try {
    const { recipeId } = req.body;

    const collection = await prisma.collection.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collectionRecipe.create({
      data: {
        collectionId: req.params.id,
        recipeId,
      },
    });

    res.status(201).json({ message: 'Recipe added to collection' });
  } catch (error) {
    console.error('Add recipe to collection error:', error);
    res.status(500).json({ error: 'Failed to add recipe to collection' });
  }
});

// Remove recipe from collection
router.delete('/:id/recipes/:recipeId', authenticate, async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collectionRecipe.delete({
      where: {
        collectionId_recipeId: {
          collectionId: req.params.id,
          recipeId: req.params.recipeId,
        },
      },
    });

    res.json({ message: 'Recipe removed from collection' });
  } catch (error) {
    console.error('Remove recipe from collection error:', error);
    res.status(500).json({ error: 'Failed to remove recipe from collection' });
  }
});

// Delete collection
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collection.delete({ where: { id: req.params.id } });

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

export default router;
