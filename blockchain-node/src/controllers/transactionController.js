// Este archivo manejará cuando te envíen un nuevo título académico que deba encolarse
const { mempool } = require('../state/networkState');
const logger = require('../config/logger'); // Asumiendo que tienes tu logger

// Endpoint: POST /transactions
const recibirTransaccion = (req, res) => {
  const transaccion = req.body;

  // Validación básica
  if (!transaccion.persona_id || !transaccion.institucion_id || !transaccion.titulo_obtenido || !transaccion.fecha_fin) {
    return res.status(400).json({ error: 'Faltan datos obligatorios en la transacción.' });
  }

  // Agregamos a la MemPool
  mempool.push(transaccion);
  logger.info(`Nueva transacción encolada: ${transaccion.titulo_obtenido}`);

  // TODO: En la Fase 3 aquí agregaremos la lógica para propagar a los otros nodos.

  res.status(201).json({
    mensaje: 'Transacción añadida a la lista de pendientes (MemPool).',
    transaccion
  });
};

// Endpoint: GET /transactions (Opcional, pero muy útil para debug)
const verTransaccionesPendientes = (req, res) => {
  res.json({ transacciones_pendientes: mempool });
};

module.exports = {
  recibirTransaccion,
  verTransaccionesPendientes
};