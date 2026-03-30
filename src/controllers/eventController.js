const { query } = require('../config/db');
const { sanitizeText, sanitizeEmail, sanitizeAssetUrl, sanitizeStatus } = require('../utils/sanitize');
const { safeDeleteUpload, toStoredUploadUrl } = require('../utils/files');

function serializeEvent(row) {
  return {
    id: row.id,
    title: sanitizeText(row.title, { maxLength: 255 }),
    category: sanitizeText(row.category || '', { maxLength: 255 }),
    city: sanitizeText(row.city || '', { maxLength: 255 }),
    event_time: row.event_time,
    price: sanitizeText(row.price || '', { maxLength: 255 }),
    description: sanitizeText(row.description || '', { allowNewlines: true, maxLength: 5000 }),
    organizer: sanitizeText(row.organizer || '', { maxLength: 255 }),
    reg_info: sanitizeText(row.reg_info || '', { maxLength: 255 }),
    email: sanitizeEmail(row.email || ''),
    image_url: sanitizeAssetUrl(row.image_url || ''),
    status: row.status || 'pending',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function eventPayload(req, existing = {}) {
  const nextImage = req.file ? toStoredUploadUrl(req.file) : undefined;
  return {
    title: sanitizeText(req.body.title || existing.title, { maxLength: 255 }),
    category: sanitizeText(req.body.category || existing.category, { maxLength: 255 }) || 'Event',
    city: sanitizeText(req.body.city || existing.city, { maxLength: 255 }),
    event_time: sanitizeText(req.body.event_time || existing.event_time, { maxLength: 255 }),
    price: sanitizeText(req.body.price || existing.price, { maxLength: 255 }),
    description: sanitizeText(req.body.description || existing.description, { allowNewlines: true, maxLength: 5000 }),
    organizer: sanitizeText(req.body.organizer || existing.organizer, { maxLength: 255 }),
    reg_info: sanitizeText(req.body.reg_info || existing.reg_info, { maxLength: 255 }),
    email: sanitizeEmail(req.body.email || existing.email),
    image_url: nextImage === undefined ? sanitizeAssetUrl(existing.image_url || '') : nextImage
  };
}

async function getEventByIdRaw(id) {
  const [rows] = await query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

exports.getAllEvents = async (req, res) => {
  const includeUnpublished = req.user && req.user.role === 'admin';
  const sql = includeUnpublished
    ? 'SELECT * FROM events ORDER BY COALESCE(event_time, created_at) DESC'
    : "SELECT * FROM events WHERE status = 'approved' ORDER BY COALESCE(event_time, created_at) DESC";
  const [rows] = await query(sql);
  return res.json(rows.map(serializeEvent));
};

exports.getAllEventsAdmin = async (req, res) => {
  const [rows] = await query('SELECT * FROM events ORDER BY created_at DESC');
  return res.json(rows.map(serializeEvent));
};

exports.getEventById = async (req, res) => {
  const event = await getEventByIdRaw(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found.' });
  if (event.status !== 'approved' && !(req.user && req.user.role === 'admin')) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  return res.json(serializeEvent(event));
};

exports.createEvent = async (req, res) => {
  const payload = eventPayload(req);
  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const status = sanitizeStatus(req.body.status, 'pending');
  const [result] = await query(
    `INSERT INTO events
      (title, category, city, event_time, price, description, organizer, reg_info, email, image_url, status)
     VALUES (?, ?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.category,
      payload.city,
      payload.event_time,
      payload.price,
      payload.description,
      payload.organizer,
      payload.reg_info,
      payload.email,
      payload.image_url || null,
      status
    ]
  );

  return res.status(201).json({
    message: status === 'approved' ? 'Event published successfully.' : 'Event submitted for review.',
    id: result.insertId
  });
};

exports.createEventAdmin = async (req, res) => {
  req.body.status = 'approved';
  return exports.createEvent(req, res);
};

exports.updateEvent = async (req, res) => {
  const existing = await getEventByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Event not found.' });

  const payload = eventPayload(req, existing);
  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  await query(
    `UPDATE events
        SET title = ?, category = ?, city = ?, event_time = NULLIF(?, ''), price = ?, description = ?,
            organizer = ?, reg_info = ?, email = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [
      payload.title,
      payload.category,
      payload.city,
      payload.event_time,
      payload.price,
      payload.description,
      payload.organizer,
      payload.reg_info,
      payload.email,
      payload.image_url || null,
      req.params.id
    ]
  );

  if (req.file && existing.image_url && existing.image_url !== payload.image_url) {
    safeDeleteUpload(existing.image_url);
  }

  return res.json({ message: 'Event updated successfully.' });
};

exports.deleteEvent = async (req, res) => {
  const existing = await getEventByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Event not found.' });

  await query('DELETE FROM events WHERE id = ?', [req.params.id]);
  safeDeleteUpload(existing.image_url);

  return res.json({ message: 'Event deleted successfully.' });
};

exports.approveEvent = async (req, res) => {
  const existing = await getEventByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Event not found.' });

  const nextPrice = sanitizeText(req.body.price || existing.price, { maxLength: 255 }) || existing.price;
  await query(
    "UPDATE events SET status = 'approved', price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [nextPrice || '', req.params.id]
  );
  return res.json({ message: 'Event approved.' });
};

exports.rejectEvent = async (req, res) => {
  const existing = await getEventByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Event not found.' });

  await query(
    "UPDATE events SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [req.params.id]
  );
  return res.json({ message: 'Event rejected.' });
};
