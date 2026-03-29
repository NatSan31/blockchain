const axios = require('axios');
const logger = require('../config/logger');
// IMPORTANTE: Necesitamos importar blockchain para usar validarCadena y reemplazarCadena
const blockchain = require('./blockchain'); 

const nodosRegistrados = new Set();

function registrarNodo(url) {
  const urlLimpia = url.replace(/\/$/, '');
  nodosRegistrados.add(urlLimpia);
}

function obtenerNodos() { return Array.from(nodosRegistrados); }

// ─────────────────────────────────────────────────────────────
// LÓGICA DE CONSENSO (Fase 4: Resolver conflictos)
// ─────────────────────────────────────────────────────────────
async function resolverConflictos() {
  const misNodos = obtenerNodos();
  let nuevaCadena = null;
  
  // Obtenemos nuestra longitud actual
  const miCadena = await blockchain.obtenerCadenaLocal();
  let maximaLongitud = miCadena.length;

  logger.info(`🔍 Buscando consenso. Mi longitud actual: ${maximaLongitud}`);

  for (const url of misNodos) {
    try {
      // Le pedimos su cadena al otro nodo
      const respuesta = await axios.get(`${url}/chain`, { timeout: 4000 });
      const { longitud, cadena } = respuesta.data;

      // REGLA DE ORO: La cadena debe ser más larga Y válida
      if (longitud > maximaLongitud && blockchain.validarCadena(cadena)) {
        maximaLongitud = longitud;
        nuevaCadena = cadena;
      }
    } catch (err) {
      logger.warn(`⚠️ No se pudo consultar al nodo: ${url}`);
    }
  }

  // Si encontramos una mejor, reemplazamos la nuestra
  if (nuevaCadena) {
    logger.info('✅ Se encontró una cadena más larga. Sincronizando...');
    await blockchain.reemplazarCadena(nuevaCadena);
    return true; // Indica que sí hubo cambios
  }

  logger.info('✅ Nuestra cadena ya es la más larga o está actualizada.');
  return false; // No hubo cambios
}

async function propagarTransaccion(transaccion) {
  const promesas = obtenerNodos().map(url => 
    axios.post(`${url}/transactions`, transaccion, { timeout: 4000 }).catch(() => {})
  );
  await Promise.allSettled(promesas);
}

async function propagarBloque(bloque) {
  const promesas = obtenerNodos().map(url => 
    axios.post(`${url}/blocks/receive`, { bloque }, { 
        headers: { 'Accept': 'application/json' },
        timeout: 5000 
    }).catch(err => logger.warn(`Fallo propagación a ${url}`))
  );
  await Promise.allSettled(promesas);
}

// NO OLVIDES AGREGAR resolverConflictos AQUÍ ABAJO 👇
module.exports = { 
  registrarNodo, 
  obtenerNodos, 
  propagarTransaccion, 
  propagarBloque,
  resolverConflictos 
};