const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const where = { householdId: req.householdId };
    if (req.query.category) where.category = req.query.category;
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { location: { contains: q } },
      ];
    }
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

const itemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().default('other'),
  brand: z.string().default(''),
  model: z.string().default(''),
  purchaseDate: z.string().nullable().default(null),
  purchasePrice: z.number().nullable().default(null),
  warrantyExpiry: z.string().nullable().default(null),
  lastMaintenanceDate: z.string().nullable().default(null),
  nextMaintenanceDate: z.string().nullable().default(null),
  maintenanceNotes: z.string().default(''),
  location: z.string().default(''),
  notes: z.string().default(''),
});

router.post('/', validate(itemSchema), async (req, res, next) => {
  try {
    const item = await prisma.inventoryItem.create({
      data: { ...req.body, householdId: req.householdId },
    });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/:id', validate(itemSchema.partial()), async (req, res, next) => {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });
    const item = await prisma.inventoryItem.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

module.exports = router;
