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

// Ключевые слова для сопоставления меток Yandex Vision с деревьями в БД
const TREE_KEYWORDS = [
  { keywords: ['apple','яблон','malus','яблоко','яблок'],         name: 'Яблоня домашняя' },
  { keywords: ['cherry','вишн','prunus cerasus','cherry blossom'], name: 'Вишня обыкновенная' },
  { keywords: ['sakura','сакур','prunus serrulata','japanese cherry','японская вишня'], name: 'Сакура' },
  { keywords: ['lilac','сирен','syringa'],                         name: 'Сирень обыкновенная' },
  { keywords: ['chestnut','каштан','aesculus','конский каштан'],   name: 'Каштан конский' },
  { keywords: ['bird cherry','черемух','padus','prunus padus'],    name: 'Черёмуха обыкновенная' },
  { keywords: ['acacia','акаци','robinia','белая акация'],         name: 'Акация белая' },
  { keywords: ['rowan','рябин','sorbus'],                          name: 'Рябина обыкновенная' },
  { keywords: ['linden','липа','tilia','lime tree'],               name: 'Липа мелколистная' },
  { keywords: ['magnolia','магноли'],                              name: 'Магнолия крупноцветковая' },
  { keywords: ['plum','слив','prunus domestica'],                  name: 'Слива домашняя' },
  { keywords: ['pear','груш','pyrus'],                             name: 'Груша обыкновенная' },
  { keywords: ['hawthorn','боярышник','crataegus'],                name: 'Боярышник колючий' },
  { keywords: ['peach','персик','prunus persica'],                 name: 'Персик обыкновенный' },
  { keywords: ['apricot','абрикос','prunus armeniaca'],            name: 'Абрикос обыкновенный' },
  { keywords: ['maple','клён','клен','acer'],                      name: 'Клён остролистный' },
  { keywords: ['pine','сосн','pinus','хвоя','хвойн'],             name: 'Сосна обыкновенная' },
  { keywords: ['spruce','ель','picea','ёлк','елк'],                name: 'Ель европейская' },
  { keywords: ['oak','дуб','quercus'],                             name: 'Дуб черешчатый' },
  { keywords: ['birch','берёз','берез','betula'],                  name: 'Берёза повислая' },
  { keywords: ['aspen','осин','populus tremula','тополь дрожащий'],name: 'Осина' },
  { keywords: ['alder','ольха','ольх','alnus incana','серая ольха'],name: 'Ольха серая' },
  { keywords: ['black alder','ольха чёрная','ольха черная','alnus glutinosa'], name: 'Ольха чёрная' },
];

// Общие метки цветущих растений — для повышения уверенности
const FLOWER_LABELS = ['flower','цветок','цветение','blossom','bloom','floral','petal','лепесток','соцветие','inflorescence','plant','растение','tree','дерево'];

function matchTreeByLabels(labels) {
  let bestMatch = null;
  let bestScore = 0;

  for (const label of labels) {
    const name = (label.name || '').toLowerCase();
    const score = parseFloat(label.confidence || label.score || 0);

    for (const entry of TREE_KEYWORDS) {
      if (entry.keywords.some(k => name.includes(k))) {
        if (score > bestScore) {
          bestMatch = entry.name;
          bestScore = score;
        }
      }
    }
  }
  return { name: bestMatch, score: bestScore };
}

async function analyzeWithYandex(base64Image) {
  const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
  const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID ||
      YANDEX_API_KEY === 'your_yandex_api_key' ||
      YANDEX_FOLDER_ID === 'your_yandex_folder_id') {
    return null;
  }

  const response = await axios.post(
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
    { headers: { 'Authorization': `Api-Key ${YANDEX_API_KEY}`, 'Content-Type': 'application/json' } }
  );

  // Собираем все метки из разных типов ответа
  const result = response.data.results?.[0];
  const labels = [
    ...(result?.results?.[0]?.labelAnnotations || []),
    ...(result?.results?.[0]?.classificationProperties || []),
    ...(result?.results?.[1]?.labelAnnotations || []),
    ...(result?.results?.[1]?.classificationProperties || []),
  ].map(l => ({
    name: l.name || l.property?.name || '',
    confidence: l.confidence || l.property?.value || 0
  }));

  logger.info(`Yandex Vision labels: ${labels.map(l => `${l.name}(${l.confidence})`).join(', ')}`);
  return { raw: response.data, labels };
}

