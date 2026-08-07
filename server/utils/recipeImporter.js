// Recipe importer — scrapes recipe data from any URL using JSON-LD Schema.org/Recipe
// Falls back to OpenGraph + heuristic HTML parsing if JSON-LD is absent.
// Also handles YouTube URLs by extracting video title + description.

const cheerio = require('cheerio');

// node-fetch is ESM-only in v3 — use dynamic import
async function fetchHtml(url) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HomeManagementBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
    timeout: 10000,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Parse Schema.org HowToStep / RecipeIngredient lists
function parseJsonLd(html) {
  const $ = cheerio.load(html);
  const results = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      // handle @graph arrays
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of items) {
        if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
          results.push(item);
        }
      }
    } catch {}
  });
  return results[0] || null;
}

function parseIngredients(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map(i => {
      const str = typeof i === 'string' ? i : (i.text || i.name || '');
      return parseIngredientString(str.trim());
    })
    .filter(i => i.name);
}

// Parse a multi-line text block into individual ingredient lines
function parseIngredientBlock(text) {
  return text
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 2 && !/^ingredients?$/i.test(l))
    .map(l => {
      // Strip Hindi/Devanagari after '/' — keep English part only
      const english = l.split('/')[0].trim();
      return parseIngredientString(english);
    })
    .filter(i => i.name && i.name.length > 1);
}

// Extract ingredients from HTML using multiple strategies
function extractIngredientsFromHtml($) {
  // Strategy 1: structured list items with ingredient selectors
  const listSelectors = [
    '[itemprop="recipeIngredient"]',
    '.wprm-recipe-ingredient',
    '.wprm-recipe-ingredients li',
    '.tasty-recipe-ingredients li',
    '.recipe-ingredients li',
    '.ingredients li',
    '.recipe__ingredients li',
    '[class*="ingredient-list"] li',
    '[class*="ingredients-list"] li',
  ];
  for (const sel of listSelectors) {
    const els = $(sel);
    if (els.length > 2) {
      const ings = els.map((_, el) => parseIngredientString($(el).text().trim())).get().filter(i => i.name);
      if (ings.length > 2) return ings;
    }
  }

  // Strategy 2: block text with class*=ingredient — parse line by line
  const blockSelectors = ['[class*="ingredient"]', '[class*="Ingredient"]', '[id*="ingredient"]'];
  for (const sel of blockSelectors) {
    const els = $(sel);
    if (els.length > 0) {
      // Use the block with the most content
      let bestText = '';
      els.each((_, el) => {
        const txt = $(el).text();
        if (txt.length > bestText.length) bestText = txt;
      });
      const ings = parseIngredientBlock(bestText);
      if (ings.length > 2) return ings;
    }
  }

  return [];
}

// Split "2 cups all-purpose flour" → { quantity: "2 cups", name: "all-purpose flour" }
function parseIngredientString(str) {
  if (!str) return { name: '', quantity: '' };
  // Match leading number + unit
  const m = str.match(/^([\d½¼¾⅓⅔\s\/\.\-]+(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|g|kg|ml|l|oz|lb|lbs|pounds?|grams?|litres?|liters?|pieces?|pcs?|bunch|pinch|handful|cloves?|slices?|strips?|cans?|packets?)?\s*)/i);
  if (m) {
    return {
      quantity: m[1].trim(),
      name: str.slice(m[1].length).trim().replace(/^of\s+/i, ''),
    };
  }
  return { quantity: '', name: str };
}

function parseDuration(iso) {
  if (!iso) return null;
  // ISO 8601 duration e.g. PT1H30M or PT45M
  const h = iso.match(/(\d+)H/)?.[1] || 0;
  const m = iso.match(/(\d+)M/)?.[1] || 0;
  return parseInt(h) * 60 + parseInt(m) || null;
}

function mealType(name = '', categories = []) {
  const text = [name, ...categories].join(' ').toLowerCase();
  if (/breakfast|morning|cereal|pancake|waffle|omelette|egg|toast|poha|upma|paratha|idli|dosa/.test(text)) return 'breakfast';
  if (/lunch|salad|sandwich|wrap|soup|dal|sabzi/.test(text)) return 'lunch';
  if (/snack|appetizer|starter|chaat|samosa|pakora/.test(text)) return 'snack';
  return 'dinner';
}

