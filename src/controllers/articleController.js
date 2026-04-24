const { query } = require('../config/db');
const { sanitizeText, sanitizeHtml, sanitizeEmail, sanitizeAssetUrl, sanitizeStatus, parseBoolean } = require('../utils/sanitize');
const { safeDeleteUpload, toStoredUploadUrl } = require('../utils/files');

function serializeArticle(row) {
  return {
    id: row.id,
    title: sanitizeText(row.title, { maxLength: 255 }),
    content: sanitizeHtml(row.content || '', { maxLength: 50000 }),
    description: sanitizeHtml(row.description || '', { maxLength: 50000 }),
    category: sanitizeText(row.category || '', { maxLength: 255 }),
    meta1: sanitizeText(row.meta1 || '', { maxLength: 255 }),
    meta2: sanitizeText(row.meta2 || '', { maxLength: 255 }),
    author_name: sanitizeText(row.author_name || '', { maxLength: 255 }),
    author_email: sanitizeEmail(row.author_email || ''),
    author_social: sanitizeText(row.author_social || '', { maxLength: 255 }),
    image_url: sanitizeAssetUrl(row.image_url || ''),
    status: row.status || 'pending',
    is_recommended: !!row.is_recommended,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function articlePayload(req, existing = {}) {
  const nextImage = req.file ? toStoredUploadUrl(req.file) : undefined;
  const title = sanitizeText(req.body.title || existing.title, { maxLength: 255 });
  const content = sanitizeHtml(req.body.content ?? existing.content, { maxLength: 50000 });
  const descriptionSource = req.body.description !== undefined ? req.body.description : existing.description;
  const description = sanitizeHtml(descriptionSource || content, { maxLength: 50000 });
  const category = sanitizeText(req.body.category || existing.category, { maxLength: 255 }) || 'Drafts';

  return {
    title,
    content,
    description,
    category,
    meta1: sanitizeText(req.body.meta1 || existing.meta1, { maxLength: 255 }),
    meta2: sanitizeText(req.body.meta2 || existing.meta2, { maxLength: 255 }),
    author_name: sanitizeText(req.body.author_name || existing.author_name || 'Anonymous', { maxLength: 255 }) || 'Anonymous',
    author_email: sanitizeEmail(req.body.author_email || existing.author_email),
    author_social: sanitizeText(req.body.author_social || existing.author_social, { maxLength: 255 }),
    image_url: nextImage === undefined ? sanitizeAssetUrl(existing.image_url || '') : nextImage
  };
}

async function getArticleByIdRaw(id) {
  const [rows] = await query('SELECT * FROM articles WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

exports.getAllArticles = async (req, res) => {
  const includeUnpublished = req.user && req.user.role === 'admin';
  const sql = includeUnpublished
    ? 'SELECT * FROM articles ORDER BY is_recommended DESC, created_at DESC'
    : "SELECT * FROM articles WHERE status = 'approved' ORDER BY is_recommended DESC, created_at DESC";
  const [rows] = await query(sql);
  return res.json(rows.map(serializeArticle));
};

exports.getAllArticlesAdmin = async (req, res) => {
  const [rows] = await query('SELECT * FROM articles ORDER BY created_at DESC');
  return res.json(rows.map(serializeArticle));
};

exports.getArticleById = async (req, res) => {
  const article = await getArticleByIdRaw(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found.' });
  if (article.status !== 'approved' && !(req.user && req.user.role === 'admin')) {
    return res.status(404).json({ message: 'Article not found.' });
  }
  return res.json(serializeArticle(article));
};

exports.createArticle = async (req, res) => {
  const payload = articlePayload(req);
  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const status = sanitizeStatus(req.body.status, 'pending');
  const [result] = await query(
    `INSERT INTO articles
      (title, content, description, category, meta1, meta2, author_name, author_email, author_social, image_url, status, is_recommended)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      payload.title,
      payload.content,
      payload.description,
      payload.category,
      payload.meta1,
      payload.meta2,
      payload.author_name,
      payload.author_email,
      payload.author_social,
      payload.image_url || null,
      status
    ]
  );

  return res.status(201).json({
    message: status === 'approved' ? 'Article published successfully.' : 'Article submitted for review.',
    id: result.insertId
  });
};

exports.createArticleAdmin = async (req, res) => {
  req.body.status = 'approved';
  return exports.createArticle(req, res);
};

exports.updateArticle = async (req, res) => {
  const existing = await getArticleByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Article not found.' });

  const payload = articlePayload(req, existing);
  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  await query(
    `UPDATE articles
        SET title = ?, content = ?, description = ?, category = ?, meta1 = ?, meta2 = ?,
            author_name = ?, author_email = ?, author_social = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [
      payload.title,
      payload.content,
      payload.description,
      payload.category,
      payload.meta1,
      payload.meta2,
      payload.author_name,
      payload.author_email,
      payload.author_social,
      payload.image_url || null,
      req.params.id
    ]
  );

  if (req.file && existing.image_url && existing.image_url !== payload.image_url) {
    safeDeleteUpload(existing.image_url);
  }

  return res.json({ message: 'Article updated successfully.' });
};

exports.deleteArticle = async (req, res) => {
  const existing = await getArticleByIdRaw(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Article not found.' });

  await query('DELETE FROM articles WHERE id = ?', [req.params.id]);
  safeDeleteUpload(existing.image_url);

  return res.json({ message: 'Article deleted successfully.' });
};

exports.toggleRecommendArticle = async (req, res) => {
  const article = await getArticleByIdRaw(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found.' });

  const nextValue = req.body.is_recommended !== undefined
    ? parseBoolean(req.body.is_recommended)
    : !article.is_recommended;

  await query('UPDATE articles SET is_recommended = ? WHERE id = ?', [nextValue ? 1 : 0, req.params.id]);
  return res.json({ message: 'Recommendation updated.', is_recommended: nextValue });
};

exports.approveArticle = async (req, res) => {
  const article = await getArticleByIdRaw(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found.' });

  await query(
    "UPDATE articles SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [req.params.id]
  );
  return res.json({ message: 'Article approved.' });
};

exports.rejectArticle = async (req, res) => {
  const article = await getArticleByIdRaw(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found.' });

  await query(
    "UPDATE articles SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [req.params.id]
  );
  return res.json({ message: 'Article rejected.' });
};
