const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const extras = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${extras}`;
    })
  ),
  transports: [
    // Consola con colores
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    // Archivo de logs completo
    new transports.File({
      filename: path.join('logs', 'node.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
    }),
    // Solo errores
    new transports.File({
      filename: path.join('logs', 'errors.log'),
      level: 'error',
    }),
  ],
});

module.exports = logger;
