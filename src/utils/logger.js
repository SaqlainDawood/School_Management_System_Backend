import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = process.env.LOG_LEVEL || 'INFO';

class Logger {
  constructor() {
    this.logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  }

  writeLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...meta };
    const logString = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(this.logFile, logString);

    if (logLevels[level] <= logLevels[currentLevel]) {
      const consoleMethod = level.toLowerCase();
      console[consoleMethod](`[${timestamp}] ${level}: ${message}`, meta);
    }
  }

  error(message, meta = {}) { this.writeLog('ERROR', message, meta); }
  warn(message, meta = {}) { this.writeLog('WARN', message, meta); }
  info(message, meta = {}) { this.writeLog('INFO', message, meta); }
  debug(message, meta = {}) { this.writeLog('DEBUG', message, meta); }

  request(req) {
    this.info(`Request: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  response(req, res) {
    this.info(`Response: ${req.method} ${req.url} - ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
    });
  }

  database(operation, collection, query = {}) {
    this.debug(`Database: ${operation} on ${collection}`, { operation, collection, query });
  }

  email(to, subject, status = 'sent') {
    this.info(`Email: ${status} to ${to}`, { to, subject, status });
  }
}

export default new Logger();