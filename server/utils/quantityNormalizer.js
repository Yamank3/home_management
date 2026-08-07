// Converts cooking quantities (1 tbsp, 2 cups, 1 tsp) to purchasable market units (g, ml).
// Accepts optional ingredient name for context-aware conversions
// (e.g. "coriander leaves" → grams, "coriander powder" → grams from spice volume).

const CONVERSIONS = {
  // Volume → ml
  tsp:         5,
  teaspoon:    5,
  teaspoons:   5,
  tbsp:        15,
  tablespoon:  15,
  tablespoons: 15,
  cup:         240,
  cups:        240,
  fl_oz:       30,
  // Weight → g
  oz:          28,
  ounce:       28,
  ounces:      28,
  lb:          454,
  lbs:         454,
  pound:       454,
  pounds:      454,
};

// Ingredients that are volumetrically measured in recipes but sold by weight.
// Maps ingredient keyword → grams per ml (density factor).
// When a recipe says "1 tbsp coriander powder", convert to grams (not ml).
const INGREDIENT_DENSITY = {
  // Dry powders / ground spices (density ~0.5–0.7 g/ml)
  powder:      0.6,
  masala:      0.6,
  flour:       0.5,
  atta:        0.5,
  maida:       0.5,
  besan:       0.55,
  sooji:       0.65,
  rava:        0.65,
  sugar:       0.85,
  salt:        1.2,
  // Fresh leaves bought by bunch (treat as grams, ~25g per 2 tbsp)
  leaves:      0.4,
  leaf:        0.4,
  herb:        0.4,
  dhania:      0.4,   // coriander leaves
  dhaniya:     0.4,
  pudina:      0.3,   // mint
  methi:       0.4,   // fenugreek leaves
  palak:       0.3,   // spinach
  // Seeds (density ~0.7)
  seeds:       0.7,
  seed:        0.7,
};

// Market package sizes to round up to (ml / g)
const MARKET_SIZES_ML = [50, 100, 200, 250, 500, 750, 1000, 1500, 2000];
const MARKET_SIZES_G  = [25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

function roundToMarketSize(value, sizes) {
  for (const size of sizes) {
    if (value <= size) return size;
  }
  return sizes[sizes.length - 1];
}

function formatUnit(value, isWeight) {
  if (isWeight) {
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} kg`;
    return `${value} g`;
  } else {
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} litre`;
    return `${value} ml`;
  }
}

function parseFraction(s) {
  s = s.trim();
  if (s === '½') return 0.5;
  if (s === '¼') return 0.25;
  if (s === '¾') return 0.75;
  if (s === '⅓') return 0.333;
  if (s === '⅔') return 0.667;
  if (s.includes('/')) {
    const [n, d] = s.split('/');
    return parseFloat(n) / parseFloat(d);
  }
  return parseFloat(s) || 0;
}

// Detect density factor from ingredient name — returns g/ml if it should be in grams, null otherwise
function getDensityFactor(ingredientName) {
  if (!ingredientName) return null;
  const name = ingredientName.toLowerCase();

  // Explicit coriander distinction
  if (/coriander|dhania|dhaniya|cilantro/.test(name)) {
    if (/powder|ground|dried/.test(name)) return 0.6; // powder → grams
    if (/leave|leaf|fresh|bunch/.test(name)) return 0.4; // leaves → grams
    // ambiguous "coriander" alone — if in a small amount (tsp) treat as powder
    return 0.6;
  }

  for (const [keyword, density] of Object.entries(INGREDIENT_DENSITY)) {
    if (name.includes(keyword)) return density;
  }
  return null;
}

// Returns true if ingredient is measured in volume units in the recipe
const VOLUME_UNITS = new Set(['tsp','teaspoon','teaspoons','tbsp','tablespoon','tablespoons','cup','cups','fl_oz']);

