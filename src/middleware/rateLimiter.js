const rateLimit = require('express-rate-limit');
const config = require('../config');

// IPv6-compatible key generator
function generateKey(req, prefix = '') {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = req.user ? req.user._id : 'anon';
  return `${prefix}${ip}-${userId}`;
}

// Default rate limiter
const defaultLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 60000) // in minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'default-')
});

// Strict rate limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    error: 'Too many attempts for this operation, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'strict-')
});

// Prediction submission rate limiter
const predictionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 prediction actions per 5 minutes
  message: {
    error: 'Too many prediction actions, please slow down.',
    retryAfter: 5
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'pred-'),
  skip: (req) => {
    // Skip rate limiting for moderators and above
    if (req.user && ['moderator', 'admin', 'owner'].includes(req.user.role)) {
      return true;
    }
    return false;
  }
});

// Admin operations rate limiter
const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 admin actions per 10 minutes
  message: {
    error: 'Too many admin operations, please wait.',
    retryAfter: 10
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateKey(req, 'admin-')
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const identifier = req.body.email || req.body.username || '';
    return generateKey(req, `login-${identifier}-`);
  }
});

// Registration rate limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    error: 'Too many registration attempts, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiter based on user role
const dynamicLimiter = (req, res, next) => {
  if (!req.user) {
    return defaultLimiter(req, res, next);
  }

  // Different limits based on user role
  const roleLimits = {
    owner: { windowMs: 15 * 60 * 1000, max: 1000 },
    admin: { windowMs: 15 * 60 * 1000, max: 500 },
    moderator: { windowMs: 15 * 60 * 1000, max: 200 },
    user: { windowMs: 15 * 60 * 1000, max: 100 }
  };

  const limits = roleLimits[req.user.role] || roleLimits.user;
  
  const roleLimiter = rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    message: {
      error: 'Rate limit exceeded for your user level.',
      retryAfter: Math.ceil(limits.windowMs / 60000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => generateKey(req, `${req.user.role}-`)
  });

  return roleLimiter(req, res, next);
};

module.exports = {
  defaultLimiter,
  strictLimiter,
  predictionLimiter,
  adminLimiter,
  loginLimiter,
  registerLimiter,
  dynamicLimiter
};