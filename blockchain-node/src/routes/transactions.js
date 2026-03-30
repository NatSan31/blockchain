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
 */
router.post('/', async (req, res) => {
  // 1. TRADUCTOR MULTI-EMPAQUE: Desempaquetar la caja si viene envuelta por Axios
  const tx = req.body.transaccion || req.body.tx || req.body.data || req.body; 

  const { persona_id, institucion_id, titulo_obtenido, fecha_fin, id } = tx || {};

  // 2. Validar campos obligatorios
  if (!persona_id || !institucion_id || !titulo_obtenido || !fecha_fin) {
    return res.status(400).json({
      error: 'Campos obligatorios: persona_id, institucion_id, titulo_obtenido, fecha_fin',
      recibido: req.body // Esto imprimirá en la respuesta qué fue exactamente lo que llegó si vuelve a fallar
    });
  }

  // 3. FILTRO ANTI-ECO: Revisar si ya existe en nuestro mempool
  const transaccionesPendientes = mempool.obtenerTransacciones();
  
  const txYaExiste = transaccionesPendientes.some(t => 
      (t.id && t.id === id) || 
      (t.persona_id === persona_id && t.titulo_obtenido === titulo_obtenido)
  );

  if (txYaExiste) {
      logger.info(`♻️ Transacción ignorada: Ya está en el mempool (${titulo_obtenido})`);
      // Devolvemos 200 para no dar error al otro nodo, pero detenemos la ejecución aquí (NO propagamos)
      return res.status(200).json({ mensaje: 'Transacción ya existía en el mempool local' });
  }

  logger.info(`✅ Nueva transacción recibida | titulo: ${titulo_obtenido}`);

  // 4. Guardar en mempool
  mempool.agregarTransaccion(tx);

  // 5. Propagar a los demás nodos (no esperamos respuesta para no bloquear)
  nodes.propagarTransaccion(tx).catch(() => {
      logger.warn('⚠️ Algunos nodos no respondieron a la propagación de la tx.');
  });

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