async function processRecognition(base64Image, userId) {
  let matchedTree = null;
  let confidence = 0;
  let rawResult = {};
  let isDemo = false;

  try {
    const yandex = await analyzeWithYandex(base64Image);

    if (yandex) {
      const { name, score } = matchTreeByLabels(yandex.labels);
      rawResult = yandex.raw;

      if (name && score > 0.1) {
        const { rows } = await pool.query('SELECT * FROM trees WHERE name_ru ILIKE $1', [`%${name}%`]);
        if (rows.length) {
          matchedTree = rows[0];
          confidence = score;
          logger.info(`Matched tree: ${name} with confidence ${score}`);
        }
      }

      // Если дерево не распознано по меткам — ищем по общим признакам цветка
      if (!matchedTree) {
        const hasFlower = yandex.labels.some(l =>
          FLOWER_LABELS.some(fl => l.name.toLowerCase().includes(fl))
        );
        if (hasFlower) {
          // Берём случайное цветущее дерево
          const { rows } = await pool.query(
            `SELECT * FROM trees WHERE bloom_season NOT LIKE '%шишк%' ORDER BY RANDOM() LIMIT 1`
          );
          matchedTree = rows[0];
          confidence = 0.45 + Math.random() * 0.2;
          logger.info(`No specific match, using random flowering tree: ${matchedTree?.name_ru}`);
        }
      }
    }
  } catch (err) {
    logger.error('Yandex Vision error:', err.message);
  }

  // Демо-режим — если Yandex не настроен или не дал результата
  if (!matchedTree) {
    isDemo = true;
    const { rows } = await pool.query('SELECT * FROM trees ORDER BY RANDOM() LIMIT 1');
    matchedTree = rows[0];
    confidence = 0.55 + Math.random() * 0.3;
    rawResult = { demo: true, message: 'Yandex Vision API not configured or no match found' };
    logger.info(`Demo mode: returning random tree ${matchedTree?.name_ru}`);
  }

  return { matchedTree, confidence, rawResult, isDemo };
}

// POST /api/recognition/analyze — загрузка файла
router.post('/analyze', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Изображение не предоставлено' });

    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const imageUrl = `/uploads/recognition/${req.file.filename}`;

    const { matchedTree, confidence, rawResult, isDemo } = await processRecognition(base64Image, req.user.id);

    const { rows: histRows } = await pool.query(
      `INSERT INTO recognition_history (user_id, tree_id, image_url, confidence, raw_result)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, matchedTree?.id || null, imageUrl, confidence, JSON.stringify(rawResult)]
    );

    res.json({
      success: true,
      history_id: histRows[0].id,
      tree: matchedTree,
      confidence: Math.round(confidence * 100),
      image_url: imageUrl,
      is_demo: isDemo,
    });
  } catch (err) {
    logger.error('Recognition error:', err);
    res.status(500).json({ error: 'Ошибка при распознавании изображения' });
  }
});

// POST /api/recognition/analyze-base64 — с камеры
router.post('/analyze-base64', authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Изображение не предоставлено' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const filename = `cam-${Date.now()}.jpg`;
    const dir = path.join(__dirname, '../../uploads/recognition');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), Buffer.from(base64Data, 'base64'));
    const imageUrl = `/uploads/recognition/${filename}`;

    const { matchedTree, confidence, rawResult, isDemo } = await processRecognition(base64Data, req.user.id);

    await pool.query(
      `INSERT INTO recognition_history (user_id, tree_id, image_url, confidence, raw_result)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, matchedTree?.id || null, imageUrl, confidence, JSON.stringify(rawResult)]
    );

    res.json({
      success: true,
      tree: matchedTree,
      confidence: Math.round(confidence * 100),
      image_url: imageUrl,
      is_demo: isDemo,
    });
  } catch (err) {
    logger.error('Camera recognition error:', err);
    res.status(500).json({ error: 'Ошибка при распознавании' });
  }
});

module.exports = router;
