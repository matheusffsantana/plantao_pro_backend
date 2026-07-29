const pool = require('../db');
const authenticate = require('../middleware/authenticate');

async function adminRoutes(fastify, options) {

  // Total de sorteios e participantes
  fastify.get('/stats', { preHandler: authenticate }, async (request, reply) => {
    const totalDraws = await pool.query('SELECT COUNT(DISTINCT round) AS total FROM draws');
    const totalParticipations = await pool.query('SELECT COUNT(*) AS total FROM draws');
    const uniqueCorretores = await pool.query('SELECT COUNT(DISTINCT name) AS total FROM draws');

    return reply.status(200).send({
      totalDraws: totalDraws.rows[0].total,
      totalParticipations: totalParticipations.rows[0].total,
      uniqueCorretores: uniqueCorretores.rows[0].total
    });
  });

  // Ranking de corretores mais participativos
  fastify.get('/ranking', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT name, manager, COUNT(*) AS participations
      FROM draws
      GROUP BY name, manager
      ORDER BY participations DESC
    `);

    return reply.status(200).send(result.rows);
  });

  // Histórico de sorteios por rodada
  fastify.get('/history', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT round, COUNT(*) AS participants, MIN(drawn_at) AS drawn_at
      FROM draws
      GROUP BY round
      ORDER BY round DESC
    `);

    return reply.status(200).send(result.rows);
  });

  // Assiduidade por corretor
  fastify.get('/attendance', { preHandler: authenticate }, async (request, reply) => {
    const totalRounds = await pool.query('SELECT COUNT(DISTINCT round) AS total FROM draws');
    const total = totalRounds.rows[0].total;

    const result = await pool.query(`
      SELECT name, manager, COUNT(*) AS participations,
      ROUND(COUNT(*) * 100.0 / $1, 1) AS attendance_rate
      FROM draws
      GROUP BY name, manager
      ORDER BY attendance_rate DESC
    `, [total]);

    return reply.status(200).send(result.rows);
  });

  // Search by corretor name
  fastify.get('/search/corretor', { preHandler: authenticate }, async (request, reply) => {
    const { name } = request.query;

    if (!name) {
      return reply.status(400).send({ error: 'Name is required' });
    }

    const result = await pool.query(`
      SELECT name, manager, creci, position, drawn_at, round
      FROM draws
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY drawn_at DESC
    `, [`%${name}%`]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'No results found' });
    }

    const participations = result.rows.length;
    const avgPosition = (result.rows.reduce((sum, r) => sum + r.position, 0) / participations).toFixed(1);

    return reply.status(200).send({
      name: result.rows[0].name,
      manager: result.rows[0].manager,
      participations,
      avgPosition,
      history: result.rows
    });
  });

  // Search by manager
  fastify.get('/search/gerente', { preHandler: authenticate }, async (request, reply) => {
    const { manager } = request.query;

    if (!manager) {
      return reply.status(400).send({ error: 'Manager is required' });
    }

    const result = await pool.query(`
      SELECT name, manager, COUNT(*) AS participations,
      ROUND(AVG(position), 1) AS avg_position
      FROM draws
      WHERE LOWER(manager) LIKE LOWER($1)
      GROUP BY name, manager
      ORDER BY participations DESC
    `, [`%${manager}%`]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'No results found' });
    }

    return reply.status(200).send(result.rows);
  });

  // Search by period
  fastify.get('/search/periodo', { preHandler: authenticate }, async (request, reply) => {
    const { start, end } = request.query;

    if (!start || !end) {
      return reply.status(400).send({ error: 'Start and end dates are required' });
    }

    const result = await pool.query(`
      SELECT round, COUNT(*) AS participants, MIN(drawn_at) AS drawn_at
      FROM draws
      WHERE drawn_at BETWEEN $1 AND $2
      GROUP BY round
      ORDER BY round DESC
    `, [start, end]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'No results found' });
    }

    return reply.status(200).send(result.rows);
  });

  // Search by round
  fastify.get('/search/rodada', { preHandler: authenticate }, async (request, reply) => {
    const { round } = request.query;

    if (!round) {
      return reply.status(400).send({ error: 'Round is required' });
    }

    const result = await pool.query(`
      SELECT position, name, manager, creci, drawn_at, round
      FROM draws
      WHERE round = $1
      ORDER BY position ASC
    `, [round]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Round not found' });
    }

    return reply.status(200).send(result.rows);
  });
}

module.exports = adminRoutes;