// Pool de transacciones pendientes (en memoria)
const transaccionesPendientes = [];

function agregarTransaccion(tx) {
  transaccionesPendientes.push(tx);
}

function obtenerTransacciones() {
  return [...transaccionesPendientes];
}

function limpiarTransacciones() {
  transaccionesPendientes.length = 0;
}

module.exports = {
  agregarTransaccion,
  obtenerTransacciones,
  limpiarTransacciones,
};
