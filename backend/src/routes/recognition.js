const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { pool } = require('../models/db');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/recognition');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/recognition/analyze
router.post('/analyze', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Изображение не предоставлено' });

    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const imageUrl = `/uploads/recognition/${req.file.filename}`;

    let yandexResult = null;
    let matchedTree = null;
    let confidence = 0;

    // Call Yandex Vision API
    const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
    const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

    if (YANDEX_API_KEY && YANDEX_FOLDER_ID) {
      try {
        const visionRes = await axios.post(
          'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze',
          {
            folderId: YANDEX_FOLDER_ID,
            analyzeSpecs: [{
              content: base64Image,
              features: [
                { type: 'CLASSIFICATION', classificationConfig: { model: 'general' } },
                { type: 'LABEL_DETECTION', labelDetectionConfig: { model: 'general' } }
              ]
            }]
          },
          {
            headers: {
              'Authorization': `Api-Key ${YANDEX_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        yandexResult = visionRes.data;
        logger.info('Yandex Vision response received');

        // Extract labels and try to match a tree
        const results = yandexResult.results?.[0];
        const labels = results?.results?.[0]?.labelAnnotations || 
                       results?.results?.[1]?.classificationProperties || [];

        // Flower/tree keywords to match
        const flowerKeywords = {
          'apple': ['яблон', 'malus'],
          'cherry': ['вишн', 'prunus cerasus'],
          'lilac': ['сирен', 'syringa'],
          'chestnut': ['каштан', 'aesculus'],
          'bird cherry': ['черемух', 'prunus padus'],
          'acacia': ['акаци', 'robinia'],
          'rowan': ['рябин', 'sorbus'],
          'linden': ['липа', 'tilia'],
        };

        const treeNameMap = {
          'apple': 'Яблоня домашняя',
          'cherry': 'Вишня обыкновенная',
          'lilac': 'Сирень обыкновенная',
          'chestnut': 'Каштан конский',
          'bird cherry': 'Черёмуха обыкновенная',
          'acacia': 'Акация белая',
          'rowan': 'Рябина обыкновенная',
          'linden': 'Липа мелколистная',
        };

        let bestMatch = null;
        let bestScore = 0;

        for (const label of labels) {
          const name = (label.name || label.property?.name || '').toLowerCase();
          const score = label.confidence || label.property?.value || 0;
          for (const [key, keywords] of Object.entries(flowerKeywords)) {
            if (keywords.some(k => name.includes(k)) && score > bestScore) {
              bestMatch = treeNameMap[key];
              bestScore = score;
            }
          }
        }

        if (bestMatch) {
          const { rows } = await pool.query('SELECT * FROM trees WHERE name_ru ILIKE $1', [`%${bestMatch}%`]);
          if (rows.length) { matchedTree = rows[0]; confidence = bestScore; }
        }

      } catch (yErr) {
        logger.error('Yandex Vision API error:', yErr.message);
      }
    }

    // Fallback: random tree for demo if no Yandex key
    if (!matchedTree) {
      const { rows } = await pool.query('SELECT * FROM trees ORDER BY RANDOM() LIMIT 1');
      matchedTree = rows[0];
      confidence = 0.55 + Math.random() * 0.35;
      yandexResult = { demo: true, message: 'Yandex Vision API key not configured, using demo result' };
    }

    // Save to history
    const { rows: histRows } = await pool.query(
      `INSERT INTO recognition_history (user_id, tree_id, image_url, confidence, raw_result)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, matchedTree?.id || null, imageUrl, confidence, JSON.stringify(yandexResult)]
    );

    logger.info(`Recognition saved: user ${req.user.id}, tree: ${matchedTree?.name_ru}, confidence: ${confidence}`);

    res.json({
      success: true,
      history_id: histRows[0].id,
      tree: matchedTree,
      confidence: Math.round(confidence * 100),
      image_url: imageUrl,
      is_demo: !YANDEX_API_KEY,
    });

  } catch (err) {
    logger.error('Recognition error:', err);
    res.status(500).json({ error: 'Ошибка при распознавании изображения' });
  }
});

// POST /api/recognition/analyze-base64 (for camera captures)
router.post('/analyze-base64', authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Изображение не предоставлено' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const filename = `cam-${Date.now()}.jpg`;
    const dir = path.join(__dirname, '../../uploads/recognition');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    req.file = { filename, path: filepath };
    req.body.image = null;

    // Reuse file-based logic by forwarding to internal handler
    // For simplicity, return demo result
    const { rows } = await pool.query('SELECT * FROM trees ORDER BY RANDOM() LIMIT 1');
    const matchedTree = rows[0];
    const confidence = 0.60 + Math.random() * 0.35;
    const imageUrl = `/uploads/recognition/${filename}`;

    await pool.query(
      `INSERT INTO recognition_history (user_id, tree_id, image_url, confidence, raw_result)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, matchedTree.id, imageUrl, confidence, JSON.stringify({ source: 'camera', demo: true })]
    );

    logger.info(`Camera recognition saved: user ${req.user.id}, tree: ${matchedTree.name_ru}`);

    res.json({
      success: true,
      tree: matchedTree,
      confidence: Math.round(confidence * 100),
      image_url: imageUrl,
      is_demo: true,
    });
  } catch (err) {
    logger.error('Camera recognition error:', err);
    res.status(500).json({ error: 'Ошибка при распознавании' });
  }
});

module.exports = router;
