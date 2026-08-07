const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const chores = await prisma.chore.findMany({
      where: { householdId: req.householdId },
      include: { completions: { orderBy: { completedAt: 'desc' }, take: 10 } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: chores.map(serialize) });
  } catch (err) { next(err); }
});

const choreSchema = z.object({
  name: z.string().min(1).max(200),
  assignedTo: z.string().default(''),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'as-needed']).default('weekly'),
  frequencyDays: z.array(z.number().int().min(0).max(6)).default([]),
  notes: z.string().default(''),
});

router.post('/', validate(choreSchema), async (req, res, next) => {
  try {
    const { frequencyDays, ...rest } = req.body;
    const chore = await prisma.chore.create({
      data: {
        ...rest,
        frequencyDays: JSON.stringify(frequencyDays),
        nextDueDate: computeNextDue(rest.frequency, frequencyDays),
        householdId: req.householdId,
      },
      include: { completions: true },
    });
    res.json({ success: true, data: serialize(chore) });
  } catch (err) { next(err); }
});

const choreUpdateSchema = choreSchema.partial();

router.patch('/:id', validate(choreUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.chore.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Chore not found' });

    const data = { ...req.body };
    if (data.frequencyDays) data.frequencyDays = JSON.stringify(data.frequencyDays);

    const chore = await prisma.chore.update({
      where: { id: req.params.id },
      data,
      include: { completions: { orderBy: { completedAt: 'desc' }, take: 10 } },
    });
    res.json({ success: true, data: serialize(chore) });
  } catch (err) { next(err); }
});

const completeSchema = z.object({ completedBy: z.string().default('') });

router.post('/:id/complete', validate(completeSchema), async (req, res, next) => {
  try {
    const existing = await prisma.chore.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Chore not found' });

    const freqDays = JSON.parse(existing.frequencyDays || '[]');

    await prisma.choreCompletion.create({
      data: { choreId: req.params.id, completedBy: req.body.completedBy || '' },
    });

    const chore = await prisma.chore.update({
      where: { id: req.params.id },
      data: {
        lastCompletedAt: new Date(),
        nextDueDate: computeNextDue(existing.frequency, freqDays),
      },
      include: { completions: { orderBy: { completedAt: 'desc' }, take: 10 } },
    });

    res.json({ success: true, data: serialize(chore) });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.chore.findFirst({
      where: { id: req.params.id, householdId: req.householdId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Chore not found' });
    await prisma.chore.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

function serialize(chore) {
  return {
    ...chore,
    frequencyDays: JSON.parse(chore.frequencyDays || '[]'),
    completionHistory: (chore.completions || []).map(c => ({
      completedAt: c.completedAt,
      completedBy: c.completedBy,
    })),
  };
}

function computeNextDue(frequency, frequencyDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().split('T')[0];

  if (frequency === 'daily') {
    const d = new Date(today); d.setDate(d.getDate() + 1); return fmt(d);
  }
  if (frequency === 'weekly') {
    if (frequencyDays?.length > 0) {
      const dow = today.getDay();
      const sorted = [...frequencyDays].sort((a, b) => a - b);
      let next = sorted.find(d => d > dow) ?? sorted[0];
      const diff = next > dow ? next - dow : 7 - dow + next;
      const d = new Date(today); d.setDate(d.getDate() + diff); return fmt(d);
    }
    const d = new Date(today); d.setDate(d.getDate() + 7); return fmt(d);
  }
  if (frequency === 'biweekly') { const d = new Date(today); d.setDate(d.getDate() + 14); return fmt(d); }
  if (frequency === 'monthly') { const d = new Date(today); d.setMonth(d.getMonth() + 1); return fmt(d); }
  return null;
}

module.exports = router;
