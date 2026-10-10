import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authEnabled, requireAuth } from '../middleware/auth.js';

const router = Router();
const tokenFor = user => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || 'development-only-secret', { expiresIn: '7d' });
const safeUser = user => ({ id: user._id, name: user.name, email: user.email });

router.post('/register', async (req, res, next) => {
  try {
    if (!authEnabled()) return res.status(400).json({ message: 'Authentication is disabled.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ message: 'Name must contain at least 2 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    if (!authEnabled()) return res.status(400).json({ message: 'Authentication is disabled.' });
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: tokenFor(user), user: safeUser(user) });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!authEnabled()) return res.json({ user: null });
    const user = await User.findById(req.authUserId).select('_id name email');
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    res.json({ user: safeUser(user) });
  } catch (e) { next(e); }
});

export default router;
