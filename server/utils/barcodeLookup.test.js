const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProduct, categoryFromTags, lookupBarcode } = require('./barcodeLookup');

test('parses a found product', () => {
  const p = parseProduct({ status: 1, product: { product_name: ' Hazelnut spread ', brands: 'Nutella,Ferrero', quantity: '400 g e', categories_tags: ['en:spreads', 'en:sweet-spreads'] } });
  assert.deepEqual(p, { name: 'Hazelnut spread', brand: 'Nutella', quantity: '400 g', category: 'pantry' });
});

test('falls back to the brand when there is no product name; unknown products are null', () => {
  assert.equal(parseProduct({ status: 1, product: { product_name: '', brands: 'Amul' } }).name, 'Amul');
  assert.equal(parseProduct({ status: 0 }), null);
  assert.equal(parseProduct({ status: 1, product: {} }), null);
  assert.equal(parseProduct(null), null);
});

test('real product tags: Coca-Cola is a drink, Maggi is noodles, Nutella is a spread', () => {
  assert.equal(categoryFromTags(['en:beverages-and-beverages-preparations', 'en:beverages', 'en:non-alcoholic-beverages', 'en:carbonated-drinks', 'en:sodas', 'en:colas', 'pt:bebidas']), 'beverages');
  assert.equal(categoryFromTags(['en:plant-based-foods-and-beverages', 'en:plant-based-foods', 'en:dried-products', 'en:pastas', 'en:noodles', 'en:instant-noodles']), 'pasta-grains');
  assert.equal(categoryFromTags(['en:breakfasts', 'en:spreads', 'en:sweet-spreads', 'en:confectionary-based-spreads', 'fr:Nutella']), 'pantry');
});

test('maps Open Food Facts categories to grocery categories', () => {
  assert.equal(categoryFromTags(['en:dairies', 'en:milks']), 'dairy');
  assert.equal(categoryFromTags(['en:beverages', 'en:sodas']), 'beverages');
  assert.equal(categoryFromTags(['en:frozen-foods', 'en:frozen-vegetables']), 'frozen'); // frozen beats produce
  assert.equal(categoryFromTags(['en:biscuits']), 'bakery');
  assert.equal(categoryFromTags(['en:unheard-of-thing']), null);
  assert.equal(categoryFromTags(undefined), null);
});

test('lookups are cached, and a 404 is "not found", not an error', async () => {
  let calls = 0;
  const found = async () => { calls++; return { ok: true, status: 200, json: async () => ({ status: 1, product: { product_name: 'Milk' } }) }; };
  assert.equal((await lookupBarcode('11111111', found)).name, 'Milk');
  await lookupBarcode('11111111', found);
  assert.equal(calls, 1);
  assert.equal(await lookupBarcode('22222222', async () => ({ ok: false, status: 404 })), null);
  await assert.rejects(() => lookupBarcode('33333333', async () => ({ ok: false, status: 500 })), /failed \(500\)/);
});
