const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const bills = await prisma.bill.findMany({
      where: { householdId: req.householdId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: bills });
  } catch (err) { next(err); }
});

const billSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.string().default('other'),
  dueDay: z.number().int().min(1).max(31).nullable().default(null),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'one-time']).default('monthly'),
  notes: z.string().default(''),
});

router.post('/', validate(billSchema), async (req, res, next) => {
  try {
    const bill = await prisma.bill.create({
      data: {
        ...req.body,
        nextDueDate: computeNextDue(req.body.frequency, req.body.dueDay),
        householdId: req.householdId,
      },
    });
    res.json({ success: true, data: bill });
  } catch (err) { next(err); }
});

const billUpdateSchema = billSchema.partial().extend({
  isPaid: z.boolean().optional(),
});

router.patch('/:id', validate(billUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.bill.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Bill not found' });

    const data = { ...req.body };
    if (data.isPaid === true && !existing.isPaid) data.paidAt = new Date();
    if (data.isPaid === false) data.paidAt = null;

    const bill = await prisma.bill.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: bill });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.bill.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Bill not found' });
    await prisma.bill.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

router.get('/summary/monthly', async (req, res, next) => {
  try {
    const bills = await prisma.bill.findMany({ where: { householdId: req.householdId } });
    const byCategory = {};
    let total = 0;
    for (const bill of bills) {
      const monthly = toMonthly(bill.amount, bill.frequency);
      byCategory[bill.category] = (byCategory[bill.category] || 0) + monthly;
      total += monthly;
    }
    res.json({ success: true, data: { byCategory, total } });
  } catch (err) { next(err); }
});

function computeNextDue(frequency, dueDay) {
  const now = new Date();
  if (frequency === 'monthly' && dueDay) {
    const d = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (d <= now) d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }
  return null;
}

function toMonthly(amount, frequency) {
  const map = { weekly: 52 / 12, biweekly: 26 / 12, monthly: 1, quarterly: 1 / 3, annual: 1 / 12, 'one-time': 0 };
  return amount * (map[frequency] ?? 1);
}

module.exports = router;
