// Este archivo guarda datos en la memoria RAM de tu servidor de Express.
// Si el servidor se reinicia, esto se borra (lo cual es normal en una MemPool).

const mempool = []; // Arreglo para guardar transacciones pendientes
const nodosConocidos = new Set(); // Set para guardar las URLs de tus compañeros sin repetirlas

module.exports = {
  mempool,
  nodosConocidos
};