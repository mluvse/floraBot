const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/trees — list all
router.get('/', async (req, res) => {
  try {
    const { search, family, season } = req.query;
    let q = 'SELECT * FROM trees WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); q += ` AND (name_ru ILIKE $${params.length} OR name_latin ILIKE $${params.length})`; }
    if (family) { params.push(family); q += ` AND family = $${params.length}`; }
    if (season) { params.push(`%${season}%`); q += ` AND bloom_season ILIKE $${params.length}`; }
    q += ' ORDER BY name_ru';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    logger.error('Get trees error:', err);
    res.status(500).json({ error: 'Ошибка получения списка деревьев' });
  }
});

// GET /api/trees/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM trees WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Дерево не найдено' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Get tree error:', err);
    res.status(500).json({ error: 'Ошибка получения дерева' });
  }
});

// POST /api/trees — create (auth required)
router.post('/', authMiddleware, async (req, res) => {
  const { name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url } = req.body;
  if (!name_ru) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO trees (name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url]
    );
    logger.info(`Tree created: ${name_ru} by user ${req.user.id}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('Create tree error:', err);
    res.status(500).json({ error: 'Ошибка создания дерева' });
  }
});

// PUT /api/trees/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE trees SET name_ru=$1, name_latin=$2, family=$3, description=$4,
       flower_description=$5, bloom_season=$6, regions=$7, image_url=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Дерево не найдено' });
    logger.info(`Tree updated: ${req.params.id}`);
    res.json(rows[0]);
  } catch (err) {
    logger.error('Update tree error:', err);
    res.status(500).json({ error: 'Ошибка обновления дерева' });
  }
});

// DELETE /api/trees/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM trees WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Дерево не найдено' });
    logger.info(`Tree deleted: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete tree error:', err);
    res.status(500).json({ error: 'Ошибка удаления дерева' });
  }
});

module.exports = router;
