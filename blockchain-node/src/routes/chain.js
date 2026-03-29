const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');

/**
 * @openapi
 * /chain:
 * get:
 * summary: Devuelve la blockchain local completa
 * tags: [Cadena]
 */
router.get('/', async (req, res) => {
  try {
    // AQUÍ ESTÁ EL CAMBIO: agregamos "Local" al final del nombre de la función
    const cadenaCompleta = await blockchain.obtenerCadenaLocal();
    
    res.json({
      longitud: cadenaCompleta.length,
      cadena: cadenaCompleta
    });
  } catch (err) {
    console.error("💥 ERROR EN /chain:", err);
    res.status(500).json({ 
      error: 'Error al obtener la cadena', 
      detalle: err.message 
    });
  }
});

module.exports = router;