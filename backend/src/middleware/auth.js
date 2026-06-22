const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен авторизации не предоставлен' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'florabot_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid JWT token:', err.message);
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
};

module.exports = authMiddleware;
