require('dotenv').config();
const fastify = require('fastify')({ logger: false });
const { fastifyCors } = require('@fastify/cors');

const usersRoutes = require('./routes/users');
const drawRoutes = require('./routes/draw');

async function buildApp() {
  await fastify.register(fastifyCors, {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE']
  });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(drawRoutes, { prefix: '/draw' });
  return fastify;
}

module.exports = buildApp;