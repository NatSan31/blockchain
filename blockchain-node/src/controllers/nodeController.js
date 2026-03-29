const { nodosConocidos } = require('../state/networkState');
const blockchain = require('../services/blockchain');
const logger = require('../config/logger');

// Endpoint: POST /nodes/register
const registrarNodos = (req, res) => {
  const { nodos } = req.body; // Esperamos un arreglo de URLs: ["http://localhost:8001", "http://localhost:8002", "http://localhost:8003"]

  if (!nodos || !Array.isArray(nodos)) {
    return res.status(400).json({ error: 'Debes enviar un arreglo de URLs de nodos.' });
  }

  nodos.forEach(nodoUrl => {
    // Verificamos que no sea tu propio nodo y no esté duplicado
    if (!nodosConocidos.has(nodoUrl)) {
      nodosConocidos.add(nodoUrl);
      logger.info(`Nuevo nodo registrado: ${nodoUrl}`);
    }
  });

  res.status(201).json({
    mensaje: 'Nodos registrados correctamente',
    total_nodos_conocidos: Array.from(nodosConocidos)
  });
};

// Endpoint: GET /nodes/resolve (Consenso)
const resolverConflictos = async (req, res) => {
  // Esta lógica la implementaremos a fondo en la Fase 4.
  // Por ahora dejamos el cascarón preparado.
  res.json({
    mensaje: 'Endpoint de consenso preparado. Se implementará en la Fase 4.',
    nodos_a_consultar: Array.from(nodosConocidos)
  });
};

module.exports = {
  registrarNodos,
  resolverConflictos
};