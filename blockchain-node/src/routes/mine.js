const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const nodes = require('../services/nodes');
const mempool = require('../services/mempool');
const logger = require('../config/logger');

/**
 * @openapi
 * /mine:
 * post:
 * summary: Mina un bloque con las transacciones pendientes
 * tags: [Minado]
 * responses:
 * 200:
 * description: Bloque minado y propagado
 * 400:
 * description: No hay transacciones pendientes
 */
router.post('/', async (req, res) => {
  try {
    const transacciones = mempool.obtenerTransacciones();

    if (transacciones.length === 0) {
      return res.status(400).json({ error: 'No hay transacciones pendientes para minar' });
    }

    const nuevoBloque = await blockchain.minarBloque(transacciones);

    // Asegúrate de que este nombre coincida con tu mempool.js
    mempool.limpiarTransacciones();

    // Propagación a otros nodos
    if (nodes && typeof nodes.propagarBloque === 'function') {
      nodes.propagarBloque(nuevoBloque);
    }

    logger.info(`✅ Bloque minado exitosamente por Nodo 4`);

    res.status(200).json({
      mensaje: 'Bloque minado y propagado exitosamente',
      bloque: nuevoBloque
    });

  } catch (error) {
    logger.error('💥 Error al minar bloque:', { error: error.message });
    res.status(500).json({ error: 'Error interno al minar el bloque', detalle: error.message });
  }
});

// ESTA LÍNEA ES LA MÁS IMPORTANTE PARA QUITAR EL ERROR DE "Router.use()"
module.exports = router;