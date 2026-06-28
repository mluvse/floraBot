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

// Словарь перевода часто встречающихся растений
const PLANT_NAME_RU = {
  'rosa canina': 'Шиповник собачий',
  'rosa rugosa': 'Шиповник морщинистый',
  'rosa': 'Роза',
  'taraxacum officinale': 'Одуванчик лекарственный',
  'taraxacum': 'Одуванчик',
  'bellis perennis': 'Маргаритка многолетняя',
  'bellis': 'Маргаритка',
  'trifolium pratense': 'Клевер луговой',
  'trifolium': 'Клевер',
  'plantago major': 'Подорожник большой',
  'plantago': 'Подорожник',
  'matricaria chamomilla': 'Ромашка аптечная',
  'matricaria': 'Ромашка',
  'chamomilla': 'Ромашка',
  'chamomile': 'Ромашка',
  'achillea millefolium': 'Тысячелистник обыкновенный',
  'achillea': 'Тысячелистник',
  'urtica dioica': 'Крапива двудомная',
  'urtica': 'Крапива',
  'nettle': 'Крапива',
  'dandelion': 'Одуванчик',
  'daisy': 'Маргаритка',
  'clover': 'Клевер',
  'plantain': 'Подорожник',
  'yarrow': 'Тысячелистник',
  'cherry blossom': 'Сакура',
  'japanese cherry': 'Сакура',
  'prunus serrulata': 'Сакура',
  'prunus avium': 'Черешня',
  'prunus padus': 'Черёмуха обыкновенная',
  'prunus cerasus': 'Вишня обыкновенная',
  'prunus domestica': 'Слива домашняя',
  'prunus persica': 'Персик обыкновенный',
  'prunus armeniaca': 'Абрикос обыкновенный',
  'prunus': 'Слива',
  'malus domestica': 'Яблоня домашняя',
  'malus': 'Яблоня',
  'pyrus communis': 'Груша обыкновенная',
  'pyrus': 'Груша',
  'aesculus hippocastanum': 'Каштан конский',
  'aesculus': 'Каштан',
  'syringa vulgaris': 'Сирень обыкновенная',
  'syringa': 'Сирень',
  'robinia pseudoacacia': 'Акация белая',
  'robinia': 'Акация',
  'acacia': 'Акация',
  'sorbus aucuparia': 'Рябина обыкновенная',
  'sorbus': 'Рябина',
  'tilia cordata': 'Липа мелколистная',
  'tilia': 'Липа',
  'linden': 'Липа',
  'magnolia grandiflora': 'Магнолия крупноцветковая',
  'magnolia': 'Магнолия',
  'acer platanoides': 'Клён остролистный',
  'acer': 'Клён',
  'maple': 'Клён',
  'pinus sylvestris': 'Сосна обыкновенная',
  'pinus': 'Сосна',
  'pine': 'Сосна',
  'picea abies': 'Ель европейская',
  'picea': 'Ель',
  'spruce': 'Ель',
  'quercus robur': 'Дуб черешчатый',
  'quercus': 'Дуб',
  'oak': 'Дуб',
  'betula pendula': 'Берёза повислая',
  'betula': 'Берёза',
  'birch': 'Берёза',
  'populus tremula': 'Осина',
  'populus': 'Тополь',
  'aspen': 'Осина',
  'alnus incana': 'Ольха серая',
  'alnus glutinosa': 'Ольха чёрная',
  'alnus': 'Ольха',
  'alder': 'Ольха',
  'crataegus monogyna': 'Боярышник колючий',
  'crataegus': 'Боярышник',
  'hawthorn': 'Боярышник',
  'fraxinus': 'Ясень',
  'ash': 'Ясень',
  'salix': 'Ива',
  'willow': 'Ива',
  'ulmus': 'Вяз',
  'elm': 'Вяз',
  'chestnut': 'Каштан',
  'horse chestnut': 'Каштан конский',
  'coneflower': 'Эхинацея',
  'echinacea': 'Эхинацея',
  'lavandula': 'Лаванда',
  'lavender': 'Лаванда',
  'narcissus': 'Нарцисс',
  'daffodil': 'Нарцисс',
  'tulip': 'Тюльпан',
  'tulipa': 'Тюльпан',
  'lily': 'Лилия',
  'lilium': 'Лилия',
  'sunflower': 'Подсолнух',
  'helianthus': 'Подсолнух',
  'poppy': 'Мак',
  'papaver': 'Мак',
  'iris': 'Ирис',
  'peony': 'Пион',
  'paeonia': 'Пион',
  'hydrangea': 'Гортензия',
  'hortensia': 'Гортензия',
  'geranium': 'Герань',
  'pelargonium': 'Пеларгония',
  'fuchsia': 'Фуксия',
  'begonia': 'Бегония',
  'petunia': 'Петуния',
  'marigold': 'Бархатцы',
  'tagetes': 'Бархатцы',
  'zinnia': 'Цинния',
  'cosmos': 'Космея',
  'aster': 'Астра',
  'chrysanthemum': 'Хризантема',
  'dahlia': 'Георгин',
  'gladiolus': 'Гладиолус',
  'crocus': 'Шафран',
  'saffron': 'Шафран',
  'snowdrop': 'Подснежник',
  'galanthus': 'Подснежник',
  'bluebell': 'Колокольчик',
  'campanula': 'Колокольчик',
  'foxglove': 'Наперстянка',
  'digitalis': 'Наперстянка',
  'lupine': 'Люпин',
  'lupinus': 'Люпин',
  'columbine': 'Аквилегия',
  'aquilegia': 'Аквилегия',
  'bleeding heart': 'Дицентра',
  'dicentra': 'Дицентра',
  'hosta': 'Хоста',
  'plantain lily': 'Хоста',
  'fern': 'Папоротник',
  'moss': 'Мох',
  'lichen': 'Лишайник',
  'jasmine': 'Жасмин',
  'jasminum': 'Жасмин',
  'honeysuckle': 'Жимолость',
  'lonicera': 'Жимолость',
  'clematis': 'Клематис',
  'wisteria': 'Глициния',
  'ivy': 'Плющ',
  'hedera': 'Плющ',
  'vine': 'Виноград',
  'vitis': 'Виноград',
  'grape': 'Виноград',
  'philadelphus coronarius': 'Чубушник венечный',
  'philadelphus': 'Чубушник',
  'mock orange': 'Чубушник',
  'sweet mock orange': 'Чубушник',
  'white syringa': 'Чубушник',
};

