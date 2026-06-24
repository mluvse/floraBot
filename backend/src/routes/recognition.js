const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
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

// ========== PL@NTNET API ==========

const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY;
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/all';

// Ключевые слова для сопоставления с деревьями в БД
const TREE_KEYWORDS = [
  { keywords: ['apple','яблон','malus','яблоко'], name: 'Яблоня домашняя' },
  { keywords: ['cherry','вишн','prunus cerasus'], name: 'Вишня обыкновенная' },
  { keywords: ['sakura','сакур','prunus serrulata','japanese cherry'], name: 'Сакура' },
  { keywords: ['lilac','сирен','syringa'], name: 'Сирень обыкновенная' },
  { keywords: ['chestnut','каштан','aesculus','конский каштан'], name: 'Каштан конский' },
  { keywords: ['bird cherry','черемух','padus','prunus padus'], name: 'Черёмуха обыкновенная' },
  { keywords: ['acacia','акаци','robinia','белая акация'], name: 'Акация белая' },
  { keywords: ['rowan','рябин','sorbus'], name: 'Рябина обыкновенная' },
  { keywords: ['linden','липа','tilia'], name: 'Липа мелколистная' },
  { keywords: ['magnolia','магноли'], name: 'Магнолия крупноцветковая' },
  { keywords: ['plum','слив','prunus domestica'], name: 'Слива домашняя' },
  { keywords: ['pear','груш','pyrus'], name: 'Груша обыкновенная' },
  { keywords: ['hawthorn','боярышник','crataegus'], name: 'Боярышник колючий' },
  { keywords: ['peach','персик','prunus persica'], name: 'Персик обыкновенный' },
  { keywords: ['apricot','абрикос','prunus armeniaca'], name: 'Абрикос обыкновенный' },
  { keywords: ['maple','клён','клен','acer'], name: 'Клён остролистный' },
  { keywords: ['pine','сосн','pinus','хвоя'], name: 'Сосна обыкновенная' },
  { keywords: ['spruce','ель','picea','ёлк','елк'], name: 'Ель европейская' },
  { keywords: ['oak','дуб','quercus'], name: 'Дуб черешчатый' },
  { keywords: ['birch','берёз','берез','betula'], name: 'Берёза повислая' },
  { keywords: ['aspen','осин','populus tremula'], name: 'Осина' },
  { keywords: ['alder','ольха','alnus'], name: 'Ольха' },
  { keywords: ['poplar','топол','populus'], name: 'Тополь' },
  { keywords: ['willow','ива','salix'], name: 'Ива' },
  { keywords: ['elm','вяз','ulmus'], name: 'Вяз' },
  { keywords: ['ash','ясень','fraxinus'], name: 'Ясень' },
  { keywords: ['lime','липа','tilia'], name: 'Липа' },
];

async function analyzeWithPlantNet(imageBuffer) {
  if (!PLANTNET_API_KEY || PLANTNET_API_KEY === 'your_plantnet_api_key') {
    return null;
  }

  try {
    const form = new FormData();
    form.append('images', imageBuffer, { filename: 'flower.jpg', contentType: 'image/jpeg' });
    form.append('organs', 'flower'); // Указываем, что фото цветка

    const response = await axios.post(
      `${PLANTNET_API_URL}?api-key=${PLANTNET_API_KEY}`,
      form,
      { headers: form.getHeaders(), timeout: 15000 }
    );

    const results = response.data.results || [];
    if (results.length === 0) return null;

    // Берём топ-3 результата
    const topResults = results.slice(0, 3).map(r => ({
      scientificName: r.species?.scientificNameWithoutAuthor || '',
      commonNames: r.species?.commonNames || [],
      family: r.species?.family?.scientificName || '',
      genus: r.species?.genus?.scientificName || '',
      score: r.score || 0
    }));

    logger.info(`Pl@ntNet results: ${topResults.map(r => `${r.scientificName}(${Math.round(r.score*100)}%)`).join(', ')}`);
    return { raw: response.data, results: topResults };
  } catch (err) {
    logger.error('Pl@ntNet API error:', err.message);
    return null;
  }
}

async function matchTreeByPlantNet(plantData) {
  if (!plantData || !plantData.results || plantData.results.length === 0) {
    return { tree: null, score: 0 };
  }

  // Получаем все деревья из БД
  const { rows: trees } = await pool.query('SELECT * FROM trees');

  let bestMatch = null;
  let bestScore = 0;

  for (const result of plantData.results) {
    const searchTerms = [
      result.scientificName.toLowerCase(),
      ...(result.commonNames || []).map(n => n.toLowerCase()),
      result.genus.toLowerCase(),
      result.family.toLowerCase()
    ].filter(Boolean);

    for (const tree of trees) {
      const treeNameRu = tree.name_ru.toLowerCase();
      const treeNameLatin = (tree.name_latin || '').toLowerCase();
      const treeFamily = (tree.family || '').toLowerCase();

      for (const term of searchTerms) {
        let score = 0;

        // Точное совпадение по латинскому названию
        if (treeNameLatin && (treeNameLatin === term || term.includes(treeNameLatin))) {
          score = result.score * 0.95;
        }
        // Совпадение по русскому названию
        else if (treeNameRu === term || term.includes(treeNameRu) || treeNameRu.includes(term)) {
          score = result.score * 0.90;
        }
        // Совпадение по семейству
        else if (treeFamily && treeFamily.includes(term)) {
          score = result.score * 0.30;
        }
        // Ключевое слово
        else {
          const keywordMatch = TREE_KEYWORDS.find(kw => 
            kw.keywords.some(k => term.includes(k))
          );
          if (keywordMatch && keywordMatch.name.toLowerCase() === treeNameRu) {
            score = result.score * 0.85;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = tree;
        }
      }
    }
  }

  return { tree: bestMatch, score: bestScore };
}

async function processRecognition(base64Image, userId) {
  let matchedTree = null;
  let confidence = 0;
  let rawResult = {};
  let isDemo = false;

  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const plantData = await analyzeWithPlantNet(imageBuffer);

    if (plantData) {
      rawResult = plantData.raw;
      const { tree, score } = await matchTreeByPlantNet(plantData);

      if (tree && score > 0.15) {
        matchedTree = tree;
        confidence = score;
        logger.info(`Matched tree via Pl@ntNet: ${tree.name_ru} with confidence ${score}`);
      }
    }
  } catch (err) {
    logger.error('Pl@ntNet recognition error:', err.message);
  }

  // Демо-режим только если Pl@ntNet не настроен или не дал результата
  if (!matchedTree) {
    isDemo = true;
    const { rows } = await pool.query(
      `SELECT * FROM trees WHERE bloom_season NOT LIKE '%шишк%' ORDER BY RANDOM() LIMIT 1`
    );
    matchedTree = rows[0];
    confidence = 0.35 + Math.random() * 0.15; // честная низкая уверенность
    rawResult = { demo: true, message: 'Pl@ntNet API не настроен или не распознал растение. Показано случайное цветущее дерево.' };
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
