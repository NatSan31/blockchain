const express = require('express');
const router = express.Router();
const nodes = require('../services/nodes');
const mempool = require('../services/mempool');
const logger = require('../config/logger');

/**
 * @openapi
 * /transactions:
 * post:
 * summary: Recibe una transacción, la guarda localmente y la propaga
 * tags: [Transacciones]
 * # ... (El resto de tus comentarios Swagger se quedan igual)
 */
router.post('/', async (req, res) => {
  const tx = req.body;
  const { persona_id, institucion_id, titulo_obtenido, fecha_fin } = tx;

  if (!persona_id || !institucion_id || !titulo_obtenido || !fecha_fin) {
    return res.status(400).json({
      error: 'Campos obligatorios: persona_id, institucion_id, titulo_obtenido, fecha_fin',
    });
  }

  logger.info(`Nueva transacción recibida | titulo: ${titulo_obtenido}`);

  // Guardar en mempool
  mempool.agregarTransaccion(tx);

  // Propagar a los demás nodos (no esperamos respuesta para no bloquear)
  nodes.propagarTransaccion(tx).catch(() => {});

  res.status(201).json({
    mensaje: 'Transacción recibida y propagada',
    pendientes: mempool.obtenerTransacciones().length,
  });
});

/**
 * @openapi
 * /transactions/pending:
 * get:
 * summary: Muestra las transacciones pendientes de minado
 * tags: [Transacciones]
 */
router.get('/pending', (req, res) => {
  res.json({
    pendientes: mempool.obtenerTransacciones(),
    total: mempool.obtenerTransacciones().length,
  });
});

module.exports = router;
