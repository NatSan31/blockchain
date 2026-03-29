//conexion de blockchain.js al mundo exterior
const blockchain = require('../services/blockchain');
const { mempool } = require('../state/networkState');
const logger = require('../config/logger');

// Endpoint: GET /chain
const verCadena = async (req, res) => {
  try {
    const cadena = await blockchain.obtenerCadenaLocal();
    res.json({
      longitud: cadena.length,
      cadena: cadena
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la blockchain local.' });
  }
};

// Endpoint: POST /mine
const minar = async (req, res) => {
  try {
    if (mempool.length === 0) {
      return res.status(400).json({ error: 'No hay transacciones pendientes para minar.' });
    }

    logger.info('Iniciando proceso de minado desde endpoint...');
    
    // Mandamos la mempool a tu función de minar
    const nuevoBloque = await blockchain.minarBloque(mempool);

    // Si se minó con éxito, limpiamos las transacciones que ya entraron al bloque
    // (Por ahora limpiamos toda la mempool, asumiendo que metes todo en 1 bloque)
    mempool.length = 0; 

    // TODO: En la Fase 3 aquí agregaremos la lógica para propagar el bloque a otros nodos.

    res.status(201).json({
      mensaje: '¡Bloque minado y agregado con éxito!',
      bloque: nuevoBloque
    });

  } catch (error) {
    logger.error(`Error al minar: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  verCadena,
  minar
};