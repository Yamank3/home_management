const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');
const { summarizeMonth, isMonth, currentMonth } = require('../utils/spending');
const { todayStr } = require('../utils/billCycle');

const router = express.Router();

const monthOf = (req) => (isMonth(req.query.month) ? req.query.month : currentMonth());
const inMonth = (month) => ({ startsWith: month });

// GET /api/payments?month=YYYY-MM[&billId=] — payment history, newest first.
router.get('/', async (req, res, next) => {
  try {
    const where = { householdId: req.householdId, paidOn: inMonth(monthOf(req)) };
    if (req.query.billId) where.billId = req.query.billId;
    const payments = await prisma.payment.findMany({ where, orderBy: [{ paidOn: 'desc' }, { createdAt: 'desc' }] });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
});

// GET /api/payments/summary?month=YYYY-MM — spending per category against budgets.
router.get('/summary', async (req, res, next) => {
  try {
    const month = monthOf(req);
    const [payments, budgets] = await Promise.all([
      prisma.payment.findMany({ where: { householdId: req.householdId, paidOn: inMonth(month) }, select: { category: true, amount: true, paidOn: true } }),
      prisma.budget.findMany({ where: { householdId: req.householdId } }),
    ]);
    res.json({ success: true, data: summarizeMonth(payments, budgets, month) });
  } catch (err) { next(err); }
});

// A one-off expense, entered by hand or read from a receipt. Bill payments are
// recorded automatically when a bill is marked paid (see routes/bills.js).
const expenseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  amount: z.number().positive(),
  category: z.string().min(1).max(60).default('other'),
  currency: z.string().default('INR'),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => todayStr()),
  note: z.string().max(500).default(''),
  source: z.enum(['expense', 'receipt']).default('expense'),
});

router.post('/', validate(expenseSchema), async (req, res, next) => {
  try {
    const payment = await prisma.payment.create({ data: { ...req.body, householdId: req.householdId } });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.payment.findFirst({ where: { id: req.params.id, householdId: req.householdId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Payment not found' });
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

module.exports = router;
