const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const budgets = await prisma.budget.findMany({ where: { householdId: req.householdId }, orderBy: { category: 'asc' } });
    res.json({ success: true, data: budgets });
  } catch (err) { next(err); }
});

// PUT /api/budgets — set a category's monthly limit; 0 removes it. The category
// travels in the body because names like "rent/mortgage" contain a slash.
const budgetSchema = z.object({
  category: z.string().trim().min(1).max(60),
  monthlyAmount: z.number().min(0),
});

router.put('/', validate(budgetSchema), async (req, res, next) => {
  try {
    const { category, monthlyAmount } = req.body;
    const key = { householdId_category: { householdId: req.householdId, category } };
    if (monthlyAmount === 0) {
      await prisma.budget.deleteMany({ where: { householdId: req.householdId, category } });
      return res.json({ success: true, data: null });
    }
    const budget = await prisma.budget.upsert({
      where: key,
      update: { monthlyAmount },
      create: { category, monthlyAmount, householdId: req.householdId },
    });
    res.json({ success: true, data: budget });
  } catch (err) { next(err); }
});

module.exports = router;