// Функция для получения русского названия
function getRussianName(scientificName, commonNames = []) {
  const key = scientificName.toLowerCase().trim();

  // Прямое совпадение по научному названию
  if (PLANT_NAME_RU[key]) {
    return PLANT_NAME_RU[key];
  }

  // Проверка по родовому названию (первая часть биномиального)
  const genus = key.split(' ')[0];
  if (PLANT_NAME_RU[genus]) {
    return PLANT_NAME_RU[genus];
  }

  // Проверка по английским common names
  for (const name of commonNames) {
    const nameKey = name.toLowerCase().trim();
    if (PLANT_NAME_RU[nameKey]) {
      return PLANT_NAME_RU[nameKey];
    }
  }

  // Если не нашли — возвращаем научное название
  return scientificName;
}

async function analyzeWithPlantNet(imageBuffer) {
  if (!PLANTNET_API_KEY || PLANTNET_API_KEY === 'your_plantnet_api_key') {
    return null;
  }

  try {
    const form = new FormData();
    form.append('images', imageBuffer, { filename: 'flower.jpg', contentType: 'image/jpeg' });
    form.append('organs', 'flower');

    const response = await axios.post(
      `${PLANTNET_API_URL}?api-key=${PLANTNET_API_KEY}`,
      form,
      { headers: form.getHeaders(), timeout: 15000 }
    );

    const results = response.data.results || [];
    if (results.length === 0) return null;

    // Берём топ-5 результатов
    const topResults = results.slice(0, 5).map(r => ({
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

// Сопоставляем Pl@ntNet результат с деревом из БД
async function matchTree(plantResult) {
  const { rows: trees } = await pool.query('SELECT * FROM trees');

  const searchTerms = [
    plantResult.scientificName.toLowerCase(),
    ...(plantResult.commonNames || []).map(n => n.toLowerCase()),
    plantResult.genus.toLowerCase(),
    plantResult.family.toLowerCase()
  ].filter(Boolean);

  for (const tree of trees) {
    const treeNameRu = tree.name_ru.toLowerCase();
    const treeNameLatin = (tree.name_latin || '').toLowerCase();

    for (const term of searchTerms) {
      if (treeNameLatin && (treeNameLatin === term || term.includes(treeNameLatin))) {
        return { tree, score: plantResult.score * 0.95 };
      }
      if (treeNameRu === term || term.includes(treeNameRu) || treeNameRu.includes(term)) {
        return { tree, score: plantResult.score * 0.90 };
      }
    }
  }
  return { tree: null, score: 0 };
}

async function processRecognition(base64Image, userId) {
  let isDemo = false;

  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const plantData = await analyzeWithPlantNet(imageBuffer);

    if (plantData && plantData.results.length > 0) {
      // Сопоставляем все варианты с каталогом
      const variants = [];
      for (const result of plantData.results) {
        const { tree, score } = await matchTree(result);
        variants.push({
          scientificName: result.scientificName,
          commonNames: result.commonNames,
          family: result.family,
          genus: result.genus,
          score: result.score,
          matchedTree: tree,
          matchScore: score
        });
      }

      // Берём лучший вариант из каталога (если есть)
      const catalogMatches = variants.filter(v => v.matchedTree);
      const bestCatalogMatch = catalogMatches.length > 0
        ? catalogMatches.reduce((best, curr) => curr.matchScore > best.matchScore ? curr : best)
        : null;

      // Если нет совпадения в каталоге — показываем лучший вариант Pl@ntNet
      const bestOverall = variants[0];

      return {
        matchedTree: bestCatalogMatch?.matchedTree || null,
        confidence: bestCatalogMatch?.matchScore || bestOverall.score,
        rawResult: plantData.raw,
        isDemo: false,
        variants: variants.map(v => ({
          name: v.matchedTree?.name_ru || getRussianName(v.scientificName, v.commonNames),
          latin: v.matchedTree?.name_latin || v.scientificName,
          family: v.matchedTree?.family || v.family,
          confidence: Math.round((v.matchedTree ? v.matchScore : v.score) * 100),
          inCatalog: !!v.matchedTree,
          commonNames: v.commonNames
        })),
        isUnknown: !bestCatalogMatch
      };
    }
  } catch (err) {
    logger.error('Pl@ntNet recognition error:', err.message);
  }

  // Демо-режим
  isDemo = true;
  const { rows } = await pool.query(
    `SELECT * FROM trees WHERE bloom_season NOT LIKE '%шишк%' ORDER BY RANDOM() LIMIT 1`
  );
  const matchedTree = rows[0];
  const confidence = 0.35 + Math.random() * 0.15;

  return {
    matchedTree,
    confidence,
    rawResult: { demo: true, message: 'Pl@ntNet API не настроен или не распознал растение.' },
    isDemo: true,
    variants: [{
      name: matchedTree.name_ru,
      latin: matchedTree.name_latin,
      family: matchedTree.family,
      confidence: Math.round(confidence * 100),
      inCatalog: true,
      commonNames: []
    }],
    isUnknown: false
  };
}

// POST /api/recognition/analyze — загрузка файла
router.post('/analyze', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Изображение не предоставлено' });

    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const imageUrl = `/uploads/recognition/${req.file.filename}`;

    const result = await processRecognition(base64Image, req.user.id);

    const { rows: histRows } = await pool.query(
      `INSERT INTO recognition_history (user_id, tree_id, image_url, confidence, raw_result)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, result.matchedTree?.id || null, imageUrl, result.confidence, JSON.stringify(result.rawResult)]
    );

    res.json({
      success: true,
      history_id: histRows[0].id,
      tree: result.matchedTree,
      confidence: Math.round(result.confidence * 100),
      image_url: imageUrl,
      is_demo: result.isDemo,
      is_unknown: result.isUnknown,
      variants: result.variants
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

    const result = await processRecognition(base64Data, req.user.id);

    await pool.query(
      `INSERT INTO recognition_history (user_id, tree_id, image_url, confidence, raw_result)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, result.matchedTree?.id || null, imageUrl, result.confidence, JSON.stringify(result.rawResult)]
    );

    res.json({
      success: true,
      tree: result.matchedTree,
      confidence: Math.round(result.confidence * 100),
      image_url: imageUrl,
      is_demo: result.isDemo,
      is_unknown: result.isUnknown,
      variants: result.variants
    });
  } catch (err) {
    logger.error('Camera recognition error:', err);
    res.status(500).json({ error: 'Ошибка при распознавании' });
  }
});

module.exports = router;
