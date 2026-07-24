require('dotenv').config();
const fastify = require('fastify')({ logger: false });
const { fastifyCors } = require('@fastify/cors');

const usersRoutes = require('./routes/users');
const drawRoutes = require('./routes/draw');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

async function buildApp() {
  await fastify.register(fastifyCors, {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE']
  });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(drawRoutes, { prefix: '/draw' });
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(adminRoutes, { prefix: '/admin' });
  return fastify;
}

module.exports = buildApp;