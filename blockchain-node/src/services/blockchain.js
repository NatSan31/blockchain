const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
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

// ─────────────────────────────────────────────────────────────
// PROOF OF WORK
// ─────────────────────────────────────────────────────────────

function proofOfWork(datosBloque) {
  let nonce = 0;
  let hash = '';

  logger.info(`⛏️  Iniciando Proof of Work (dificultad: ${DIFFICULTY} ceros)...`);

  while (!hash.startsWith(TARGET)) {
    nonce++;
    hash = calcularHash({ ...datosBloque, nonce });
  }

  logger.info(`✅  PoW completado | nonce: ${nonce} | hash: ${hash}`);
  return { nonce, hash };
}

// ─────────────────────────────────────────────────────────────
// VALIDACIÓN
// ─────────────────────────────────────────────────────────────

function validarBloque(bloque) {
  const hashRecalculado = calcularHash({
    persona_id: bloque.persona_id,
    institucion_id: bloque.institucion_id,
    titulo_obtenido: bloque.titulo_obtenido,
    fecha_fin: bloque.fecha_fin,
    hash_anterior: bloque.hash_anterior,
    nonce: bloque.nonce,
  });

  if (hashRecalculado !== bloque.hash_actual) {
    logger.warn(`❌ Hash inválido en bloque ${bloque.id}`);
    return false;
  }

  if (!bloque.hash_actual.startsWith(TARGET)) {
    logger.warn(`❌ PoW inválido en bloque ${bloque.id}`);
    return false;
  }

  return true;
}

function validarCadena(cadena) {
  if (!cadena || cadena.length === 0) return false;

  for (let i = 1; i < cadena.length; i++) {
    const bloqueActual = cadena[i];
    const bloqueAnterior = cadena[i - 1];

    if (!validarBloque(bloqueActual)) return false;

    if (bloqueActual.hash_anterior !== bloqueAnterior.hash_actual) {
      logger.warn(`❌ Encadenamiento roto entre bloque ${i - 1} y ${i}`);
      return false;
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// PERSISTENCIA EN SUPABASE
// ─────────────────────────────────────────────────────────────

async function obtenerCadenaLocal() {
  const { data, error } = await supabase
    .from('grados')
    .select('*')
    .order('creado_en', { ascending: true });

  if (error) {
    logger.error('Error al obtener cadena de Supabase', { error: error.message });
    throw error;
  }

  return data || [];
}

async function obtenerUltimoBloque() {
  const { data, error } = await supabase
    .from('grados')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error al obtener último bloque', { error: error.message });
    throw error;
  }

  return data || null;
}

async function guardarBloque(bloque) {
  const { data, error } = await supabase
    .from('grados')
    .insert(bloque)
    .select()
    .single();

  if (error) {
    logger.error('Error al guardar bloque en Supabase', { error: error.message });
    throw error;
  }

  logger.info(`💾 Bloque guardado en Supabase | hash: ${bloque.hash_actual}`);
  return data;
}

// ─────────────────────────────────────────────────────────────
// BLOQUE GÉNESIS
// ─────────────────────────────────────────────────────────────

async function crearBloqueGenesis() {
  logger.info('🌱 Creando bloque génesis...');

  const genesisData = {
    persona_id: null,
    institucion_id: null,
    programa_id: null,
    titulo_obtenido: 'GENESIS',
    fecha_fin: '2000-01-01',
    hash_anterior: '0',
  };

  const { nonce, hash } = proofOfWork(genesisData);

  const bloque = {
    ...genesisData,
    hash_actual: hash,
    nonce,
    firmado_por: process.env.NODE_ID || 'Nodo 01 - Sancen',
  };

  return await guardarBloque(bloque);
}

async function inicializarBlockchain() {
  const cadena = await obtenerCadenaLocal();
  if (cadena.length === 0) {
    await crearBloqueGenesis();
    logger.info('Blockchain inicializada con bloque génesis');
  } else {
    logger.info(`Blockchain cargada | ${cadena.length} bloques existentes`);
  }
}

// ─────────────────────────────────────────────────────────────
// MINADO
// ─────────────────────────────────────────────────────────────

async function minarBloque(transacciones) {
  if (!transacciones || transacciones.length === 0) {
    throw new Error('No hay transacciones pendientes para minar');
  }

  const tx = transacciones[0];

  const ultimoBloque = await obtenerUltimoBloque();
  const hashAnterior = ultimoBloque ? ultimoBloque.hash_actual : '0';

  const datosBloque = {
    persona_id: tx.persona_id,
    institucion_id: tx.institucion_id,
    titulo_obtenido: tx.titulo_obtenido,
    fecha_fin: tx.fecha_fin,
    hash_anterior: hashAnterior,
  };

  const { nonce, hash } = proofOfWork(datosBloque);

  const nuevoBloque = {
    persona_id: tx.persona_id,
    institucion_id: tx.institucion_id,
    programa_id: tx.programa_id || null,
    titulo_obtenido: tx.titulo_obtenido,
    fecha_inicio: tx.fecha_inicio || null,
    fecha_fin: tx.fecha_fin,
    numero_cedula: tx.numero_cedula || null,
    titulo_tesis: tx.titulo_tesis || null,
    menciones: tx.menciones || null,
    hash_actual: hash,
    hash_anterior: hashAnterior, // ✅ CORREGIDO
    nonce,
    firmado_por: process.env.NODE_ID || 'Nodo 01 - Sancen',
  };

  return await guardarBloque(nuevoBloque);
}

// ─────────────────────────────────────────────────────────────
// ACEPTAR BLOQUE EXTERNO
// ─────────────────────────────────────────────────────────────

async function aceptarBloqueExterno(bloque) {
  if (!validarBloque(bloque)) {
    throw new Error('Bloque inválido: hash o PoW incorrecto');
  }

  const ultimoBloque = await obtenerUltimoBloque();

  if (ultimoBloque && bloque.hash_anterior !== ultimoBloque.hash_actual) {
    throw new Error('Hash anterior no coincide con el último bloque local');
  }

  const { data: existe } = await supabase
    .from('grados')
    .select('id')
    .eq('hash_actual', bloque.hash_actual)
    .single();

  if (existe) {
    logger.info(`ℹ️  Bloque ya existe localmente | hash: ${bloque.hash_actual}`);
    return { yaExiste: true };
  }

  return await guardarBloque(bloque);
}

// ─────────────────────────────────────────────────────────────
// CONSENSO
// ─────────────────────────────────────────────────────────────

async function reemplazarCadena(nuevaCadena) {
  const { error: deleteError } = await supabase
    .from('grados')
    .delete()
    .neq('id', 0); // evita error de delete sin condición

  if (deleteError) throw deleteError;

  for (const bloque of nuevaCadena) {
    await guardarBloque(bloque);
  }

  logger.info(`🔄 Cadena reemplazada con ${nuevaCadena.length} bloques`);
}

module.exports = {
  calcularHash,
  proofOfWork,
  validarBloque,
  validarCadena,
  obtenerCadenaLocal,
  obtenerUltimoBloque,
  guardarBloque,
  inicializarBlockchain,
  minarBloque,
  aceptarBloqueExterno,
  reemplazarCadena,
};