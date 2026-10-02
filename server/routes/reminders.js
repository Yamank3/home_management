const express = require('express');
const prisma = require('../db');
const { resetPaidBills } = require('../utils/billCycle');
const { buildReminders } = require('../utils/reminders');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const where = { householdId: req.householdId };
    await resetPaidBills(prisma, req.householdId);
    const [bills, chores, items] = await Promise.all([
      prisma.bill.findMany({ where: { ...where, isPaid: false, nextDueDate: { not: null } } }),
      prisma.chore.findMany({ where: { ...where, nextDueDate: { not: null } } }),
      prisma.inventoryItem.findMany({ where }),
    ]);
    res.json({ success: true, data: buildReminders({ bills, chores, items }) });
  } catch (err) { next(err); }
});

module.exports = router;
