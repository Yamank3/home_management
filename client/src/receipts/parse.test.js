import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReceipt, parseDate, parseTotal } from './parse.js';

const NOW = new Date(2026, 9, 2); // 2 Oct 2026

const SUPERMARKET = `RELIANCE FRESH
Plot 12, MG Road, Pune
GSTIN: 27AAACR1234A1Z5
Tel: 020 5555 1234
Bill No: 10234    Date: 28/09/2026 18:42
Basmati Rice 5kg        1   450.00
Amul Milk 1L            2    130.00
Tomato 1kg                    56.50
Sub Total                    636.50
CGST 2.5%                     12.10
SGST 2.5%                     12.10
Round Off                     -0.20
Total Qty: 4
NET PAYABLE                  660.50
Thank you, visit again`;

const RESTAURANT = `Spice Garden Restaurant
Invoice No 5521
01-10-26
Paneer Tikka        320.00
Butter Naan x4      160.00
Service Charge 5%    24.00
Total              504.00
GST 5%              25.20
Grand Total       ₹ 529.20`;

test('supermarket receipt: merchant, day-first date, net payable beats subtotal and tax lines', () => {
  const r = parseReceipt(SUPERMARKET, NOW);
  assert.equal(r.merchant, 'RELIANCE FRESH'.replace(/\w+/g, (w) => w[0] + w.slice(1).toLowerCase()));
  assert.equal(r.date, '2026-09-28');
  assert.equal(r.total, 660.5);
  assert.equal(r.category, 'groceries');
});

test('restaurant receipt: Grand Total beats Total, rupee symbol, 2-digit year', () => {
  const r = parseReceipt(RESTAURANT, NOW);
  assert.equal(r.total, 529.2);
  assert.equal(r.date, "2026-10-01");
  assert.equal(r.merchant, 'Spice Garden Restaurant');
  assert.equal(r.category, 'dining');
});

test('label and figure on separate lines (common in OCR output)', () => {
  assert.equal(parseTotal(['Apples 40.00', 'TOTAL', '1,250.00', 'Cash 1,300.00']), 1250);
});

test('Indian digit grouping and Rs. prefix', () => {
  assert.equal(parseTotal(['Total Amount Rs. 12,34,567.00']), 1234567);
  assert.equal(parseTotal(['Amount Due: ₹ 99']), 99);
});

test('without a total label it falls back to the largest amount with cents', () => {
  assert.equal(parseTotal(['Milk 55.00', 'Bread 40.50', 'GSTIN 27AAACR1234A1Z5', 'Phone 9876543210']), 55);
});

test('percentages and "total qty / total savings" are never the total', () => {
  assert.equal(parseTotal(['Total Qty 12', 'Total Savings 40.00', 'Total GST 18%', 'Total 300.00']), 300);
  assert.equal(parseTotal(['Total Savings 40.00']), 40); // only the fallback applies
});

test('date formats and plausibility', () => {
  assert.equal(parseDate('Date 1.10.2026', NOW), '2026-10-01');
  assert.equal(parseDate('2026-09-30 11:02', NOW), '2026-09-30');
  assert.equal(parseDate('12 Sep 2026', NOW), '2026-09-12');
  assert.equal(parseDate('Sept 3, 2026', NOW), '2026-09-03');
  assert.equal(parseDate('31/02/2026', NOW), null);           // not a real date
  assert.equal(parseDate('15/12/2030', NOW), null);           // future
  assert.equal(parseDate('01/01/2020', NOW), null);           // too old
  assert.equal(parseDate('no date here', NOW), null);
});

test('nothing recognisable gives nulls, not wrong guesses', () => {
  const r = parseReceipt('???\n~~~', NOW);
  assert.equal(r.total, null);
  assert.equal(r.date, null);
  assert.equal(r.merchant, null);
});

test('merchant skips header noise such as invoice, tax and phone lines', () => {
  assert.equal(parseReceipt('TAX INVOICE\nGSTIN 27AAA\nCafe Coffee House\nTotal 120.00', NOW).merchant, 'Cafe Coffee House');
});
