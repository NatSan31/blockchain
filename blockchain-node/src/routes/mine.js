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
  // 1. Obtener las transacciones pendientes
  const transacciones = mempool.obtenerTransacciones();

  // 2. Validar que haya algo que minar
  if (transacciones.length === 0) {
    return res.status(400).json({ error: 'No hay transacciones pendientes para minar' });
  }

  try {
    // 3. Minar el nuevo bloque con esas transacciones
    const nuevoBloque = await blockchain.minarBloque(transacciones);

    // 4. Limpiar la mempool porque las transacciones ya están en el bloque
    mempool.limpiarTransacciones();

    // 5. Avisarle a los demás nodos sobre el nuevo bloque (Propagación)
    nodes.propagarBloque(nuevoBloque);

    logger.info(`Bloque #${nuevoBloque.indice || nuevoBloque.id || 'minado'} creado exitosamente`);

    // 6. Responder al frontend
    res.status(200).json({
      mensaje: 'Bloque minado y propagado exitosamente',
      bloque: nuevoBloque
    });

  } catch (error) {
    logger.error('Error al minar bloque', { error: error.message });
    res.status(500).json({ error: 'Error interno al minar el bloque' });
  }
});

module.exports = router;