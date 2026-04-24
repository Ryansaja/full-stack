const { query } = require('../config/db');
const { sanitizeText, sanitizeAssetUrl } = require('../utils/sanitize');
const { safeDeleteUpload, toStoredUploadUrl } = require('../utils/files');

function serializeAd(row) {
  return {
    id: row.id,
    image_url: sanitizeAssetUrl(row.image_url || ''),
    link_url: sanitizeText(row.link_url || '', { maxLength: 255 }),
    status: row.status || 'active',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function getAdByIdRaw(id) {
  const [rows] = await query('SELECT * FROM ads WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

exports.getActiveAds = async (req, res) => {
  const [rows] = await query("SELECT * FROM ads WHERE status = 'active' ORDER BY created_at DESC");
  return res.json(rows.map(serializeAd));
};

exports.getAllAdsAdmin = async (req, res) => {
  const [rows] = await query('SELECT * FROM ads ORDER BY created_at DESC');
  return res.json(rows.map(serializeAd));
};

exports.createAd = async (req, res) => {
  const linkUrl = sanitizeText(req.body.link_url || '', { maxLength: 255 });
  const imageUrl = req.file ? toStoredUploadUrl(req.file) : '';

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image is required for an Ad.' });
  }

  const status = req.body.status === 'inactive' ? 'inactive' : 'active';

  const [result] = await query(
    `INSERT INTO ads (image_url, link_url, status) VALUES (?, ?, ?)`,
    [imageUrl, linkUrl, status]
  );

  return res.status(201).json({
    message: 'Ad created successfully.',
    id: result.insertId
  });
};

exports.updateAd = async (req, res) => {
  const ad = await getAdByIdRaw(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found.' });

  const linkUrl = sanitizeText(req.body.link_url || ad.link_url, { maxLength: 255 });
  const status = req.body.status || ad.status;
  const nextImage = req.file ? toStoredUploadUrl(req.file) : undefined;
  const imageUrl = nextImage === undefined ? ad.image_url : nextImage;

  await query(
    `UPDATE ads SET image_url = ?, link_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [imageUrl, linkUrl, status, req.params.id]
  );

  if (req.file && ad.image_url && ad.image_url !== imageUrl) {
    safeDeleteUpload(ad.image_url);
  }

  return res.json({ message: 'Ad updated successfully.' });
};

exports.toggleAdStatus = async (req, res) => {
  const ad = await getAdByIdRaw(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found.' });

  const nextStatus = ad.status === 'active' ? 'inactive' : 'active';
  
  await query('UPDATE ads SET status = ? WHERE id = ?', [nextStatus, req.params.id]);
  return res.json({ message: `Ad status changed to ${nextStatus}.`, status: nextStatus });
};

exports.deleteAd = async (req, res) => {
  const ad = await getAdByIdRaw(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found.' });

  await query('DELETE FROM ads WHERE id = ?', [req.params.id]);
  safeDeleteUpload(ad.image_url);

  return res.json({ message: 'Ad deleted successfully.' });
};
