const cors = require('cors');
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const redLetterRoutes = require('./routes/redLetterRoutes');
const productRoutes = require('./routes/productRoutes');
const eventRoutes = require('./routes/eventRoutes');
const spotifyRoutes = require('./routes/spotifyRoutes');
const adRoutes = require('./routes/adRoutes');
const { createRateLimiter } = require('./middlewares/rateLimitMiddleware');

const app = express();

// WAJIB KETIKA MENGGUNAKAN CLOUDFLARE/PROXY
// Agar Rate Limiter berjalan normal dan tidak memblokir semua request karena IP Cloudflare
app.set('trust proxy', 1);

function isAllowedOrigin(origin) {
  if (!origin || origin === 'null') return true;

  const normalizedOrigin = String(origin).replace(/\/+$/, '');
  const explicit = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (explicit.includes(normalizedOrigin)) return true;

  try {
    const parsed = new URL(normalizedOrigin);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    if (/\.netlify\.app$/i.test(parsed.hostname)) return true;
  } catch (error) {
    return false;
  }

  return false;
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS.'));
  }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  fallthrough: false
}));

// Clean URLs: strip .html extension from incoming requests (301 redirect)
app.use((req, res, next) => {
  // Only redirect GET requests for .html files (skip API, uploads, assets)
  if (req.method === 'GET' && req.path.endsWith('.html') && !req.path.startsWith('/api/')) {
    const clean = req.path.slice(0, -5); // remove ".html"
    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    return res.redirect(301, clean + qs);
  }
  next();
});

app.use(express.static(path.join(__dirname, '../public'), {
  extensions: ['html']  // /articles → articles.html
}));

app.use('/api/auth', createRateLimiter({ keyPrefix: 'auth', max: 10, windowMs: 60_000 }), authRoutes);
app.use('/api/spotify', createRateLimiter({ keyPrefix: 'spotify', max: 30, windowMs: 60_000 }), spotifyRoutes);
app.use('/api/articles', createRateLimiter({ keyPrefix: 'articles', max: 120, windowMs: 60_000 }), articleRoutes);
app.use('/api/red-letters', createRateLimiter({ keyPrefix: 'letters', max: 120, windowMs: 60_000 }), redLetterRoutes);
app.use('/api/products', createRateLimiter({ keyPrefix: 'products', max: 120, windowMs: 60_000 }), productRoutes);
app.use('/api/events', createRateLimiter({ keyPrefix: 'events', max: 120, windowMs: 60_000 }), eventRoutes);
app.use('/api/ads', createRateLimiter({ keyPrefix: 'ads', max: 120, windowMs: 60_000 }), adRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (err.message === 'Origin not allowed by CORS.') {
    return res.status(403).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint yang diminta tidak ditemukan.' });
});

module.exports = app;
