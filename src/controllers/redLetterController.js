const { query } = require('../config/db');
const { sanitizeText, sanitizeAssetUrl, sanitizeTrackId, sanitizeStatus } = require('../utils/sanitize');
const { safeDeleteUpload, toStoredUploadUrl } = require('../utils/files');

function serializeLetter(row) {
  const track = sanitizeTrackId(row.track || row.meta1 || '');
  return {
    id: row.id,
    title: sanitizeText(row.title || '', { maxLength: 255 }),
    to: sanitizeText(row.title || '', { maxLength: 255 }),
    msg: sanitizeText(row.message || row.description || '', { allowNewlines: true, maxLength: 8000 }),
    message: sanitizeText(row.message || row.description || '', { allowNewlines: true, maxLength: 8000 }),
    track,
    meta1: track,
    meta2: sanitizeText(row.meta2 || '', { maxLength: 255 }),
    date: sanitizeText(row.date || '', { maxLength: 255 }),
    description: sanitizeText(row.description || '', { allowNewlines: true, maxLength: 8000 }),
    image_url: sanitizeAssetUrl(row.image_url || ''),
    status: row.status || 'approved',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function letterPayload(req, existing = {}) {
  const nextImage = req.file ? toStoredUploadUrl(req.file) : undefined;
  const title = sanitizeText(
    req.body.to || req.body.title || existing.title || 'Anonymous',
    { maxLength: 255 }
  ) || 'Anonymous';
  const message = sanitizeText(
    req.body.message || req.body.msg || req.body.description || existing.message || existing.description,
    { allowNewlines: true, maxLength: 8000 }
  );
  const track = sanitizeTrackId(req.body.track || req.body.meta1 || existing.track || existing.meta1);

  return {
    title,
    message,
    track,
    date: sanitizeText(req.body.date || existing.date, { maxLength: 255 }),
    description: message,
    meta1: track,
    meta2: sanitizeText(req.body.meta2 || existing.meta2, { maxLength: 255 }),
    image_url: nextImage === undefined ? sanitizeAssetUrl(existing.image_url || '') : nextImage
  };
}

async function getLetterByIdRaw(id) {
  const [rows] = await query('SELECT * FROM red_letters WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

exports.getAllRedLetters = async (req, res) => {
  const includeUnpublished = req.user && req.user.role === 'admin';
  const sql = includeUnpublished
    ? 'SELECT * FROM red_letters ORDER BY created_at DESC'
    : "SELECT * FROM red_letters WHERE status = 'approved' ORDER BY created_at DESC";

  const [rows] = await query(sql);
  const letters = rows.map(serializeLetter);

  if (req.query.page || req.query.limit) {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 9), 1), 50);
    const start = (page - 1) * limit;
    const sliced = letters.slice(start, start + limit);

    return res.json({
      letters: sliced,
      data: sliced,
      hasMore: start + limit < letters.length,
      total: letters.length,
      page,
      limit
    });
  }

  return res.json(letters);
};

exports.getRedLetterById = async (req, res) => {
  const letter = await getLetterByIdRaw(req.params.id);
  if (!letter) return res.status(404).json({ message: 'Red letter not found.' });
  if (letter.status !== 'approved' && !(req.user && req.user.role === 'admin')) {
    return res.status(404).json({ message: 'Red letter not found.' });
  }
  return res.json(serializeLetter(letter));
};

exports.createRedLetter = async (req, res) => {
  const payload = letterPayload(req);
  if (!payload.title || !payload.message) {
    return res.status(400).json({ message: 'Recipient and message are required.' });
  }

  const isAdmin = !!req.user;
  const status = sanitizeStatus(req.body.status, isAdmin ? 'approved' : 'approved');
  const [result] = await query(
    `INSERT INTO red_letters
      (title, message, track, date, category, description, meta1, meta2, image_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.message,
      payload.track,
      payload.date,
      'Red Letter',
      payload.description,
      payload.meta1,
      payload.meta2,
      payload.image_url || null,
      status
    ]
  );

  return res.status(201).json({ message: 'Red letter saved successfully.', id: result.insertId });
};

exports.updateRedLetter = async (req, res) => {
  const existing = await getLetterByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Red letter not found.' });

  const payload = letterPayload(req, existing);
  if (!payload.title || !payload.message) {
    return res.status(400).json({ message: 'Recipient and message are required.' });
  }

  await query(
    `UPDATE red_letters
        SET title = ?, message = ?, track = ?, date = ?, description = ?, meta1 = ?, meta2 = ?, image_url = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [
      payload.title,
      payload.message,
      payload.track,
      payload.date,
      payload.description,
      payload.meta1,
      payload.meta2,
      payload.image_url || null,
      req.params.id
    ]
  );

  if (req.file && existing.image_url && existing.image_url !== payload.image_url) {
    safeDeleteUpload(existing.image_url);
  }

  return res.json({ message: 'Red letter updated successfully.' });
};

exports.deleteRedLetter = async (req, res) => {
  const existing = await getLetterByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Red letter not found.' });

  await query('DELETE FROM red_letters WHERE id = ?', [req.params.id]);
  safeDeleteUpload(existing.image_url);

  return res.json({ message: 'Red letter deleted successfully.' });
};
