const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');
const { lookupRecipe, scaleRecipe, RECIPES } = require('../data/recipeKnowledge');
const { lookupProduct } = require('../data/productKnowledge');
const { importRecipeFromUrl } = require('../utils/recipeImporter');
const { normalizeToPurchasableQty } = require('../utils/quantityNormalizer');

// Ingredient names that are always added at 1 kg if not in inventory
const BULK_STAPLES = [
  { pattern: /\bsalt\b|namak/i, qty: '1 kg', category: 'pantry', shelfLifeDays: 1825 },
];

// Check if a staple override applies and if the item is NOT in inventory
async function resolveStapleQty(name, householdId) {
  for (const staple of BULK_STAPLES) {
    if (staple.pattern.test(name)) {
      // Check if it's already in inventory
      const inInv = await prisma.inventoryItem.findFirst({
        where: { householdId, fromGrocery: true, name: { contains: 'salt' } },
      });
      if (!inInv) {
        return { quantity: staple.qty, category: staple.category, shelfLifeDays: staple.shelfLifeDays };
      }
      return null; // already have it, use normal quantity
    }
  }
  return null;
}

// Enrich a raw ingredient name+quantity with shelf life + category from product knowledge
function enrichIngredient(name, quantity, mealName, stapleOverride) {
  const match = lookupProduct(name);
  // Apply staple override (e.g. salt → 1 kg if not in inventory)
  if (stapleOverride) {
    return {
      name,
      quantity: stapleOverride.quantity,
      note: `For ${mealName}`,
      category:         stapleOverride.category || match?.category || 'pantry',
      shelfLifeDays:    stapleOverride.shelfLifeDays ?? match?.shelfLifeDays ?? null,
      monthlyFrequency: match?.monthlyFrequency ?? null,
    };
  }
  // Normalize cooking quantities (tbsp, tsp, cup) to purchasable units (g, ml)
  const normalizedQty = normalizeToPurchasableQty(quantity, name) || match?.quantity || '';
  return {
    name,
    quantity: normalizedQty,
    note: `For ${mealName}`,
    category:         match?.category         || 'other',
    shelfLifeDays:    match?.shelfLifeDays     ?? null,
    monthlyFrequency: match?.monthlyFrequency  ?? null,
  };
}

const router = express.Router();

// GET /api/meals/recipe?name=X&servings=N
// Returns auto-filled recipe ingredients for a meal name
router.get('/recipe', (req, res) => {
  const name     = (req.query.name || '').trim();
  const servings = parseInt(req.query.servings) || 2;
  if (!name) return res.json({ success: true, data: null });
  const recipe = lookupRecipe(name);
  if (!recipe) return res.json({ success: true, data: null });
  res.json({ success: true, data: scaleRecipe(recipe, servings) });
});

// GET /api/meals/search?q=X&servings=N
// Searches built-in recipe knowledge base + household meal library by name
router.get('/search', async (req, res, next) => {
  try {
    const q        = (req.query.q || '').toLowerCase().trim();
    const servings = parseInt(req.query.servings) || 2;
    if (!q || q.length < 2) return res.json({ success: true, data: { builtin: [], library: [] } });

    // Search built-in knowledge base
    const builtin = RECIPES
      .filter(r => {
        const text = [r.name, ...r.keywords].join(' ').toLowerCase();
        return text.includes(q) || q.split(' ').some(w => text.includes(w));
      })
      .slice(0, 6)
      .map(r => scaleRecipe(r, servings));

    // Search household meal library
    const library = await prisma.meal.findMany({
      where: {
        householdId: req.householdId,
        name: { contains: q },
      },
      take: 6,
    });

    res.json({
      success: true,
      data: {
        builtin,
        library: library.map(m => ({ ...m, ingredients: JSON.parse(m.ingredients || '[]') })),
      },
    });
  } catch (err) { next(err); }
});

// POST /api/meals/import-url
// Body: { url, servings? }
// Scrapes recipe from any URL (recipe sites + YouTube)
router.post('/import-url', async (req, res, next) => {
  try {
    const { url, servings } = req.body;
    if (!url) return res.status(422).json({ success: false, error: 'url is required' });

    // Basic URL validation
    let parsedUrl;
    try { parsedUrl = new URL(url); } catch {
      return res.status(422).json({ success: false, error: 'Invalid URL' });
    }

    const recipe = await importRecipeFromUrl(url);
    if (!recipe) return res.status(422).json({ success: false, error: 'Could not extract recipe from this URL' });

    // Scale servings if requested
    if (servings && recipe.ingredients?.length) {
      const factor = parseInt(servings) / (recipe.servings || 2);
      if (factor !== 1) {
        recipe.servings = parseInt(servings);
      }
    }

    res.json({ success: true, data: recipe });
  } catch (err) {
    if (err.message?.includes('HTTP') || err.message?.includes('fetch')) {
      return res.status(422).json({ success: false, error: 'Could not reach that URL. Please check it and try again.' });
    }
    next(err);
  }
});


