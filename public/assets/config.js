/**
 * Shared frontend API base resolution.
 * - Local/file previews use the local backend.
 * - Any production/static host uses the Railway backend below unless overridden.
 * - Same-origin is only used when explicitly overridden.
 */
(function () {
  var hostname =
    typeof window.location !== 'undefined'
      ? String(window.location.hostname || '').toLowerCase()
      : '';

  var isFile =
    typeof window.location !== 'undefined' &&
    window.location.protocol === 'file:';

  var isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  
  var base =
    typeof window.__PAVED_API_BASE__ === 'string' && window.__PAVED_API_BASE__.trim()
      ? window.__PAVED_API_BASE__.trim()
      : (isFile)
        ? 'http://localhost:5000'
        : '';

  window.API_BASE_URL = base.replace(/\/+$/, '');
})();
