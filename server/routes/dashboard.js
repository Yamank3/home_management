const express = require('express');
const prisma = require('../db');

const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try {
    const hid = req.householdId;
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const [
      activeLists,
      itemsToBuy,
      billsDueSoon,
      overdueChores,
      choresToday,
      warrantiesExpiring,
      maintenanceDue,
      mealPlanCount,
    ] = await Promise.all([
      prisma.groceryList.count({ where: { householdId: hid, completedAt: null } }),
      prisma.groceryItem.count({ where: { householdId: hid, bought: false } }),
      prisma.bill.findMany({
        where: { householdId: hid, isPaid: false, nextDueDate: { not: null, lte: in7Days } },
        select: { amount: true },
      }),
      prisma.chore.count({ where: { householdId: hid, nextDueDate: { not: null, lt: today } } }),
      prisma.chore.count({ where: { householdId: hid, nextDueDate: today } }),
      prisma.inventoryItem.count({
        where: { householdId: hid, warrantyExpiry: { not: null, lte: in30Days, gte: today } },
      }),
      prisma.inventoryItem.count({
        where: { householdId: hid, nextMaintenanceDate: { not: null, lte: today } },
      }),
      prisma.mealPlanEntry.count({
        where: {
          householdId: hid,
          date: { gte: getMonday(today), lte: getSunday(today) },
          OR: [
            { breakfastId: { not: null } },
            { lunchId: { not: null } },
            { dinnerId: { not: null } },
          ],
        },
      }),
    ]);

    const dueSoonTotal = billsDueSoon.reduce((s, b) => s + b.amount, 0);

    res.json({
      success: true,
      data: {
        groceries: { activeLists, itemsToBuy },
        bills: { dueSoonCount: billsDueSoon.length, dueSoonTotal },
        chores: { overdueChores, dueToday: choresToday },
        inventory: { warrantiesExpiring, maintenanceDue },
        meals: { plannedDays: mealPlanCount, totalDays: 7 },
      },
    });
  } catch (err) { next(err); }
});

function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split('T')[0];
}

function getSunday(dateStr) {
  const d = new Date(getMonday(dateStr));
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

module.exports = router;
