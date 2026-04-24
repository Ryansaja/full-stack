function getClientIp(req) {
  // Jika lewat Cloudflare, header ini yang paling akurat
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  getClientIp,
  asyncHandler
};
