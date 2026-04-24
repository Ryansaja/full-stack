/**
 * Shared helpers for PAVED static frontend ↔ Express API.
 * Requires assets/config.js to define API_BASE_URL first.
 */
(function (global) {
  function baseUrl() {
    const u = global.API_BASE_URL || '';
    return String(u).replace(/\/+$/, '');
  }

  function apiRoot() {
    return baseUrl() + '/api';
  }

  function safeAbsoluteUrl(value) {
    const raw = String(value == null ? '' : value).trim();
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

  function mediaUrl(path) {
    const raw = String(path == null ? '' : path).trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return safeAbsoluteUrl(raw);
    if (/^\/uploads\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(raw)) return baseUrl() + raw;
    return '';
  }

  async function fetchJson(path, options) {
    const url = path.startsWith('http') ? path : apiRoot() + path;
    const res = await fetch(url, options);
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(t || res.statusText || String(res.status));
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function excerpt(text, max) {
    const noTags = String(text || '').replace(/<[^>]*>/g, '');
    const t = noTags.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trim() + '…';
  }

  function categorySlug(category) {
    const c = String(category || '').trim().toLowerCase();
    if (!c) return 'drafts';
    if (c.includes('red letter')) return 'red-letter';
    if (c.includes('sticky')) return 'sticky-notes';
    return c.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  /** Tailwind classes for category pill on light/dark pages */
  function categoryBadge(category) {
    const slug = categorySlug(category);
    const label =
      slug === 'pathfinder'
        ? 'Pathfinder'
        : slug === 'drafts'
          ? 'Drafts'
          : slug === 'sticky-notes'
            ? 'Sticky Notes'
            : slug === 'spotlight'
              ? 'Spotlight'
              : slug === 'red-letter'
                ? 'Red Letter'
                : escapeHtml(category || 'Article');
    const map = {
      pathfinder: 'bg-[#0061d2] text-white',
      drafts: 'bg-[#8cf503] text-black',
      'sticky-notes': 'bg-[#ffc20d] text-black',
      spotlight: 'bg-[#9147ff] text-white',
      'red-letter': 'bg-[#ca1c1d] text-white'
    };
    const pill = map[slug] || 'bg-[#18eb9a] text-black';
    return { slug, label, pill };
  }

  function formatDateIso(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
  }

  function formatDateLong(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function relativeTime(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    const diff = Date.now() - dt.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + ' min ago';
    const hr = Math.floor(min / 60);
    if (hr < 48) return hr + ' h ago';
    const day = Math.floor(hr / 24);
    if (day < 14) return day + ' days ago';
    return formatDateLong(dt);
  }

  function eventTypeLabel(category) {
    const c = String(category || '');
    if (/place/i.test(c)) return 'Place';
    return 'Event';
  }

  function guessCityKey(city) {
    const x = String(city || '').toLowerCase().trim();
    if (!x) return 'all';
    // Try to match against INDONESIA_CITIES list
    const cities = (typeof window !== 'undefined' && window.INDONESIA_CITIES) || [];
    for (let i = 0; i < cities.length; i++) {
      const c = cities[i].toLowerCase();
      if (x.includes(c) || c.includes(x)) {
        return c.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    }
    // Fallback: slugify the input itself
    return x.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'all';
  }

  global.PAVED_API = {
    baseUrl,
    apiRoot,
    safeAbsoluteUrl,
    mediaUrl,
    fetchJson,
    escapeHtml,
    excerpt,
    categorySlug,
    categoryBadge,
    formatDateIso,
    formatDateLong,
    relativeTime,
    eventTypeLabel,
    guessCityKey
  };
})(typeof window !== 'undefined' ? window : globalThis);
