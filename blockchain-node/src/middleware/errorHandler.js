const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error(`Error no manejado: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
}

function notFound(req, res) {
  logger.warn(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
