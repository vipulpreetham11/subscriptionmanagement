import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authEnabled = () => process.env.AUTH_ENABLED !== 'false';

export async function optionalAuth(req, _res, next) {
  if (!authEnabled()) { req.user = null; return next(); }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret');
    req.user = await User.findById(payload.sub).select('_id name email');
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!authEnabled()) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret');
    req.authUserId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
