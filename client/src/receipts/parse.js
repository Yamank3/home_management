// Turns the text a phone read off a receipt into a proposed expense. Heuristics, not
// magic: the result always goes to the user to review before anything is saved.

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// A date is believable if it is real, not in the future, and within the last 2 years.
function plausible(y, m, d, now) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return false;
  const days = (now - date) / 86400000;
  return days >= -1 && days <= 730;
}

const fullYear = (y) => (y < 100 ? 2000 + y : y);

// Receipts here write day first: 05/10/2026, 05-10-26, 5.10.2026, 05 Oct 2026, Oct 5, 2026, 2026-10-05.
export function parseDate(text, now = new Date()) {
  const candidates = [];
  for (const m of text.matchAll(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g)) candidates.push([+m[1], +m[2], +m[3]]);
  for (const m of text.matchAll(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})\b/g)) candidates.push([fullYear(+m[3]), +m[2], +m[1]]);
  for (const m of text.matchAll(/\b(\d{1,2})[ -]([A-Za-z]{3,4})[a-z]*[ ,.-]+(\d{2}|\d{4})\b/g)) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) candidates.push([fullYear(+m[3]), month, +m[1]]);
  }
  for (const m of text.matchAll(/\b([A-Za-z]{3,4})[a-z]*\.? (\d{1,2}),? (\d{4})\b/g)) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month) candidates.push([+m[3], month, +m[2]]);
  }
  const hit = candidates.find(([y, mo, d]) => plausible(y, mo, d, now));
  return hit ? iso(...hit) : null;
}

// An amount: 1,234.50 / 12,34,567.00 / 450 / ₹ 99.9 / Rs. 99
const AMOUNT = /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?!\d)/gi;
const toNumber = (s) => parseFloat(s.replace(/,/g, ''));

function amountsIn(line) {
  const noPercent = line.replace(/\d+(\.\d+)?\s*%/g, ' ');
  return [...noPercent.matchAll(AMOUNT)].map((m) => toNumber(m[1])).filter((n) => n > 0);
}

// Lines that contain "total" but are not the amount to pay.
const NOT_THE_TOTAL = /sub\s*-?\s*total|total\s*(qty|quantity|items?|units?|savings?|discount|gst|tax|cgst|sgst|igst|vat|cess|points)|round(ing)?\s*off|you saved|saving/i;

// Higher is a stronger signal that the line holds the amount to pay.
const TOTAL_SIGNALS = [
  [/grand\s*total/i, 100],
  [/(net|total|amount)\s*(amount\s*)?(payable|due)|payable\s*amount|balance\s*due|amount\s*due|to\s*pay/i, 95],
  [/net\s*(amount|total)|total\s*amount|bill\s*(amount|total)|invoice\s*(amount|total)/i, 90],
  [/\btotal\b/i, 70],
];

export function parseTotal(lines) {
  let best = null; // { weight, value, index }
  lines.forEach((line, index) => {
    if (NOT_THE_TOTAL.test(line)) return;
    const signal = TOTAL_SIGNALS.find(([re]) => re.test(line));
    if (!signal) return;
    // OCR often puts the label and the figure on separate lines.
    const value = amountsIn(line).at(-1) ?? amountsIn(lines[index + 1] ?? '')[0];
    if (!value) return;
    const weight = signal[1];
    // Stronger signal wins; among equals the lowest one on the receipt wins.
    if (!best || weight > best.weight || (weight === best.weight && index > best.index)) best = { weight, value, index };
  });
  if (best) return best.value;

  // No label found: the largest amount that has cents is the best guess.
  const all = lines.flatMap((l) => (/gstin|phone|ph:|tel|invoice|bill\s*no/i.test(l) ? [] : [...l.matchAll(/(\d[\d,]*\.\d{2})(?!\d)/g)].map((m) => toNumber(m[1]))));
  return all.length ? Math.max(...all) : null;
}

const NOT_A_NAME = /receipt|invoice|tax|gstin|cash\s*memo|bill\s*no|tel|phone|ph:|www\.|@|^\d|date|time|thank|welcome|original|duplicate|customer/i;

const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : s);

export function parseMerchant(lines) {
  const line = lines.slice(0, 6).find((l) => /[A-Za-z]{3,}/.test(l) && !NOT_A_NAME.test(l) && l.length <= 40);
  return line ? titleCase(line.replace(/[^\w&'’.\- ]/g, ' ').replace(/\s+/g, ' ').trim()) : null;
}

const CATEGORY_HINTS = [
  ['dining', /restaurant|cafe|café|bistro|pizza|burger|kitchen|biryani|dhaba|bakery|sweets|swiggy|zomato|food\s*court|dine/i],
  ['health', /pharmacy|chemist|medical|medicine|apollo|medplus|clinic|hospital|diagnostic|labs?\b/i],
  ['transport', /petrol|diesel|fuel|uber|ola\b|metro|parking|toll|railway|irctc/i],
  ['groceries', /super\s*market|supermarket|\bmart\b|bazaar|bazar|kirana|fresh|grocer|dmart|d-mart|big\s*basket|more\b|hypermarket|provision|vegetable|fruits/i],
  ['shopping', /mall|fashion|garments|clothing|electronics|retail|store|trends|westside/i],
];

export function guessCategory(text) {
  const hit = CATEGORY_HINTS.find(([, re]) => re.test(text));
  return hit ? hit[0] : 'other';
}

// text: the OCR output (lines separated by newlines).
export function parseReceipt(text, now = new Date()) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return {
    merchant: parseMerchant(lines),
    date: parseDate(text, now),
    total: parseTotal(lines),
    category: guessCategory(text),
  };
}