// Body: { ingredients: [{ name, quantity }] }
// Returns: { have: [...], missing: [...] }
// Checks ingredient names against grocery-tracked inventory items
router.post('/check-inventory', async (req, res, next) => {
  try {
    const ingredients = req.body.ingredients || [];
    if (!ingredients.length) return res.json({ success: true, data: { have: [], missing: [] } });

    const inventory = await prisma.inventoryItem.findMany({
      where: { householdId: req.householdId, fromGrocery: true },
      select: { name: true, estimatedEndDate: true, stockQuantity: true },
    });

    const today = new Date().toISOString().split('T')[0];

    const have = [];
    const missing = [];

    for (const ing of ingredients) {
      const q = ing.name.toLowerCase();
      // Match if any inventory item name contains or is contained by the ingredient name
      const match = inventory.find(inv => {
        const n = inv.name.toLowerCase();
        return n.includes(q) || q.includes(n) ||
          // also match key words — e.g. "ginger (adrak)" matches "ginger"
          q.split(/[\s(,]/)[0] === n.split(/[\s(,]/)[0];
      });

      if (match) {
        const daysLeft = match.estimatedEndDate
          ? Math.round((new Date(match.estimatedEndDate) - new Date(today)) / 86400000)
          : null;
        have.push({
          name: ing.name,
          quantity: ing.quantity,
          inStock: match.name,
          stockQuantity: match.stockQuantity,
          daysLeft,
        });
      } else {
        missing.push({ name: ing.name, quantity: ing.quantity });
      }
    }

    res.json({ success: true, data: { have, missing } });
  } catch (err) { next(err); }
});
// Pantry staples every Indian household is assumed to always have.
// These are excluded from the "missing" count so they don't block recipe suggestions.
const STAPLES = new Set([
  'salt','namak','water','refined oil','oil','mustard oil','sarson tel','groundnut oil',
  'ghee','turmeric','haldi','red chilli powder','lal mirch','cumin seeds','jeera','zeera',
  'mustard seeds','rai','sarson','coriander powder','dhania powder','garam masala',
  'black pepper','kali mirch','asafoetida','hing','sugar','cheeni','baking soda',
]);

function isStaple(ingredientName) {
  const q = ingredientName.toLowerCase();
  for (const s of STAPLES) {
    if (q.includes(s) || s.includes(q)) return true;
  }
  // Also treat anything with "salt" or "oil" or "to taste"
  if (q.includes('salt') || q.includes('oil') || q === 'to taste' || q === 'as needed' || q === 'for frying') return true;
  return false;
}

function matchIngredient(ingName, inventory) {
  const q = ingName.toLowerCase();
  return inventory.find(inv => {
    const n = inv.name.toLowerCase();
    return n.includes(q) || q.includes(n) || q.split(/[\s(,]/)[0] === n.split(/[\s(,]/)[0];
  });
}

// GET /api/meals/suggestions?members=N
// Returns canMake (all non-staple ingredients in stock) and almostCanMake (1-3 missing)
router.get('/suggestions', async (req, res, next) => {
  try {
    const memberCount = parseInt(req.query.members) || 2;
    const today = new Date().toISOString().split('T')[0];

    const [inventory, meals] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { householdId: req.householdId, fromGrocery: true },
        select: { name: true, estimatedEndDate: true, stockQuantity: true },
      }),
      prisma.meal.findMany({
        where: { householdId: req.householdId },
        orderBy: { name: 'asc' },
      }),
    ]);

    const canMake = [];
    const almostCanMake = [];

    for (const meal of meals) {
      const ingredients = JSON.parse(meal.ingredients || '[]');
      if (!ingredients.length) continue;

      const have = [];
      const missing = [];

      for (const ing of ingredients) {
        if (isStaple(ing.name)) continue; // staples always assumed available

        const match = matchIngredient(ing.name, inventory);
        if (match) {
          const daysLeft = match.estimatedEndDate
            ? Math.round((new Date(match.estimatedEndDate) - new Date(today)) / 86400000)
            : null;
          have.push({ name: ing.name, quantity: ing.quantity, daysLeft });
        } else {
          missing.push({ name: ing.name, quantity: ing.quantity });
        }
      }

      const entry = {
        recipe: {
          id: meal.id,
          name: meal.name,
          type: meal.type,
          prepTimeMinutes: meal.prepTimeMinutes,
          cookTimeMinutes: meal.cookTimeMinutes,
          servings: meal.servings,
          ingredients,
        },
        have,
        missing,
      };

      if (missing.length === 0) {
        canMake.push(entry);
      } else if (missing.length <= 3) {
        almostCanMake.push(entry);
      }
    }

    // Sort canMake: simplest meals first (fewest total non-staple ingredients)
    canMake.sort((a, b) => a.have.length - b.have.length);
    // Sort almostCanMake: fewest missing first
    almostCanMake.sort((a, b) => a.missing.length - b.missing.length);

    res.json({ success: true, data: { canMake, almostCanMake } });
  } catch (err) { next(err); }
});

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
    cookedSlots: JSON.parse(entry.cookedSlots || '[]'),
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

