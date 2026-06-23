const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const logger = require('../utils/logger');

// GET /api/imageproxy?url=https://...
// Проксирует внешние картинки через бэкенд, обходя CORS и hotlinking
router.get('/', (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'url parameter required' });

  // Разрешаем только Wikimedia и несколько других безопасных источников
  const allowed = [
    'upload.wikimedia.org',
    'commons.wikimedia.org',
    'images.unsplash.com',
    'cdn.pixabay.com',
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!allowed.some(domain => parsedUrl.hostname.includes(domain))) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  const protocol = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FloraBot/1.0)',
      'Accept': 'image/*',
      'Referer': 'https://en.wikipedia.org/',
    },
    timeout: 10000,
  };

  const proxyReq = protocol.request(options, (proxyRes) => {
    // Следуем редиректам (до 3 раз)
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
      const redirectUrl = proxyRes.headers.location.startsWith('http')
        ? proxyRes.headers.location
        : `${parsedUrl.protocol}//${parsedUrl.hostname}${proxyRes.headers.location}`;
      return res.redirect(`/api/imageproxy?url=${encodeURIComponent(redirectUrl)}`);
    }

    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).json({ error: 'Image fetch failed' });
    }

    const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // кэш на 1 день
    res.set('Access-Control-Allow-Origin', '*');

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    logger.error('Image proxy error:', err.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'Image fetch timeout' });
  });

  proxyReq.end();
});

module.exports = router;