// Produce weight table: grams per piece by size.
// Keywords matched against ingredient name (lowercase).
// Weights are approximate Indian market standards.
const PRODUCE_WEIGHTS = [
  // Vegetables
  { keywords: ['potato','aloo','aaloo'],            small: 80,  medium: 150, large: 250 },
  { keywords: ['onion','pyaaz','pyaz','kanda'],      small: 80,  medium: 120, large: 200 },
  { keywords: ['tomato','tamatar'],                  small: 80,  medium: 100, large: 150 },
  { keywords: ['brinjal','baingan','eggplant'],      small: 100, medium: 200, large: 350 },
  { keywords: ['cauliflower','gobhi','phool gobhi'], small: 400, medium: 600, large: 900 },
  { keywords: ['cabbage','bandh gobhi'],             small: 400, medium: 700, large: 1000 },
  { keywords: ['capsicum','shimla mirch','bell pepper'], small: 80, medium: 120, large: 180 },
  { keywords: ['carrot','gajar'],                    small: 60,  medium: 100, large: 150 },
  { keywords: ['beetroot','chukandar'],              small: 100, medium: 150, large: 250 },
  { keywords: ['bottle gourd','lauki','ghiya'],      small: 300, medium: 500, large: 800 },
  { keywords: ['bitter gourd','karela'],             small: 80,  medium: 120, large: 180 },
  { keywords: ['ridge gourd','turai'],               small: 150, medium: 250, large: 400 },
  { keywords: ['okra','bhindi'],                     small: 10,  medium: 15,  large: 20  }, // per piece
  { keywords: ['cucumber','kheera','kakdi'],         small: 150, medium: 250, large: 350 },
  { keywords: ['radish','mooli'],                    small: 80,  medium: 150, large: 250 },
  { keywords: ['sweet potato','shakarkandi'],        small: 100, medium: 180, large: 280 },
  { keywords: ['colocasia','arbi','taro'],           small: 50,  medium: 80,  large: 120 },
  { keywords: ['drumstick','sahjan','sehjan'],       small: 30,  medium: 50,  large: 80  }, // per piece
  { keywords: ['raw banana','kachcha kela'],         small: 100, medium: 150, large: 200 },
  { keywords: ['green chilli','hari mirch'],         small: 5,   medium: 8,   large: 12  }, // per piece
  { keywords: ['ginger','adrak'],                    small: 10,  medium: 20,  large: 30  }, // per inch/piece
  // Fruits
  { keywords: ['lemon','nimbu'],                     small: 40,  medium: 60,  large: 80  },
  { keywords: ['banana','kela'],                     small: 80,  medium: 120, large: 160 },
  { keywords: ['apple','seb'],                       small: 120, medium: 180, large: 250 },
  { keywords: ['mango','aam'],                       small: 150, medium: 250, large: 400 },
  { keywords: ['orange','santra'],                   small: 120, medium: 180, large: 250 },
  { keywords: ['papaya','papita'],                   small: 400, medium: 800, large: 1500 },
  { keywords: ['coconut','nariyal'],                 small: 300, medium: 500, large: 700 },
  { keywords: ['pomegranate','anar'],                small: 200, medium: 300, large: 400 },
];

// Find produce entry by ingredient name
function findProduce(ingredientName) {
  if (!ingredientName) return null;
  const name = ingredientName.toLowerCase();
  return PRODUCE_WEIGHTS.find(p => p.keywords.some(k => name.includes(k))) || null;
}

// Detect size from quantity string: "small", "medium", "large"
function detectSize(qtyStr) {
  const q = (qtyStr || '').toLowerCase();
  if (/large|big/.test(q))  return 'large';
  if (/small/.test(q))      return 'small';
  return 'medium'; // default
}

// Convert "3 medium potatoes" → grams
// Returns normalized display string or null if not applicable
function convertProduceToGrams(qty, ingredientName) {
  const produce = findProduce(ingredientName);
  if (!produce) return null;

  const q = (qty || '').toLowerCase().trim();

  // Already in grams/kg — keep
  if (/\d+\s*(g|gm|gram|grams|kg)/.test(q)) return null;

  const size = detectSize(q);
  const gramsEach = produce[size];

  // Extract count: "3", "3 medium", "3-4", "½", etc.
  let count = 1;
  const numMatch = q.match(/^(\d+\.?\d*|½|¼|¾)/);
  if (numMatch) {
    count = parseFraction(numMatch[1]);
  }
  // Range like "3-4" — use upper bound
  const rangeMatch = q.match(/(\d+)\s*[-–to]\s*(\d+)/);
  if (rangeMatch) count = parseInt(rangeMatch[2]);

  const rawGrams = count * gramsEach;
  const rounded  = roundToMarketSize(rawGrams, MARKET_SIZES_G);
  return `${rounded} g`;
}

