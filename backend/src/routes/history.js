const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/history — user's history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT rh.*, t.name_ru, t.name_latin, t.family, t.bloom_season, t.image_url as tree_image
       FROM recognition_history rh
       LEFT JOIN trees t ON rh.tree_id = t.id
       WHERE rh.user_id = $1
       ORDER BY rh.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('Get history error:', err);
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

// GET /api/history/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT rh.*, t.* FROM recognition_history rh
       LEFT JOIN trees t ON rh.tree_id = t.id
       WHERE rh.id = $1 AND rh.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Запись не найдена' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Get history item error:', err);
    res.status(500).json({ error: 'Ошибка получения записи' });
  }
});

// PATCH /api/history/:id/notes — add notes
router.patch('/:id/notes', authMiddleware, async (req, res) => {
  const { notes } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE recognition_history SET notes=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
      [notes, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Запись не найдена' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Update notes error:', err);
    res.status(500).json({ error: 'Ошибка обновления заметки' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM recognition_history WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Запись не найдена' });
    logger.info(`History item deleted: ${req.params.id} by user ${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete history error:', err);
    res.status(500).json({ error: 'Ошибка удаления записи' });
  }
});

module.exports = router;
