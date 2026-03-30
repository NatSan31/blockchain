const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const mempool = require('../services/mempool');
const logger = require('../config/logger');

router.post('/receive', async (req, res) => {
  // Acepta { bloque: {...} } o {...}
  const bloqueBruto = req.body.bloque || req.body; 

  try {
    // 1. TRADUCTOR HÍBRIDO (Para entender a Laravel y Node)
    const tieneTransacciones = bloqueBruto.data && bloqueBruto.data.transacciones && bloqueBruto.data.transacciones.length > 0;
    const tx = tieneTransacciones ? bloqueBruto.data.transacciones[0] : bloqueBruto;

    // 👇 TRADUCTOR BLINDADO: Buscamos por todos lados para que no se pierdan datos
    const bloqueNormalizado = {
      hash_actual: bloqueBruto.hash_actual || bloqueBruto.hash,
      hash_anterior: bloqueBruto.hash_anterior || bloqueBruto.previous_hash || '0',
      nonce: parseInt(bloqueBruto.nonce) || 0,
      persona_id: tx?.persona_id || bloqueBruto?.persona_id || null,
      institucion_id: tx?.institucion_id || bloqueBruto?.institucion_id || tx?.universidad_id || bloqueBruto?.universidad_id || null,
      programa_id: tx?.programa_id || bloqueBruto?.programa_id || null,
      titulo_obtenido: tx?.titulo_obtenido || bloqueBruto?.titulo_obtenido || tx?.titulo || 'GENESIS',
      fecha_fin: tx?.fecha_fin || bloqueBruto?.fecha_fin || '2000-01-01',
      fecha_inicio: tx?.fecha_inicio || bloqueBruto?.fecha_inicio || null,
      numero_cedula: tx?.numero_cedula || bloqueBruto?.numero_cedula || null,
      titulo_tesis: tx?.titulo_tesis || bloqueBruto?.titulo_tesis || null,
      menciones: tx?.menciones || bloqueBruto?.menciones || null,
      firmado_por: tx?.firmado_por || bloqueBruto?.firmado_por || 'Nodo Externo'
    };

    // 2. Validar matemáticamente (Ahora con los datos correctos)
    if (!blockchain.validarBloque(bloqueNormalizado)) {
        logger.warn('❌ Rechazado: Hash o PoW inválido');
        return res.status(400).json({ error: 'Hash o PoW inválido' });
    }

    // 👇 2.5 FILTRO ANTI-DUPLICADOS (El Cadenero)
    const miCadena = await blockchain.obtenerCadenaLocal();
    const bloqueYaExiste = miCadena.some(b => b.hash_actual === bloqueNormalizado.hash_actual);
    
    if (bloqueYaExiste) {
        logger.info(`♻️ Bloque ignorado: El hash ${bloqueNormalizado.hash_actual.substring(0, 10)}... ya existe en la cadena.`);
        // Respondemos 200 para que el nodo que lo mandó no marque error
        return res.status(200).json({ mensaje: 'Bloque duplicado ignorado con éxito' });
    }

    // 3. Guardar en DB 
    await blockchain.guardarBloque(bloqueNormalizado);

    // 4. ✨ LIMPIAR MEMPOOL
    const pendientes = mempool.obtenerTransacciones();
    const filtradas = pendientes.filter(t => t.persona_id !== bloqueNormalizado.persona_id);
    mempool.limpiarTransacciones();
    filtradas.forEach(t => mempool.agregarTransaccion(t));

    logger.info(`✅ Bloque externo aceptado y guardado. Hash: ${bloqueNormalizado.hash_actual}`);
    res.status(200).json({ mensaje: 'Bloque aceptado y mempool actualizado' });
    
  } catch (err) {
    logger.error(`❌ Error al recibir bloque: ${err.message}`);
    // Si falla por desincronización (ej. Supabase rechaza), devolvemos 400
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;