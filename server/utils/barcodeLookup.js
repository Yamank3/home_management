// Barcode -> product details via Open Food Facts (free, open, no API key).
// Only the barcode number is sent; nothing about the household.

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';
const TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

// Open Food Facts category tags are whole tokens ("en:sodas"), so they are matched
// exactly, in priority order; substring matching misfires ("non-alcoholic-beverages"
// is not alcohol, "plant-based-foods-and-beverages" is not a drink).
const CATEGORY_TAGS = [
  ['frozen', ['frozen-foods', 'frozen-desserts', 'frozen-vegetables', 'frozen-meals', 'ice-creams']],
  ['dairy', ['dairies', 'milks', 'yogurts', 'cheeses', 'butters', 'eggs', 'creams', 'fermented-milk-products']],
  ['seafood', ['seafood', 'fishes', 'fish-and-seafood']],
  ['meat', ['meats', 'poultries', 'sausages', 'meat-based-products', 'chickens']],
  ['alcohol', ['alcoholic-beverages', 'wines', 'beers', 'spirits']],
  ['beverages', ['beverages', 'non-alcoholic-beverages', 'sodas', 'soft-drinks', 'juices', 'fruit-juices', 'waters', 'teas', 'coffees', 'energy-drinks']],
  ['pasta-grains', ['pastas', 'noodles', 'instant-noodles', 'rices', 'cereals', 'cereals-and-their-products', 'breakfast-cereals', 'flours']],
  ['canned-goods', ['canned-foods', 'canned-vegetables', 'canned-fruits', 'canned-fishes']],
  ['pantry', ['spreads', 'sauces', 'condiments', 'oils-and-fats', 'vegetable-oils', 'spices', 'salts', 'sugars', 'honeys', 'jams', 'ketchup', 'pickles', 'vinegars']],
  ['sweets', ['chocolates', 'candies', 'confectioneries', 'cocoa-and-its-products', 'sweet-snacks', 'desserts']],
  ['snacks', ['snacks', 'salty-snacks', 'chips-and-fries', 'crackers', 'appetizers', 'popcorn', 'nuts']],
  ['bakery', ['breads', 'biscuits', 'biscuits-and-cakes', 'cakes', 'pastries', 'cookies', 'viennoiseries', 'rusks']],
  ['produce', ['fruits', 'vegetables', 'fresh-foods', 'fresh-fruits', 'fresh-vegetables', 'fruits-and-vegetables-based-foods']],
  ['baby', ['baby-foods', 'baby-milks']],
  ['pet', ['pet-foods', 'dog-foods', 'cat-foods']],
];

function categoryFromTags(tags = []) {
  const ids = new Set(tags.filter((t) => t.startsWith('en:')).map((t) => t.slice(3)));
  for (const [category, names] of CATEGORY_TAGS) if (names.some((n) => ids.has(n))) return category;
  return null;
}

// Open Food Facts response body -> { name, brand, quantity, category } or null if unknown.
function parseProduct(json) {
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const brand = (p.brands || '').split(',')[0].trim();
  const name = (p.product_name || '').trim() || brand;
  if (!name) return null;
  return { name, brand, quantity: (p.quantity || '').replace(/\s+e$/i, '').trim(), category: categoryFromTags(p.categories_tags) };
}

const cache = new Map();

async function lookupBarcode(code, fetchFn = fetch) {
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const res = await fetchFn(`${OFF_URL}/${code}.json?fields=product_name,brands,quantity,categories_tags`, {
    headers: { 'User-Agent': 'HomeManagerApp/1.0 (household management)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let value = null;
  if (res.ok) value = parseProduct(await res.json());
  else if (res.status !== 404) throw new Error(`Product lookup failed (${res.status})`);

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(code, { value, at: Date.now() });
  return value;
}

module.exports = { lookupBarcode, parseProduct, categoryFromTags };
