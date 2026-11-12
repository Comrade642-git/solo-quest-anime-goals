const crypto = require('crypto');
const db = require('./db');

const SECRET_KEY = process.env.JWT_SECRET || 'solo-quest-anime-secret-key-super-secure-2026';

// PBKDF2 Password Hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

// Generate simple secure signed token
function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payloadB64).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// Express Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. System access token required.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }

  const user = db.findUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'Hunter not found in hunter registry.' });
  }

  req.user = user;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authMiddleware
};
