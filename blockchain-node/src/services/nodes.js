const axios = require('axios');
const logger = require('../config/logger');

// Lista de nodos registrados en memoria (puedes persistirlos en Supabase también)
const nodosRegistrados = new Set();

function registrarNodo(url) {
  const urlLimpia = url.replace(/\/$/, ''); // quitar trailing slash
  nodosRegistrados.add(urlLimpia);
  logger.info(`Nodo registrado: ${urlLimpia}`);
}

function obtenerNodos() {
  return Array.from(nodosRegistrados);
}

/**
 * Propaga una transacción a todos los nodos registrados
 */
async function propagarTransaccion(transaccion) {
  const nodos = obtenerNodos();
  logger.info(`Propagando transacción a ${nodos.length} nodo(s)...`);

  const promesas = nodos.map(async (url) => {
    try {
      await axios.post(`${url}/transactions`, transaccion, { timeout: 5000 });
      logger.info(`Transacción propagada a ${url}`);
    } catch (err) {
      logger.warn(`No se pudo propagar a ${url}: ${err.message}`);
    }
  });

  await Promise.allSettled(promesas);
}

/**
 * Propaga un bloque minado a todos los nodos registrados
 */
async function propagarBloque(bloque) {
  const nodos = obtenerNodos();
  logger.info(`Propagando bloque minado a ${nodos.length} nodo(s)...`);

  const promesas = nodos.map(async (url) => {
    try {
      await axios.post(`${url}/blocks/receive`, bloque, { timeout: 5000 });
      logger.info(`Bloque propagado a ${url}`);
    } catch (err) {
      logger.warn(`No se pudo propagar bloque a ${url}: ${err.message}`);
    }
  });

  await Promise.allSettled(promesas);
}

/**
 * Obtiene la cadena de un nodo remoto
 */
async function obtenerCadenaRemota(url) {
  const { data } = await axios.get(`${url}/chain`, { timeout: 5000 });
  return data.chain || data; // compatibilidad con diferentes formatos
}

module.exports = {
  registrarNodo,
  obtenerNodos,
  propagarTransaccion,
  propagarBloque,
  obtenerCadenaRemota,
};
