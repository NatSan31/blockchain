const express = require('express');
const router = express.Router();
const nodes = require('../services/nodes');
const logger = require('../config/logger');

/**
 * @openapi
 * /nodes/register:
 * post:
 * summary: Registra la URL de un nuevo nodo compañero
 * tags: [Red P2P]
 */
router.post('/register', (req, res) => {
  const { url, nombre } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'La URL del nodo es obligatoria' });
  }

  nodes.registrarNodo(url, nombre);
  logger.info(`Nuevo nodo registrado: ${nombre || 'Desconocido'} (${url})`);

  res.status(201).json({ 
    mensaje: 'Nodo registrado exitosamente',
    total_nodos: nodes.obtenerNodos().length 
  });
});

/**
 * @openapi
 * /nodes:
 * get:
 * summary: Devuelve la lista de nodos registrados
 * tags: [Red P2P]
 */
router.get('/', (req, res) => {
  res.json({ nodos: nodes.obtenerNodos() });
});

/**
 * @openapi
 * /nodes/resolve:
 * get:
 * summary: Dispara el algoritmo de consenso (adopta la cadena más larga)
 * tags: [Red P2P]
 */
router.get('/resolve', async (req, res) => {
  try {
    const conflictosResueltos = await nodes.resolverConflictos();
    
    if (conflictosResueltos) {
      res.json({ mensaje: 'Nuestra cadena fue reemplazada por una más larga de la red' });
    } else {
      res.json({ mensaje: 'Nuestra cadena ya es la autoridad (está actualizada)' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error durante el consenso' });
  }
});

module.exports = router;