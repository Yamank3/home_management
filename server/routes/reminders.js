const express = require('express');
const prisma = require('../db');
const { resetPaidBills } = require('../utils/billCycle');
const { buildReminders, buildSchedule } = require('../utils/reminders');

const router = express.Router();

async function loadHouseholdData(householdId) {
  const where = { householdId };
  await resetPaidBills(prisma, householdId);
  const [bills, chores, items] = await Promise.all([
    prisma.bill.findMany({ where: { ...where, isPaid: false, nextDueDate: { not: null } } }),
    prisma.chore.findMany({ where: { ...where, nextDueDate: { not: null } } }),
    prisma.inventoryItem.findMany({ where }),
  ]);
  return { bills, chores, items };
}

router.get('/', async (req, res, next) => {
  try {
    res.json({ success: true, data: buildReminders(await loadHouseholdData(req.householdId)) });
  } catch (err) { next(err); }
});

// Upcoming notifications for the mobile app to schedule on the device.
router.get('/schedule', async (req, res, next) => {
  try {
    res.json({ success: true, data: buildSchedule(await loadHouseholdData(req.householdId)) });
  } catch (err) { next(err); }
});

module.exports = router;
