import jwt from 'jsonwebtoken';

const parseToken = (authHeader = '') => {
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) return token;
  return null;
};

export const optionalAuth = (req, _res, next) => {
  const token = parseToken(req.headers.authorization);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
  } catch (_err) {
    // ignore invalid token for optional auth
  }
  next();
};

export const authRequired = (req, res, next) => {
  const token = parseToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