function parseQuantity(qty, ingredientName) {
  if (!qty) return null;
  const q = qty.toLowerCase().trim();

  // Already in purchasable units — keep as-is
  if (/^\d+(\.\d+)?\s*(g|gm|gram|grams|kg|ml|l\b|litre|liter|litres|liters)$/i.test(q)) {
    return { rawOk: true, display: qty };
  }
  // Non-numeric descriptors
  if (/taste|needed|garnish|frying|serving|pinch/i.test(q)) return { rawOk: true, display: qty };
  // Bad range data
  if (/\d+-\d+/.test(q)) return null;
  // "a bunch" / "1 bunch" → 25g for herbs
  if (/bunch/.test(q)) {
    const numMatch = q.match(/(\d+)/);
    const n = numMatch ? parseInt(numMatch[1]) : 1;
    return { rawOk: false, display: `${n * 25} g`, computed: n * 25, isWeight: true };
  }
  // "leaves" without quantity → 25g
  if (/leaves?$/.test(q) && !/\d/.test(q)) {
    return { rawOk: false, display: '25 g', computed: 25, isWeight: true };

  }

  // Match: optional whole + optional fraction + unit
  const m = q.match(/^(\d+)?\s*(½|¼|¾|⅓|⅔|\d+\/\d+)?\s*([a-z]+)\.?$/i) ||
            q.match(/^(\d*\.?\d+)\s*([a-z]+)\.?$/i);

  if (!m) return null;

  let value, unit;
  if (m.length === 4) {
    const whole = m[1] ? parseFloat(m[1]) : 0;
    const frac  = m[2] ? parseFraction(m[2]) : 0;
    value = whole + frac;
    unit  = m[3];
  } else {
    value = parseFloat(m[1]);
    unit  = m[2];
  }

  if (!value || !unit) return null;

  const factor = CONVERSIONS[unit.toLowerCase()];
  if (!factor) return null;

  const isVolumeUnit = VOLUME_UNITS.has(unit.toLowerCase());
  const rawMl = value * factor;

  // Check if this ingredient should be in grams despite a volume unit in the recipe
  const density = isVolumeUnit ? getDensityFactor(ingredientName) : null;

  if (density) {
    // Convert volume measurement to grams: ml × g/ml = g
    const rawG = rawMl * density;
    const rounded = roundToMarketSize(rawG, MARKET_SIZES_G);
    return { rawOk: false, display: formatUnit(rounded, true), computed: rounded, isWeight: true };
  }

  if (isVolumeUnit) {
    // Liquid volume — keep in ml
    const rounded = roundToMarketSize(rawMl, MARKET_SIZES_ML);
    return { rawOk: false, display: formatUnit(rounded, false), computed: rounded, isWeight: false };
  }

  // Weight unit (oz, lb) → grams
  const rounded = roundToMarketSize(rawMl, MARKET_SIZES_G);
  return { rawOk: false, display: formatUnit(rounded, true), computed: rounded, isWeight: true };
}

// Main export: normalize a quantity string to a purchasable unit.
// Pass ingredientName for context-aware conversions.
function normalizeToPurchasableQty(qty, ingredientName) {
  if (!qty) return qty;

  // 1. Try produce piece → grams conversion first
  const produceGrams = convertProduceToGrams(qty, ingredientName);
  if (produceGrams) return produceGrams;

  // 2. Fall back to cooking unit conversion (tbsp, tsp, cup → ml/g)
  const result = parseQuantity(qty, ingredientName);
  if (!result) return qty;
  if (result.rawOk) return result.display;
  return result.display;
}

module.exports = { normalizeToPurchasableQty };
