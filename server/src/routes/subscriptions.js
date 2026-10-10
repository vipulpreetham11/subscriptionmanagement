import { Router } from 'express';
import mongoose from 'mongoose';
import Subscription from '../models/Subscription.js';
import { authEnabled, optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);
router.use(requireAuth);

function ownerFilter(req) {
  if (!authEnabled()) return {};
  return req.user ? { user: req.user._id } : { user: null };
}
function payload(body) {
  const fields = ['serviceName', 'plan', 'amount', 'billingCycle', 'startDate', 'renewalDate', 'status', 'notes'];
  return Object.fromEntries(fields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
}
function validDates(data) {
  if (data.startDate && data.renewalDate && new Date(data.renewalDate) < new Date(data.startDate)) {
    return 'Renewal date cannot be earlier than the start date.';
  }
  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const filter = { ...ownerFilter(req) };
    const { search = '', status = '' } = req.query;
    if (status && ['Active', 'Paused', 'Cancelled'].includes(status)) filter.status = status;
    if (String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ serviceName: regex }, { plan: regex }];
    }
    const subscriptions = await Subscription.find(filter).sort({ renewalDate: 1, createdAt: -1 }).lean();
    res.json({ subscriptions });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid subscription ID.' });
    const item = await Subscription.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!item) return res.status(404).json({ message: 'Subscription not found.' });
    res.json({ subscription: item });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = payload(req.body);
    const dateError = validDates(data);
    if (dateError) return res.status(400).json({ message: dateError });
    const item = await Subscription.create({ ...data, user: authEnabled() ? req.authUserId : null });
    res.status(201).json({ subscription: item });
  } catch (e) { next(e); }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid subscription ID.' });
    const filter = { _id: req.params.id, ...ownerFilter(req) };
    const existing = await Subscription.findOne(filter);
    if (!existing) return res.status(404).json({ message: 'Subscription not found.' });
    const data = payload(req.body);
    const merged = { ...existing.toObject(), ...data };
    const dateError = validDates(merged);
    if (dateError) return res.status(400).json({ message: dateError });
    Object.assign(existing, data);
    await existing.save();
    res.json({ subscription: existing });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid subscription ID.' });
    const item = await Subscription.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });
    if (!item) return res.status(404).json({ message: 'Subscription not found.' });
    res.json({ message: 'Subscription deleted.' });
  } catch (e) { next(e); }
});

export default router;
