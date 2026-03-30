const path = require('path');

function toStringValue(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalizeWhitespace(value) {
  return toStringValue(value).replace(/\r\n/g, '\n').trim();
}

function sanitizeText(value, options = {}) {
  const raw = options.allowNewlines ? toStringValue(value).replace(/\r\n/g, '\n') : normalizeWhitespace(value);
  const stripped = raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
  const noTags = stripped.replace(/<[^>]*>/g, '');
  const normalized = options.allowNewlines
    ? noTags.replace(/[^\S\n]+/g, ' ').trim()
    : noTags.replace(/\s+/g, ' ').trim();
  return options.maxLength ? normalized.slice(0, options.maxLength) : normalized;
}

function sanitizeEmail(value) {
  const email = normalizeWhitespace(value).toLowerCase();
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function sanitizeUrl(value) {
  const raw = normalizeWhitespace(value);
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch (error) {
    return '';
  }

  return '';
}

function sanitizeAssetUrl(value) {
  const raw = normalizeWhitespace(value);
  if (!raw) return '';
  if (/^\/uploads\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(raw)) return raw;
  return sanitizeUrl(raw);
}

function sanitizeTrackId(value) {
  const raw = normalizeWhitespace(value);
  if (!raw) return '';
  const match = raw.match(/track\/([a-zA-Z0-9]+)|^([a-zA-Z0-9]{8,64})$/);
  if (!match) return '';
  return match[1] || match[2] || '';
}

function sanitizeFilename(file) {
  if (!file || !file.filename) return '';
  return path.basename(file.filename);
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  const raw = normalizeWhitespace(value).toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function sanitizeStatus(value, fallback = 'pending') {
  const raw = normalizeWhitespace(value).toLowerCase();
  if (raw === 'approved' || raw === 'rejected' || raw === 'pending') return raw;
  return fallback;
}

module.exports = {
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeAssetUrl,
  sanitizeTrackId,
  sanitizeFilename,
  parseBoolean,
  sanitizeStatus
};