// ── Main export ──────────────────────────────────────────────────────────────

async function importRecipeFromUrl(url) {
  if (/youtube\.com|youtu\.be/.test(url)) {
    return importFromYouTube(url);
  }
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const jsonLd = parseJsonLd(html);
  if (jsonLd) return extractFromJsonLd(jsonLd, url, $);
  return extractFromHtml(html, url);
}

async function importFromYouTube(url) {
  const { default: fetch } = await import('node-fetch');
  // Get video ID
  const vidMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = vidMatch?.[1];

  // Use oEmbed to get title
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  let title = 'Recipe from YouTube';
  try {
    const r = await fetch(oembedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (r.ok) {
      const d = await r.json();
      title = d.title || title;
    }
  } catch {}

  // Fetch the video page to get description (contains ingredient list in many cooking channels)
  let ingredients = [];
  let notes = `Imported from YouTube: ${url}`;
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // YouTube embeds JSON data in ytInitialData
    const scripts = $('script').map((_, el) => $(el).html()).get();
    for (const s of scripts) {
      if (s && s.includes('ytInitialData')) {
        const descMatch = s.match(/"description":\{"simpleText":"(.*?)"\}/);
        if (descMatch) {
          const desc = JSON.parse(`"${descMatch[1]}"`);
          notes = desc.slice(0, 500);
          // Try to extract ingredient lines — lines starting with numbers or bullet-like patterns
          const lines = desc.split(/\\n|\n/).map(l => l.trim()).filter(Boolean);
          const ingLines = lines.filter(l =>
            /^[\d½¼¾]|^\-\s|^•\s|^\*\s/.test(l) ||
            /\d+\s*(cup|tbsp|tsp|g|kg|ml|litre|piece|bunch|clove)/i.test(l)
          );
          if (ingLines.length > 0) {
            ingredients = ingLines.map(l => parseIngredientString(l.replace(/^[\-•*]\s*/, '')));
          }
          break;
        }
      }
    }
  } catch {}

  return {
    name: cleanTitle(title),
    type: mealType(title),
    ingredients: ingredients.filter(i => i.name),
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    servings: null,
    notes,
    sourceUrl: url,
  };
}

function extractFromJsonLd(recipe, url, $) {
  const name = recipe.name || 'Imported Recipe';
  let ingredients = parseIngredients(recipe.recipeIngredient);

  // If JSON-LD has very few ingredients, try HTML extraction which may have more
  if (ingredients.length < 3 && $) {
    const htmlIngs = extractIngredientsFromHtml($);
    if (htmlIngs.length > ingredients.length) ingredients = htmlIngs;
  }

  const prepTime = parseDuration(recipe.prepTime);
  const cookTime = parseDuration(recipe.cookTime);
  const servings = parseInt(recipe.recipeYield) || parseInt(recipe.recipeYield?.[0]) || null;
  const categories = Array.isArray(recipe.recipeCategory) ? recipe.recipeCategory : [recipe.recipeCategory || ''];
  const notes = recipe.description ? recipe.description.slice(0, 300) : '';

  return {
    name: cleanTitle(name),
    type: mealType(name, categories),
    ingredients,
    prepTimeMinutes: prepTime,
    cookTimeMinutes: cookTime,
    servings,
    notes,
    sourceUrl: url,
  };
}

function extractFromHtml(html, url) {
  const $ = cheerio.load(html);

  const name =
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text() ||
    'Imported Recipe';

  const ingredients = extractIngredientsFromHtml($);
  const description = $('meta[property="og:description"]').attr('content') || '';

  return {
    name: cleanTitle(name),
    type: mealType(name),
    ingredients,
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    servings: null,
    notes: description.slice(0, 300),
    sourceUrl: url,
  };
}

function cleanTitle(t) {
  return t
    .replace(/\s*[-|–—]\s*.+$/, '')   // remove " - Site Name" suffixes
    .replace(/^recipe\s*[:–-]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

module.exports = { importRecipeFromUrl };
