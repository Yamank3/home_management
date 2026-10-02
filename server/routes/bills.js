const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');
const { shift, nextAfter, anchorFor, isRecurring, resetPaidBills, todayStr } = require('../utils/billCycle');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    await resetPaidBills(prisma, req.householdId);
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
  currency: z.string().default('INR'),
  category: z.string().default('other'),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'one-time']).default('monthly'),
  notes: z.string().default(''),
});

router.post('/', validate(billSchema), async (req, res, next) => {
  try {
    const { nextDueDate, frequency } = req.body;
    const bill = await prisma.bill.create({
      data: {
        ...req.body,
        dueDay: nextDueDate ? anchorFor(frequency, nextDueDate) : null,
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
    const recurring = isRecurring(data.frequency ?? existing.frequency);

    // Paying a recurring bill moves it to its next cycle; un-paying (an undo)
    // steps back one period.
    if (data.isPaid === true && !existing.isPaid) {
      data.paidAt = new Date();
      if (recurring && existing.nextDueDate) {
        data.nextDueDate = nextAfter(existing.nextDueDate, existing.frequency, existing.dueDay, todayStr());
      }
    }
    if (data.isPaid === false) {
      data.paidAt = null;
      if (existing.isPaid && recurring && existing.nextDueDate) {
        data.nextDueDate = shift(existing.nextDueDate, existing.frequency, existing.dueDay, -1);
      }
    }

    // A due date the user picked re-anchors the day-of-month.
    if (data.nextDueDate && data.nextDueDate !== existing.nextDueDate && data.isPaid === undefined) {
      data.dueDay = anchorFor(data.frequency ?? existing.frequency, data.nextDueDate);
    }

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

function toMonthly(amount, frequency) {
  const map = { weekly: 52 / 12, biweekly: 26 / 12, monthly: 1, quarterly: 1 / 3, annual: 1 / 12, 'one-time': 0 };
  return amount * (map[frequency] ?? 1);
}

module.exports = router;
