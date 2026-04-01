const axios = require('axios');

const { sanitizeText } = require('../utils/sanitize');

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are not configured.');
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10_000
    }
  );

  cachedToken = response.data.access_token;
  cachedTokenExpiresAt = now + Math.max((Number(response.data.expires_in || 3600) - 60) * 1000, 60_000);
  return cachedToken;
}

exports.searchTracks = async (req, res) => {
  try {
    const query = sanitizeText(req.query.q, { maxLength: 120 });
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 10);
    const market = sanitizeText(req.query.market || process.env.SPOTIFY_MARKET || 'ID', { maxLength: 2 }).toUpperCase();
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: { q: query, type: 'track', limit, market },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10_000
    });

    const items = (((response.data || {}).tracks || {}).items || []).map((item) => ({
      id: item.id,
      name: item.name,
      artist: (item.artists || []).map((artist) => artist.name).join(', '),
      image: item.album && item.album.images && item.album.images[0] ? item.album.images[0].url : '',
      url: item.external_urls ? item.external_urls.spotify : ''
    }));

    return res.json({ tracks: items });
  } catch (error) {
    const message = error.response?.data?.error_description
      || error.response?.data?.error?.message
      || error.message
      || 'Spotify search failed.';
    return res.status(502).json({ message });
  }
};
