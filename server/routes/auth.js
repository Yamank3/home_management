const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { issueTokens, verify, pwFingerprint } = require('../utils/tokens');
const { seedRecipes } = require('../seed');

const router = express.Router();

const SALT_ROUNDS = 12;
function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/register — create household + first admin user
const registerSchema = z.object({
  householdName: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  memberCount: z.number().int().min(1).max(20).nullable().optional(),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { householdName, name, email, password, memberCount } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const household = await prisma.household.create({
      data: { name: householdName, memberCount: memberCount ?? null },
    });
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'admin', householdId: household.id },
    });

    res.json({ success: true, data: { user: safeUser(user), household, ...issueTokens(user) } });

    // Seed default recipes for the new household (fire and forget)
    seedRecipes(prisma, household.id).catch(() => {});
  } catch (err) { next(err); }
});

// POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { household: true } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    res.json({ success: true, data: { user: safeUser(user), household: user.household, ...issueTokens(user) } });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh — exchange a refresh token for a fresh pair (rotating).
// Logout is client-side: discard both tokens. Changing the password invalidates
// all refresh tokens (see pwFingerprint).
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    let payload;
    try {
      payload = verify(req.body.refreshToken, 'refresh');
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || pwFingerprint(user) !== payload.pw) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }
    res.json({ success: true, data: issueTokens(user) });
  } catch (err) { next(err); }
});

// GET /api/auth/me — return current user + household
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { household: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { user: safeUser(user), household: user.household } });
  } catch (err) { next(err); }
});

// POST /api/auth/household/invite — admin adds a member to their household
const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'member']).default('member'),
});

router.post('/household/invite', requireAuth, validate(inviteSchema), async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can invite members' });
    }
    const { name, email, password, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, householdId: req.householdId },
    });
    res.json({ success: true, data: safeUser(user) });
  } catch (err) { next(err); }
});

// GET /api/auth/household/members — list all members in household
router.get('/household/members', requireAuth, async (req, res, next) => {
  try {
    const members = await prisma.user.findMany({
      where: { householdId: req.householdId },
      select: { id: true, name: true, email: true, role: true, isShared: true, createdAt: true },
    });
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
});

// DELETE /api/auth/household/members/:id — admin removes a member
router.delete('/household/members/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can remove members' });
    }
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ success: false, error: 'Cannot remove yourself' });
    }
    const member = await prisma.user.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// PATCH /api/auth/me — update own name or password
const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
}).refine(d => !(d.newPassword && !d.currentPassword), {
  message: 'currentPassword required to set newPassword',
});

router.patch('/me', requireAuth, validate(updateMeSchema), async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    const updates = {};
    if (name) updates.name = name;
    if (newPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      updates.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    const updated = await prisma.user.update({ where: { id: req.user.userId }, data: updates });
    // A new password revokes every refresh token (see utils/tokens.js), so give
    // this device fresh ones or it would be signed out when its access token expires.
    res.json({ success: true, data: { user: safeUser(updated), ...(newPassword && issueTokens(updated)) } });
  } catch (err) { next(err); }
});

// PATCH /api/auth/household — update household settings (admin only)
router.patch('/household', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can update household settings' });
    }
    const { memberCount } = req.body;
    const household = await prisma.household.update({
      where: { id: req.householdId },
      data: { memberCount: memberCount != null ? parseInt(memberCount) : null },
    });
    res.json({ success: true, data: household });
  } catch (err) { next(err); }
});

module.exports = router;
