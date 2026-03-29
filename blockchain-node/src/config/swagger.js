const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blockchain Node API - Grados Académicos',
      version: '1.0.0',
      description: 'API REST de un nodo Express en la red blockchain distribuida para gestión de grados académicos.',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 8004}`, description: 'Este nodo' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
