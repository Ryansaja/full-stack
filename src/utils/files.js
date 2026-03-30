const fs = require('fs');
const path = require('path');

const uploadRoot = path.resolve(__dirname, '../../uploads');

function toStoredUploadUrl(file) {
  if (!file || !file.filename) return '';
  return `/uploads/${path.basename(file.filename)}`;
}

function safeDeleteUpload(uploadPath) {
  if (!uploadPath || /^https?:\/\//i.test(uploadPath)) return;

  const normalized = path.resolve(uploadRoot, uploadPath.replace(/^\/?uploads[\\/]/i, ''));
  if (!normalized.startsWith(uploadRoot)) return;

  if (fs.existsSync(normalized)) {
    fs.unlinkSync(normalized);
  }
}

module.exports = {
  toStoredUploadUrl,
  safeDeleteUpload
};
