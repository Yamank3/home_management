const express = require('express');
const { lookupBarcode } = require('../utils/barcodeLookup');

const router = express.Router();

// GET /api/products/barcode/:code — { name, brand, quantity, category } or null if unknown.
router.get('/barcode/:code', async (req, res) => {
  const { code } = req.params;
  if (!/^\d{8,14}$/.test(code)) return res.status(400).json({ success: false, error: 'Not a valid barcode number' });
  try {
    res.json({ success: true, data: await lookupBarcode(code) });
  } catch {
    res.status(502).json({ success: false, error: 'Product lookup is unavailable right now' });
  }
});

module.exports = router;
