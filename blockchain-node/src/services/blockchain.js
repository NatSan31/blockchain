const crypto = require('crypto');
const supabase = require('../config/supabase');
const logger = require('../config/logger');

const DIFFICULTY = parseInt(process.env.POW_DIFFICULTY || '3');
const TARGET = '0'.repeat(DIFFICULTY);

// ─────────────────────────────────────────────────────────────
// HASHING
// ─────────────────────────────────────────────────────────────
function calcularHash({ persona_id, institucion_id, titulo_obtenido, fecha_fin, hash_anterior, nonce }) {
  const datos = `${persona_id}${institucion_id}${titulo_obtenido}${fecha_fin}${hash_anterior || ''}${nonce}`;
  return crypto.createHash('sha256').update(datos).digest('hex');
}

function proofOfWork(datosBloque) {
  let nonce = 0;
  let hash = '';
  logger.info(`⛏️ Iniciando PoW...`);
  while (!hash.startsWith(TARGET)) {
    nonce++;
    hash = calcularHash({ ...datosBloque, nonce });
  }
  return { nonce, hash };
}

// ─────────────────────────────────────────────────────────────
// VALIDACIÓN
// ─────────────────────────────────────────────────────────────
function validarBloque(bloque) {
  const hashRecalculado = calcularHash(bloque);
  return hashRecalculado === bloque.hash_actual && bloque.hash_actual.startsWith(TARGET);
}

function validarCadena(cadena) {
  if (!cadena || cadena.length === 0) return true;
  for (let i = 1; i < cadena.length; i++) {
    const bloqueActual = cadena[i];
    const bloqueAnterior = cadena[i - 1];
    if (!validarBloque(bloqueActual)) return false;
    if (bloqueActual.hash_anterior !== bloqueAnterior.hash_actual) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// PERSISTENCIA (Supabase)
// ─────────────────────────────────────────────────────────────
async function obtenerCadenaLocal() {
  const { data, error } = await supabase
    .from('grados')
    .select('*')
    .order('creado_en', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function obtenerUltimoBloque() {
  const { data, error } = await supabase
    .from('grados')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function guardarBloque(bloque) {
  const { data, error } = await supabase.from('grados').insert(bloque).select().single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────
async function inicializarBlockchain() {
  const cadena = await obtenerCadenaLocal();
  if (cadena.length === 0) {
    logger.info('Creando bloque génesis...');
    const genesisData = {
      persona_id: null,
      institucion_id: null,
      titulo_obtenido: 'GENESIS',
      fecha_fin: '2000-01-01',
      hash_anterior: '0',
    };
    const { nonce, hash } = proofOfWork(genesisData);
    await guardarBloque({
      ...genesisData,
      hash_actual: hash,
      nonce,
      firmado_por: 'Nodo 1' 
    });
    logger.info(' Blockchain inicializada con bloque génesis');
  } else {
    logger.info(` Blockchain cargada | ${cadena.length} bloques existentes`);
  }
}

// ─────────────────────────────────────────────────────────────
// MINADO
// ─────────────────────────────────────────────────────────────
async function minarBloque(transacciones) {
  if (!transacciones || transacciones.length === 0) throw new Error('No hay transacciones');

  const tx = transacciones[0]; 
  const ultimoBloque = await obtenerUltimoBloque();
  const hashAnterior = ultimoBloque ? ultimoBloque.hash_actual : '0';

  const datosBase = {
    persona_id: tx.persona_id,
    institucion_id: tx.institucion_id,
    titulo_obtenido: tx.titulo_obtenido,
    fecha_fin: tx.fecha_fin,
    hash_anterior: hashAnterior,
  };

  const { nonce, hash } = proofOfWork(datosBase);

  const nuevoBloque = {
    ...datosBase,
    programa_id: tx.programa_id || null,
    fecha_inicio: tx.fecha_inicio || null,
    numero_cedula: tx.numero_cedula || null,
    hash_actual: hash,
    nonce,
    firmado_por: 'Nodo 1', 
  };

  return await guardarBloque(nuevoBloque);
}

// ─────────────────────────────────────────────────────────────
// CONSENSO (Fase 4)
// ─────────────────────────────────────────────────────────────
async function reemplazarCadena(nuevaCadena) {
  logger.info('Reemplazando cadena con soporte híbrido...');
  
  try {
    // 1. Mapear la cadena para que siempre tenga el formato que su base de datos espera
    const cadenaNormalizada = nuevaCadena.map(bloque => {
      // Si el bloque viene de Laravel, los datos están en la raíz. 
      // Si viene de Node, están en bloque.data.transacciones[0]
      const tx = (bloque.data && bloque.data.transacciones) ? bloque.data.transacciones[0] : bloque;

      return {
        hash_actual: bloque.hash_actual || bloque.hash,
        hash_anterior: bloque.hash_anterior || bloque.previous_hash || '0',
        nonce: parseInt(bloque.nonce) || 0,
        persona_id: tx.persona_id || null,
        institucion_id: tx.institucion_id || null,
        programa_id: tx.programa_id || null,
        titulo_obtenido: tx.titulo_obtenido || 'GENESIS',
        fecha_fin: tx.fecha_fin || null,
        fecha_inicio: tx.fecha_inicio || null,
        numero_cedula: tx.numero_cedula || null,
        titulo_tesis: tx.titulo_tesis || null,
        menciones: tx.menciones || null,
        firmado_por: tx.firmado_por || bloque.firmado_por || 'Nodo '
      };
    });

    // 2. Borrar actual (Truco del nonce para Supabase)
    await supabase.from('grados').delete().gte('nonce', 0);

    // 3. Insertar la nueva cadena ya normalizada
    const { error } = await supabase.from('grados').insert(cadenaNormalizada);
    
    if (error) throw error;
    logger.info('Cadena sincronizada con éxito )');
    
  } catch (error) {
    logger.error('Error en el consenso de Node:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORTACIÓN (¡Todas las funciones incluidas!)
// ─────────────────────────────────────────────────────────────
module.exports = { 
  calcularHash, 
  proofOfWork, 
  validarBloque, 
  validarCadena, 
  minarBloque, 
  obtenerUltimoBloque, 
  guardarBloque,
  obtenerCadenaLocal,
  inicializarBlockchain,
  reemplazarCadena 
};