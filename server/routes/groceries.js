const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');
const { lookupProduct } = require('../data/productKnowledge');

const router = express.Router();

// --- Lists ---

const VALID_GROUPS = ['fresh', 'dry-goods', 'frozen-cold', 'drinks', 'snacks-sweets', 'health', 'household', 'personal', 'other'];

function serializeList(list) {
  return { ...list, focusGroups: JSON.parse(list.focusGroups || '[]') };
}

router.get('/lists', async (req, res, next) => {
  try {
    const lists = await prisma.groceryList.findMany({
      where: { householdId: req.householdId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: lists.map(serializeList) });
  } catch (err) { next(err); }
});

const listSchema = z.object({
  name: z.string().min(1).max(100),
  focusGroups: z.array(z.enum(VALID_GROUPS)).default([]),
});

router.post('/lists', validate(listSchema), async (req, res, next) => {
  try {
    const list = await prisma.groceryList.create({
      data: {
        name: req.body.name,
        focusGroups: JSON.stringify(req.body.focusGroups),
        householdId: req.householdId,
      },
    });
    res.json({ success: true, data: serializeList(list) });
  } catch (err) { next(err); }
});

router.delete('/lists/:id', async (req, res, next) => {
  try {
    const list = await prisma.groceryList.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });
    await prisma.groceryList.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// --- Product lookup ---
// GET /api/groceries/lookup?name=milk
// Returns suggested metadata for a product name. No auth side-effects.
router.get('/lookup', (req, res) => {
  const name = (req.query.name || '').trim();
  if (!name) return res.json({ success: true, data: null });
  const match = lookupProduct(name);
  res.json({ success: true, data: match || null });
});

// --- Items ---

router.get('/items', async (req, res, next) => {
  try {
    const where = { householdId: req.householdId };
    if (req.query.listId) where.listId = req.query.listId;
    const items = await prisma.groceryItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

const VALID_CATEGORIES = [
  'produce', 'dairy', 'meat', 'seafood', 'deli', 'bakery', 'pasta-grains',
  'canned-goods', 'pantry', 'frozen', 'beverages', 'alcohol', 'snacks',
  'sweets', 'health-foods', 'vitamins', 'cleaning', 'laundry',
  'kitchen-supplies', 'personal-care', 'baby', 'pet', 'other',
];

const itemSchema = z.object({
  name: z.string().min(1).max(200),
  listId: z.string().uuid(),
  category: z.enum(VALID_CATEGORIES).default('other'),
  quantity: z.string().default(''),
  note: z.string().default(''),
  monthlyFrequency: z.number().nullable().default(null),
  shelfLifeDays: z.number().int().nullable().default(null),
});

router.post('/items', validate(itemSchema), async (req, res, next) => {
  try {
    const list = await prisma.groceryList.findFirst({
      where: { id: req.body.listId, householdId: req.householdId },
    });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });
    const item = await prisma.groceryItem.create({
      data: { ...req.body, householdId: req.householdId },
    });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

const itemUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  quantity: z.string().optional(),
  note: z.string().optional(),
  bought: z.boolean().optional(),
  monthlyFrequency: z.number().nullable().optional(),
  shelfLifeDays: z.number().int().nullable().optional(),
});

router.patch('/items/:id', validate(itemUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.groceryItem.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });
    const item = await prisma.groceryItem.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/items/:id', async (req, res, next) => {
  try {
    const existing = await prisma.groceryItem.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });
    await prisma.groceryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

router.post('/items/bulk-delete', async (req, res, next) => {
  try {
    const { listId } = req.body;
    if (!listId) return res.status(422).json({ success: false, error: 'listId is required' });
    await prisma.groceryItem.deleteMany({
      where: { listId, householdId: req.householdId, bought: true },
    });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

module.exports = router;
