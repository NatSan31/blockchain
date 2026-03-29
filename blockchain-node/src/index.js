const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const logger = require('./config/logger');
const { inicializarBlockchain } = require('./services/blockchain');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ── Rutas (Actualizadas al contrato de tu equipo) ────────────
const transactionRoutes = require('./routes/transactions');
const chainRoutes = require('./routes/chain');
const nodeRoutes = require('./routes/nodes');
// Nuevos archivos que debes crear para separar la lógica:
const mineRoutes = require('./routes/mine');
const blocksRoutes = require('./routes/blocks');

const app = express();
const PORT = process.env.PORT || 8003;

// ── Middlewares globales ─────────────────────────────────────
app.use(cors());
app.use(express.json());

// 👇 ¡AQUÍ ESTÁ LA LÍNEA MÁGICA PARA TU FRONTEND! 👇
app.use(express.static(path.join(__dirname, '../public'))); 
// 👆 ──────────────────────────────────────────────────────── 👆

// Log de cada request HTTP con morgan → también a Winston
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ── Swagger UI ───────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    node_id: process.env.NODE_ID || 'nodo-express',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ── Rutas principales (Prefijos aplicados) ───────────────────
app.use('/transactions', transactionRoutes); // Todo lo de mempool
app.use('/chain', chainRoutes);              // Todo lo de ver la cadena
app.use('/nodes', nodeRoutes);               // Todo lo de la red P2P
app.use('/mine', mineRoutes);                // Endpoint directo para minar
app.use('/blocks', blocksRoutes);            // Endpoint para recibir bloques

// ── 404 y manejo de errores ──────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Inicializar blockchain y arrancar servidor ────────────────
async function iniciar() {
  try {
    logger.info('Inicializando blockchain...');
    await inicializarBlockchain();

    app.listen(PORT, () => {
      logger.info(`Nodo Express corriendo en http://localhost:${PORT}`);
      logger.info(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
      logger.info(`Node ID: ${process.env.NODE_ID || 'nodo-express'}`);
      logger.info(`Frontend listo en: http://localhost:${PORT}`); 
    });
  } catch (err) {
    logger.error('Error al inicializar:', { error: err.message });
    process.exit(1);
  }
}

iniciar();