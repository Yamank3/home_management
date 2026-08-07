const express = require('express');
const prisma = require('../db');
const { lookupProduct } = require('../data/productKnowledge');
const { lookupRecipe } = require('../data/recipeKnowledge');

const router = express.Router();

// ── Normalise transcript ────────────────────────────────────────────────────

const FILLER = /\b(please|can you|could you|i want to|i need to|i'd like to|would you|kindly|just)\b/gi;

function normalise(text) {
  return text
    .toLowerCase()
    .replace(FILLER, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Quantity extraction ─────────────────────────────────────────────────────
// Matches "2 kg", "500 grams", "1 litre", "half kg", "ek kg" etc.

const QTY_RE = /\b([\d½¼¾]+\.?\d*)\s*(kg|kilo|kilogram|kilograms|g|gm|grams?|gram|litre|liter|litres|liters|l\b|ml|millilitres?|pieces?|pcs?|dozen|packets?|cans?)\b/i;
const WORD_NUM = { one:1, two:2, three:3, four:4, five:5, six:6, half:0.5, ek:1, do:2, teen:3, char:4 };

function extractQty(text) {
  const m = text.match(QTY_RE);
  if (m) return `${m[1]} ${m[2]}`;
  // word numbers: "two kg", "ek litre"
  for (const [word, num] of Object.entries(WORD_NUM)) {
    const re = new RegExp(`\\b${word}\\s+(kg|g|litre|liter|ml|packet)s?\\b`, 'i');
    const wm = text.match(re);
    if (wm) return `${num} ${wm[1]}`;
  }
  return '';
}

// ── Amount extraction for bills ────────────────────────────────────────────

function extractAmount(text) {
  const m = text.match(/(?:rs\.?|rupees?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|rupees?|₹)?/i);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
}

// ── Entity extraction ──────────────────────────────────────────────────────
// Extracts the item name between "add/remove" and "to/from/in"

function extractEntity(text, afterWord, beforeWord) {
  const after  = afterWord  ? new RegExp(`(?:${afterWord})\\s+(.+?)(?:\\s+(?:${beforeWord})|$)`, 'i') : null;
  const before = beforeWord ? new RegExp(`(.+?)\\s+(?:${beforeWord})`, 'i') : null;
  let m = after  ? text.match(after)  : null;
  if (!m) m = before ? text.match(before) : null;
  return m ? m[1].trim() : text.trim();
}

// ── Intent matching ─────────────────────────────────────────────────────────

function detectIntent(norm) {
  // grocery
  if (/\b(add|put|note)\b.+\b(grocery|groceries|shopping|list|sabzi|bazaar)\b/.test(norm))
    return 'grocery.add';
  if (/\b(mark|set)\b.+\b(bought|purchased|buy|kharid)\b/.test(norm))
    return 'grocery.bought';

  // inventory
  // inventory add
  if (/\b(add|put)\b.+\b(inventory|stock|store|shelf)\b/.test(norm))
    return 'inventory.add';
  // inventory remove — catch all natural phrasings
  if (/\b(remove|delete|hata|finish|finished|used up|out of|khatam)\b.+\b(inventory|stock|shelf|store)\b/.test(norm) ||
      /\b(inventory|stock)\b.+\b(remove|delete|hata|finish|finished|used up|khatam)\b/.test(norm) ||
      /\b(remove|delete)\b.+\b(from|se)\b.+\b(inventory|stock|shelf)\b/.test(norm))
    return 'inventory.remove';

  // meals
  if (/\b(add|save|create)\b.+\b(meal|recipe|dish|khana)\b/.test(norm) ||
      /\b(meal|recipe|dish|khana)\b.+\b(add|save|create)\b/.test(norm))
    return 'meal.add';
  if (/\b(plan|schedule|set)\b.+\b(breakfast|lunch|dinner|today|tomorrow|kal)\b/.test(norm))
    return 'meal.plan';
  if (/\b(what|kya)\b.*(cook|bana|suggest|recommendation)\b/.test(norm) ||
      /\b(suggest|recommend)\b.*\b(meal|food|khana)\b/.test(norm))
    return 'meal.suggest';

  // chores
  if (/\b(mark|set|complete|done|finish|kar diya)\b.+\b(chore|task|kaam)\b/.test(norm) ||
      /\b(chore|task|kaam)\b.+\b(done|complete|finish|kar diya)\b/.test(norm) ||
      /\b(mark|complete)\b.+\b(done|complete)\b/.test(norm))
    return 'chore.complete';
  if (/\b(add|create)\b.+\b(chore|task|kaam)\b/.test(norm))
    return 'chore.add';

  // bills
  if (/\b(add|create|note)\b.+\b(bill|expense|payment|bijli|rent|subscription)\b/.test(norm) ||
      /\b(bill|expense)\b.+\b(add|create|note)\b/.test(norm))
    return 'bill.add';

  return 'unknown';
}

// ── Route ────────────────────────────────────────────────────────────────────

router.post('/command', async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript?.trim())
      return res.status(422).json({ success: false, error: 'transcript is required' });

    const raw  = transcript.trim();
    const norm = normalise(raw);
    const intent = detectIntent(norm);
    const qty  = extractQty(norm);

    if (intent === 'unknown') {
      return res.json({
        success: true,
        data: {
          intent: 'unknown',
          transcript: raw,
          message: `Sorry, I didn't understand "${raw}". Try "add milk to groceries" or "mark dal tadka in meals".`,
        },
      });
    }

    // ── grocery.add ──────────────────────────────────────────────────────────
    if (intent === 'grocery.add') {
      const entity = extractEntity(norm, 'add|put|note', 'to|in|grocery|groceries|shopping|list|bazaar|sabzi');
      const product = lookupProduct(entity);

      const lists = await prisma.groceryList.findMany({
        where: { householdId: req.householdId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      if (!lists.length)
        return res.json({ success: true, data: { intent, message: 'No grocery list found. Create a list first.' } });

      const item = await prisma.groceryItem.create({
        data: {
          name:            product ? product.keywords[0].charAt(0).toUpperCase() + product.keywords[0].slice(1) : entity,
          category:        product?.category        || 'other',
          quantity:        qty || product?.quantity || '',
          shelfLifeDays:   product?.shelfLifeDays   ?? null,
          monthlyFrequency: product?.monthlyFrequency ?? null,
          note:            '',
          bought:          false,
          listId:          lists[0].id,
          householdId:     req.householdId,
        },
      });

      return res.json({
        success: true,
        data: {
          intent,
          item,
          message: `Added "${item.name}"${qty ? ` (${qty})` : ''} to your grocery list ✓`,
        },
      });
    }

    // ── inventory.add ────────────────────────────────────────────────────────
    if (intent === 'inventory.add') {
      const entity  = extractEntity(norm, 'add|put', 'to|in|inventory|stock|store|shelf');
      const product = lookupProduct(entity);

      const item = await prisma.inventoryItem.create({
        data: {
          name:            entity.charAt(0).toUpperCase() + entity.slice(1),
          category:        product?.category        || 'other',
          stockQuantity:   qty || product?.quantity || '',
          shelfLifeDays:   product?.shelfLifeDays   ?? null,
          monthlyFrequency: product?.monthlyFrequency ?? null,
          purchaseDate:    new Date().toISOString().split('T')[0],
          fromGrocery:     false,
          householdId:     req.householdId,
        },
      });

      return res.json({
        success: true,
        data: {
          intent,
          item,
          message: `Added "${item.name}" to inventory ✓`,
        },
      });
    }

    // ── inventory.remove ─────────────────────────────────────────────────────
    if (intent === 'inventory.remove') {
      // Extract the item name — strip all the intent keywords
      const entity = norm
        .replace(/\b(remove|delete|hata|finish|finished|used up|out of|khatam|from|the|inventory|stock|shelf|store|se)\b/g, '')
        .replace(/\s+/g, ' ').trim();

      if (!entity) {
        return res.json({
          success: true,
          data: { intent, message: 'Which item do you want to remove? Try "remove milk from inventory".' },
        });
      }

      // Find the best matching inventory item (fromGrocery or manual)
      const allItems = await prisma.inventoryItem.findMany({
        where: { householdId: req.householdId },
        select: { id: true, name: true },
      });

      const q = entity.toLowerCase();
      const match = allItems.find(i => {
        const n = i.name.toLowerCase();
        return n.includes(q) || q.includes(n) || n.split(/[\s(,]/)[0] === q.split(/[\s(,]/)[0];
      });

      if (!match) {
        return res.json({
          success: true,
          data: {
            intent,
            message: `No item matching "${entity}" found in inventory.`,
          },
        });
      }

      await prisma.inventoryItem.delete({ where: { id: match.id } });

      return res.json({
        success: true,
        data: {
          intent,
          message: `Removed "${match.name}" from inventory ✓`,
        },
      });
    }

    // ── meal.add ─────────────────────────────────────────────────────────────
    if (intent === 'meal.add') {
      const entity = extractEntity(norm, 'add|save|create', 'to|in|meal|recipe|dish|khana|library');
      const recipe = lookupRecipe(entity);

      const meal = await prisma.meal.create({
        data: {
          name:            recipe ? recipe.name : (entity.charAt(0).toUpperCase() + entity.slice(1)),
          type:            recipe?.type       || 'dinner',
          ingredients:     recipe ? JSON.stringify(recipe.ingredients) : '[]',
          prepTimeMinutes: recipe?.prepTimeMinutes ?? null,
          cookTimeMinutes: recipe?.cookTimeMinutes ?? null,
          servings:        recipe?.servings        ?? null,
          notes:           '',
          householdId:     req.householdId,
        },
      });

      return res.json({
        success: true,
        data: {
          intent,
          meal: { ...meal, ingredients: JSON.parse(meal.ingredients) },
          message: recipe
            ? `Added "${meal.name}" to meal library with ${recipe.ingredients.length} ingredients ✓`
            : `Added "${meal.name}" to meal library ✓`,
        },
      });
    }

    // ── meal.plan ────────────────────────────────────────────────────────────
    if (intent === 'meal.plan') {
      const slotMatch = norm.match(/\b(breakfast|lunch|dinner)\b/);
      const slot = slotMatch ? slotMatch[1] : 'dinner';
      const entity = extractEntity(norm, 'plan|schedule|set', `for|${slot}|today|tomorrow|kal`);
      const recipe = lookupRecipe(entity);

      // Find or create a meal in the library
      let meal = await prisma.meal.findFirst({
        where: { householdId: req.householdId, name: { contains: entity } },
      });
      if (!meal && recipe) {
        meal = await prisma.meal.create({
          data: {
            name: recipe.name, type: recipe.type,
            ingredients: JSON.stringify(recipe.ingredients),
            prepTimeMinutes: recipe.prepTimeMinutes ?? null,
            cookTimeMinutes: recipe.cookTimeMinutes ?? null,
            servings: recipe.servings ?? null,
            notes: '', householdId: req.householdId,
          },
        });
      }
      if (!meal)
        return res.json({ success: true, data: { intent, message: `Couldn't find meal "${entity}". Add it to your library first.` } });

      const today = new Date().toISOString().split('T')[0];
      const slotCol = `${slot}Id`;
      await prisma.mealPlanEntry.upsert({
        where: { date_householdId: { date: today, householdId: req.householdId } },
        update: { [slotCol]: meal.id },
        create: { date: today, [slotCol]: meal.id, notes: '', householdId: req.householdId },
      });

      return res.json({
        success: true,
        data: { intent, message: `Planned "${meal.name}" for ${slot} today ✓` },
      });
    }

    // ── meal.suggest ─────────────────────────────────────────────────────────
    if (intent === 'meal.suggest') {
      return res.json({
        success: true,
        data: { intent: 'meal.suggest', navigate: '/meals', message: 'Opening meal suggestions…' },
      });
    }

    // ── chore.complete ────────────────────────────────────────────────────────
    if (intent === 'chore.complete') {
      const entity = norm
        .replace(/\b(mark|complete|done|finish|set|the|as|kar diya|chore|task|kaam)\b/g, '')
        .replace(/\s+/g, ' ').trim();

      const chores = await prisma.chore.findMany({ where: { householdId: req.householdId } });
      // Fuzzy match: find chore whose name includes entity or entity includes chore name
      const match = chores.find(c =>
        c.name.toLowerCase().includes(entity) || entity.includes(c.name.toLowerCase())
      );
      if (!match)
        return res.json({ success: true, data: { intent, message: `No chore matching "${entity}" found.` } });

      await prisma.choreCompletion.create({ data: { choreId: match.id, completedBy: req.user?.name || '' } });
      const freqDays = JSON.parse(match.frequencyDays || '[]');
      await prisma.chore.update({
        where: { id: match.id },
        data: { lastCompletedAt: new Date(), nextDueDate: computeNextDue(match.frequency, freqDays) },
      });

      return res.json({
        success: true,
        data: { intent, message: `"${match.name}" marked as done ✓` },
      });
    }

    // ── chore.add ─────────────────────────────────────────────────────────────
    if (intent === 'chore.add') {
      const entity = extractEntity(norm, 'add|create', 'to|as|chore|task|kaam');
      const chore = await prisma.chore.create({
        data: {
          name: entity.charAt(0).toUpperCase() + entity.slice(1),
          frequency: 'weekly', frequencyDays: '[]',
          assignedTo: '', notes: '',
          nextDueDate: computeNextDue('weekly', []),
          householdId: req.householdId,
        },
      });
      return res.json({ success: true, data: { intent, message: `Added chore "${chore.name}" ✓` } });
    }

    // ── bill.add ──────────────────────────────────────────────────────────────
    if (intent === 'bill.add') {
      const amount = extractAmount(norm);
      if (!amount)
        return res.json({ success: true, data: { intent, message: 'Please say the bill amount, e.g. "add electricity bill 1500".' } });

      const entity = norm
        .replace(/[\d,]+(\.\d+)?/g, '')
        .replace(/\b(add|create|note|bill|expense|payment|rs|rupees|₹|the)\b/g, '')
        .replace(/\s+/g, ' ').trim();
      const name = entity.charAt(0).toUpperCase() + entity.slice(1) || 'Bill';

      const bill = await prisma.bill.create({
        data: {
          name, amount, currency: 'INR',
          category: 'other', frequency: 'monthly',
          isPaid: false, notes: '',
          householdId: req.householdId,
        },
      });

      return res.json({
        success: true,
        data: { intent, bill, message: `Added bill "${bill.name}" for ₹${amount} ✓` },
      });
    }

    res.json({ success: true, data: { intent: 'unknown', message: 'Command not recognised.' } });
  } catch (err) { next(err); }
});

function computeNextDue(frequency, freqDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = d => d.toISOString().split('T')[0];
  if (frequency === 'daily')    { const d = new Date(today); d.setDate(d.getDate() + 1); return fmt(d); }
  if (frequency === 'weekly')   { const d = new Date(today); d.setDate(d.getDate() + 7); return fmt(d); }
  if (frequency === 'biweekly') { const d = new Date(today); d.setDate(d.getDate() + 14); return fmt(d); }
  if (frequency === 'monthly')  { const d = new Date(today); d.setMonth(d.getMonth() + 1); return fmt(d); }
  return null;
}

module.exports = router;
