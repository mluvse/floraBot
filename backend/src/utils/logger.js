const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, 'app.log');

const timestamp = () => new Date().toISOString();

const write = (level, ...args) => {
  const msg = `[${timestamp()}] [${level}] ${args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}\n`;
  fs.appendFileSync(logFile, msg);
};

const logger = {
  info: (...args) => { console.log(`ℹ️ `, ...args); write('INFO', ...args); },
  error: (...args) => { console.error(`❌`, ...args); write('ERROR', ...args); },
  warn: (...args) => { console.warn(`⚠️ `, ...args); write('WARN', ...args); },
  debug: (...args) => { if (process.env.DEBUG) { console.log(`🐛`, ...args); write('DEBUG', ...args); } },
};

module.exports = logger;
