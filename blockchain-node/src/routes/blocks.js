// Archivo: src/routes/blocks.js
const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const logger = require('../config/logger');

/**
 * @openapi
 * /blocks/receive:
 * post:
 * summary: Recibe un bloque minado por otro nodo de la red
 * tags: [Red P2P]
 */
router.post('/receive', async (req, res) => {
  const bloqueRecibido = req.body.bloque || req.body; 

  try {
    logger.info(`Bloque recibido de la red | hash: ${bloqueRecibido.hash_actual}`);
    
    const aceptado = await blockchain.agregarBloqueExterno(bloqueRecibido);

    if (aceptado) {
      res.status(200).json({ mensaje: 'Bloque verificado y agregado a la cadena local' });
    } else {
      res.status(400).json({ error: 'Bloque rechazado (hash inválido o cadena desactualizada)' });
    }
  } catch (err) {
    logger.error('Error al procesar bloque externo', { error: err.message });
    res.status(500).json({ error: 'Error interno al procesar el bloque' });
  }
});

module.exports = router;