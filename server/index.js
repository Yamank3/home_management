require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { requireAuth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const authRouter = require('./routes/auth');
const groceriesRouter = require('./routes/groceries');
const billsRouter = require('./routes/bills');
const choresRouter = require('./routes/chores');
const inventoryRouter = require('./routes/inventory');
const mealsRouter = require('./routes/meals');
const dashboardRouter = require('./routes/dashboard');
const voiceRouter = require('./routes/voice');

const { lookupProduct, scaleForHousehold } = require('./data/productKnowledge');
const { lookupRecipe, scaleRecipe }         = require('./data/recipeKnowledge');
const { seedRecipes }                        = require('./seed');
const prisma                                 = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Security
app.use(helmet({ contentSecurityPolicy: false }));
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL, // set this to your Netlify URL in production
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true });

// Routes
app.get('/api/ping', (req, res) => res.json({ success: true, data: 'pong' }));
app.get('/api/groceries/lookup', (req, res) => {
  const name        = (req.query.name || '').trim();
  const memberCount = parseInt(req.query.members) || 1;
  if (!name) return res.json({ success: true, data: null });
  const match = lookupProduct(name);
  if (!match) return res.json({ success: true, data: null });
  res.json({ success: true, data: scaleForHousehold(match, memberCount) });
});
app.get('/api/meals/recipe', (req, res) => {
  const name     = (req.query.name || '').trim();
  const servings = parseInt(req.query.servings) || 2;
  if (!name) return res.json({ success: true, data: null });
  const recipe = lookupRecipe(name);
  if (!recipe) return res.json({ success: true, data: null });
  res.json({ success: true, data: scaleRecipe(recipe, servings) });
});
app.use('/api/auth', authLimiter, authRouter);

// All other API routes require authentication
app.use('/api/groceries', requireAuth, groceriesRouter);
app.use('/api/bills', requireAuth, billsRouter);
app.use('/api/chores', requireAuth, choresRouter);
app.use('/api/inventory', requireAuth, inventoryRouter);
app.use('/api/meals', requireAuth, mealsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/voice', requireAuth, voiceRouter);

// Serve React build in production
if (IS_PROD) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', async () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let lanIp = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) lanIp = net.address;
    }
  }
  console.log(`\n Home Management Server`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${lanIp}:${PORT}`);
  if (IS_PROD) console.log(`\n  Open the above URL on your phone (same WiFi)\n`);

  // Seed default recipes for every existing household
  try {
    const households = await prisma.household.findMany({ select: { id: true } });
    for (const h of households) {
      await seedRecipes(prisma, h.id);
    }
  } catch (e) {
    console.error('Recipe seed error:', e.message);
  }
});