// POST /api/meals/plan/:id/cook
// Mark a slot (breakfast/lunch/dinner) as cooked and reduce inventory end dates for ingredients used
router.post('/plan/:id/cook', async (req, res, next) => {
  try {
    const { slot } = req.body; // 'breakfast' | 'lunch' | 'dinner'
    if (!slot || !['breakfast','lunch','dinner'].includes(slot))
      return res.status(422).json({ success: false, error: 'slot must be breakfast, lunch, or dinner' });

    const entry = await prisma.mealPlanEntry.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
      include: planInclude,
    });
    if (!entry) return res.status(404).json({ success: false, error: 'Plan entry not found' });

    // Get the meal for this slot
    const slotMeal = entry[slot]; // relation object
    if (!slotMeal) return res.status(422).json({ success: false, error: `No meal assigned to ${slot}` });

    const ingredients = JSON.parse(slotMeal.ingredients || '[]');

    // Mark slot as cooked
    const currentCooked = JSON.parse(entry.cookedSlots || '[]');
    const updatedCooked = [...new Set([...currentCooked, slot])];

    const updatedEntry = await prisma.mealPlanEntry.update({
      where: { id: req.params.id },
      data: { cookedSlots: JSON.stringify(updatedCooked) },
      include: planInclude,
    });

    // Reduce inventory estimated end dates for matched ingredients
    const today = new Date().toISOString().split('T')[0];
    const inventory = await prisma.inventoryItem.findMany({
      where: { householdId: req.householdId, fromGrocery: true },
    });

    const consumed = [];
    for (const ing of ingredients) {
      const q = ing.name.toLowerCase();
      const match = inventory.find(inv => {
        const n = inv.name.toLowerCase();
        return n.includes(q) || q.includes(n) || q.split(/[\s(,]/)[0] === n.split(/[\s(,]/)[0];
      });

      if (match && match.estimatedEndDate) {
        // Deduct one meal's worth: reduce end date by (shelfLifeDays / monthlyFrequency) days
        // as a rough "one use" deduction. Default deduction: 1 day if no data.
        let deductDays = 1;
        if (match.shelfLifeDays && match.monthlyFrequency && match.monthlyFrequency > 0) {
          // One use ≈ shelfLife / (monthlyFrequency × 30 / shelfLife)
          // Simplified: deduct shelfLife / (uses per shelf life cycle)
          const usesPerCycle = (match.monthlyFrequency / 30) * match.shelfLifeDays;
          deductDays = Math.max(1, Math.round(match.shelfLifeDays / Math.max(usesPerCycle, 1)));
        }

        const currentEnd = new Date(match.estimatedEndDate);
        currentEnd.setDate(currentEnd.getDate() - deductDays);
        const newEnd = currentEnd.toISOString().split('T')[0];

        // Don't set end date before today
        const finalEnd = newEnd < today ? today : newEnd;

        await prisma.inventoryItem.update({
          where: { id: match.id },
          data: { estimatedEndDate: finalEnd },
        });
        consumed.push({ name: match.name, deductDays, newEndDate: finalEnd });
      }
    }

    res.json({
      success: true,
      data: {
        entry: serializePlanEntry(updatedEntry),
        consumed,
        message: `${slotMeal.name} marked as cooked${consumed.length > 0 ? `. Updated ${consumed.length} inventory item${consumed.length !== 1 ? 's' : ''}` : ''}.`,
      },
    });
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

    // Resolve staple overrides for all ingredients in parallel
    const overrides = await Promise.all(
      ingredients.map(ing => resolveStapleQty(ing.name, req.householdId))
    );

    const newItems = await prisma.$transaction(
      ingredients.map((ing, i) =>
        prisma.groceryItem.create({
          data: {
            ...enrichIngredient(ing.name, ing.quantity, meal.name, overrides[i]),
            listId,
            householdId: req.householdId,
          },
        })
      )
    );
    res.json({ success: true, data: newItems });
  } catch (err) { next(err); }
});

// POST /api/meals/add-ingredients-to-groceries
// Body: { ingredients: [{name, quantity}], mealName, listId }
// Used by suggestions "Add missing" and inventory check "Add missing" flows.
// Enriches each ingredient with shelf life + category from product knowledge
// so they auto-track to inventory when marked bought.
router.post('/add-ingredients-to-groceries', async (req, res, next) => {
  try {
    const { ingredients, mealName = 'meal', listId } = req.body;
    if (!listId) return res.status(422).json({ success: false, error: 'listId is required' });
    if (!ingredients?.length) return res.json({ success: true, data: [] });

    const list = await prisma.groceryList.findFirst({
      where: { id: listId, householdId: req.householdId },
    });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });

    const overrides = await Promise.all(
      ingredients.map(ing => resolveStapleQty(ing.name, req.householdId))
    );

    const newItems = await prisma.$transaction(
      ingredients.map((ing, i) =>
        prisma.groceryItem.create({
          data: {
            ...enrichIngredient(ing.name, ing.quantity, mealName, overrides[i]),
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
