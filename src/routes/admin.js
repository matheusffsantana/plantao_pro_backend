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

}

module.exports = adminRoutes;