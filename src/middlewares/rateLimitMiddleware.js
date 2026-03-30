const { getClientIp } = require('../utils/request');

function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const max = Number(options.max || 60);
  const buckets = new Map();

  return function rateLimiter(req, res, next) {
    const key = `${options.keyPrefix || 'global'}:${getClientIp(req)}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ message: options.message || 'Too many requests. Please try again later.' });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter
};
