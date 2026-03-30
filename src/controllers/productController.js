const { query } = require('../config/db');
const { sanitizeText, sanitizeUrl, sanitizeAssetUrl } = require('../utils/sanitize');
const { safeDeleteUpload, toStoredUploadUrl } = require('../utils/files');

function serializeProduct(row) {
  return {
    id: row.id,
    name: sanitizeText(row.name, { maxLength: 255 }),
    description: sanitizeText(row.description || '', { allowNewlines: true, maxLength: 5000 }),
    price: sanitizeText(row.price || '', { maxLength: 255 }),
    category: sanitizeText(row.category || '', { maxLength: 255 }),
    meta1: sanitizeText(row.meta1 || '', { maxLength: 255 }),
    meta2: sanitizeText(row.meta2 || '', { maxLength: 255 }),
    image_url: sanitizeAssetUrl(row.image_url || ''),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function productPayload(req, existing = {}) {
  const nextImage = req.file ? toStoredUploadUrl(req.file) : undefined;
  const meta1 = sanitizeText(req.body.meta1 || existing.meta1, { maxLength: 255 });
  const meta2 = sanitizeText(req.body.meta2 || existing.meta2, { maxLength: 255 });

  return {
    name: sanitizeText(req.body.name || req.body.title || existing.name, { maxLength: 255 }),
    description: sanitizeText(req.body.description || req.body.content || existing.description, { allowNewlines: true, maxLength: 5000 }),
    price: sanitizeText(req.body.price || existing.price || meta1, { maxLength: 255 }),
    category: sanitizeText(req.body.category || existing.category, { maxLength: 255 }),
    meta1: sanitizeUrl(req.body.link || existing.meta1 || meta1) || meta1,
    meta2,
    image_url: nextImage === undefined ? sanitizeAssetUrl(existing.image_url || '') : nextImage
  };
}

async function getProductByIdRaw(id) {
  const [rows] = await query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

exports.getAllProducts = async (req, res) => {
  const [rows] = await query('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows.map(serializeProduct));
};

exports.getProductById = async (req, res) => {
  const product = await getProductByIdRaw(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  return res.json(serializeProduct(product));
};

exports.createProduct = async (req, res) => {
  const payload = productPayload(req);
  if (!payload.name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  const [result] = await query(
    `INSERT INTO products
      (name, description, price, category, meta1, meta2, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.description,
      payload.price,
      payload.category,
      payload.meta1,
      payload.meta2,
      payload.image_url || null
    ]
  );

  res.status(201).json({ message: 'Product created successfully.', productId: result.insertId });
};

exports.updateProduct = async (req, res) => {
  const existing = await getProductByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });

  const payload = productPayload(req, existing);
  if (!payload.name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  await query(
    `UPDATE products
        SET name = ?, description = ?, price = ?, category = ?, meta1 = ?, meta2 = ?, image_url = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [
      payload.name,
      payload.description,
      payload.price,
      payload.category,
      payload.meta1,
      payload.meta2,
      payload.image_url || null,
      req.params.id
    ]
  );

  if (req.file && existing.image_url && existing.image_url !== payload.image_url) {
    safeDeleteUpload(existing.image_url);
  }

  res.json({ message: 'Product updated successfully.' });
};

exports.deleteProduct = async (req, res) => {
  const existing = await getProductByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });

  await query('DELETE FROM products WHERE id = ?', [req.params.id]);
  safeDeleteUpload(existing.image_url);

  res.json({ message: 'Product deleted successfully.' });
};
