const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const where = { householdId: req.householdId };
    if (req.query.category) where.category = req.query.category;
    if (req.query.fromGrocery === 'true') where.fromGrocery = true;
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
      orderBy: { updatedAt: 'desc' },
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
  purchasedBy: z.string().default(''),
  stockQuantity: z.string().default(''),
  estimatedEndDate: z.string().nullable().default(null),
  monthlyFrequency: z.number().nullable().default(null),
  shelfLifeDays: z.number().int().nullable().default(null),
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

// DELETE /bulk — delete multiple items by IDs
router.delete('/bulk', async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(422).json({ success: false, error: 'ids array is required' });
    await prisma.inventoryItem.deleteMany({
      where: { id: { in: ids }, householdId: req.householdId },
    });
    res.json({ success: true, data: { deleted: ids.length } });
  } catch (err) { next(err); }
});

module.exports = router;
