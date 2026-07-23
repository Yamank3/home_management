const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

const MEAL_INCLUDE = {
  planEntries: false,
  lunchEntries: false,
  dinnerEntries: false,
};

function serializeMeal(meal) {
  return { ...meal, ingredients: JSON.parse(meal.ingredients || '[]') };
}

function serializePlanEntry(entry) {
  return {
    id: entry.id,
    date: entry.date,
    breakfast: entry.breakfastId,
    lunch: entry.lunchId,
    dinner: entry.dinnerId,
    breakfastMeal: entry.breakfast ? serializeMeal(entry.breakfast) : null,
    lunchMeal: entry.lunch ? serializeMeal(entry.lunch) : null,
    dinnerMeal: entry.dinner ? serializeMeal(entry.dinner) : null,
    notes: entry.notes,
    householdId: entry.householdId,
  };
}

// --- Meals library ---

router.get('/', async (req, res, next) => {
  try {
    const meals = await prisma.meal.findMany({
      where: { householdId: req.householdId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: meals.map(serializeMeal) });
  } catch (err) { next(err); }
});

const ingredientSchema = z.object({ name: z.string().min(1), quantity: z.string().default('') });

const mealSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).default('dinner'),
  ingredients: z.array(ingredientSchema).default([]),
  prepTimeMinutes: z.number().int().nullable().default(null),
  cookTimeMinutes: z.number().int().nullable().default(null),
  servings: z.number().int().nullable().default(null),
  notes: z.string().default(''),
});

router.post('/', validate(mealSchema), async (req, res, next) => {
  try {
    const { ingredients, ...rest } = req.body;
    const meal = await prisma.meal.create({
      data: { ...rest, ingredients: JSON.stringify(ingredients), householdId: req.householdId },
    });
    res.json({ success: true, data: serializeMeal(meal) });
  } catch (err) { next(err); }
});

router.patch('/:id', validate(mealSchema.partial()), async (req, res, next) => {
  try {
    const existing = await prisma.meal.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Meal not found' });
    const data = { ...req.body };
    if (data.ingredients) data.ingredients = JSON.stringify(data.ingredients);
    const meal = await prisma.meal.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: serializeMeal(meal) });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.meal.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Meal not found' });
    await prisma.meal.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// --- Meal plan ---

const planInclude = {
  breakfast: true,
  lunch: true,
  dinner: true,
};

router.get('/plan', async (req, res, next) => {
  try {
    const { weekStart } = req.query;
    const where = { householdId: req.householdId };
    if (weekStart) {
      const days = getWeekDays(weekStart);
      where.date = { in: days };
    }
    const entries = await prisma.mealPlanEntry.findMany({
      where,
      include: planInclude,
      orderBy: { date: 'asc' },
    });

    if (weekStart) {
      const days = getWeekDays(weekStart);
      const mapped = days.map(date => {
        const entry = entries.find(e => e.date === date);
        if (entry) return serializePlanEntry(entry);
        return { id: null, date, breakfast: null, lunch: null, dinner: null, notes: '' };
      });
      return res.json({ success: true, data: mapped });
    }
    res.json({ success: true, data: entries.map(serializePlanEntry) });
  } catch (err) { next(err); }
});

const planSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  breakfast: z.string().uuid().nullable().default(null),
  lunch: z.string().uuid().nullable().default(null),
  dinner: z.string().uuid().nullable().default(null),
  notes: z.string().default(''),
});

router.post('/plan', validate(planSchema), async (req, res, next) => {
  try {
    const { date, breakfast, lunch, dinner, notes } = req.body;
    const entry = await prisma.mealPlanEntry.upsert({
      where: { date_householdId: { date, householdId: req.householdId } },
      update: { breakfastId: breakfast, lunchId: lunch, dinnerId: dinner, notes },
      create: {
        date,
        breakfastId: breakfast,
        lunchId: lunch,
        dinnerId: dinner,
        notes,
        householdId: req.householdId,
      },
      include: planInclude,
    });
    res.json({ success: true, data: serializePlanEntry(entry) });
  } catch (err) { next(err); }
});

router.patch('/plan/:id', async (req, res, next) => {
  try {
    const existing = await prisma.mealPlanEntry.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Plan entry not found' });

    const data = {};
    if ('breakfast' in req.body) data.breakfastId = req.body.breakfast;
    if ('lunch' in req.body) data.lunchId = req.body.lunch;
    if ('dinner' in req.body) data.dinnerId = req.body.dinner;
    if ('notes' in req.body) data.notes = req.body.notes;

    const entry = await prisma.mealPlanEntry.update({
      where: { id: req.params.id },
      data,
      include: planInclude,
    });
    res.json({ success: true, data: serializePlanEntry(entry) });
  } catch (err) { next(err); }
});

// Add meal ingredients to a grocery list
router.post('/:id/add-to-groceries', async (req, res, next) => {
  try {
    const { listId } = req.body;
    if (!listId) return res.status(422).json({ success: false, error: 'listId is required' });

    const meal = await prisma.meal.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!meal) return res.status(404).json({ success: false, error: 'Meal not found' });

    const list = await prisma.groceryList.findFirst({
      where: { id: listId, householdId: req.householdId },
    });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });

    const ingredients = JSON.parse(meal.ingredients || '[]');
    const newItems = await prisma.$transaction(
      ingredients.map(ing =>
        prisma.groceryItem.create({
          data: {
            name: ing.name,
            quantity: ing.quantity || '',
            note: `For ${meal.name}`,
            category: 'groceries',
            listId,
            householdId: req.householdId,
          },
        })
      )
    );
    res.json({ success: true, data: newItems });
  } catch (err) { next(err); }
});

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

module.exports = router;
