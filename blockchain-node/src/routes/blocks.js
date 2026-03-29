const express = require('express');
const router = express.Router();
const blockchain = require('../services/blockchain');
const mempool = require('../services/mempool'); // Importamos mempool para limpiar

router.post('/receive', async (req, res) => {
  // Acepta { bloque: {...} } o {...}
  const bloqueRecibido = req.body.bloque || req.body; 

  try {
    // 1. Validar técnicamente
    if (!blockchain.validarBloque(bloqueRecibido)) {
        return res.status(400).json({ error: 'Hash o PoW inválido' });
    }

    // 2. Guardar en DB
    const resultado = await blockchain.aceptarBloqueExterno(bloqueRecibido);

    // 3. ✨ LIMPIAR MEMPOOL: Si el bloque llegó, la transacción ya no es pendiente
    const pendientes = mempool.obtenerTransacciones();
    const filtradas = pendientes.filter(tx => tx.persona_id !== bloqueRecibido.persona_id);
    mempool.limpiarTransacciones();
    filtradas.forEach(tx => mempool.agregarTransaccion(tx));

    res.status(200).json({ mensaje: 'Bloque aceptado y mempool actualizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;