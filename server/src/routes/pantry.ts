import { Router } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all pantry items
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.pantryItem.findMany({
      where: { userId: req.userId! },
      orderBy: { addedAt: 'desc' },
    });

    res.json(items);
  } catch (error) {
    console.error('Get pantry error:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

// Add pantry item
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, quantity, unit, expiryDate, category } = req.body;

    const item = await prisma.pantryItem.create({
      data: {
        userId: req.userId!,
        name,
        quantity: parseFloat(quantity),
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        category,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Add pantry item error:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

// Update pantry item
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, quantity, unit, expiryDate, category } = req.body;

    const item = await prisma.pantryItem.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!item) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }

    const updated = await prisma.pantryItem.update({
      where: { id: req.params.id },
      data: {
        name,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        category,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update pantry item error:', error);
    res.status(500).json({ error: 'Failed to update pantry item' });
  }
});

// Delete pantry item
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.pantryItem.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!item) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }

    await prisma.pantryItem.delete({ where: { id: req.params.id } });

    res.json({ message: 'Pantry item deleted successfully' });
  } catch (error) {
    console.error('Delete pantry item error:', error);
    res.status(500).json({ error: 'Failed to delete pantry item' });
  }
});

export default router;
