import { Router } from 'express';
import Subscription from '../models/Subscription.js';
import { authEnabled, optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);
router.use(requireAuth);

router.get('/stats', async (req, res, next) => {
  try {
    const filter = authEnabled() ? { user: req.user ? req.user._id : null } : {};
    const subscriptions = await Subscription.find(filter).lean();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    const active = subscriptions.filter(s => s.status === 'Active');
    const dueSoon = active.filter(s => {
      const date = new Date(s.renewalDate); date.setHours(0, 0, 0, 0);
      return date >= today && date <= nextWeek;
    });
    const overdue = active.filter(s => {
      const date = new Date(s.renewalDate); date.setHours(0, 0, 0, 0);
      return date < today;
    });
    const multiplier = { Weekly: 52 / 12, Monthly: 1, Quarterly: 1 / 3, Yearly: 1 / 12 };
    const monthlySpend = active.reduce((sum, s) => sum + Number(s.amount || 0) * (multiplier[s.billingCycle] || 1), 0);
    res.json({
      total: subscriptions.length,
      active: active.length,
      dueSoon: dueSoon.length,
      overdue: overdue.length,
      monthlySpend: Math.round(monthlySpend * 100) / 100
    });
  } catch (e) { next(e); }
});

export default router;
