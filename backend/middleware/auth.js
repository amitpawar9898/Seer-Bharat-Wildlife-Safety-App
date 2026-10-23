const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/** Verifies the Bearer token and attaches { id, role, name } to req.user. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Use after requireAuth to restrict a route to Forest Department accounts. */
function requireDept(req, res, next) {
  if (!req.user || req.user.role !== 'dept') {
    return res.status(403).json({ error: 'Forest Department access only' });
  }
  next();
}

module.exports = { requireAuth, requireDept, JWT_SECRET };
