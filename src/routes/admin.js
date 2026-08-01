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

  // Search by date
  fastify.get('/search/periodo', { preHandler: authenticate }, async (request, reply) => {
    const { date } = request.query;

    if (!date) {
      return reply.status(400).send({ error: 'Date is required' });
    }

    const result = await pool.query(`
      SELECT round, position, name, manager, creci, drawn_at
      FROM draws
      WHERE drawn_at::date = $1::date
      ORDER BY round DESC, position ASC
    `, [date]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Sem sorteios na data buscada' });
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

  
// Evolução de participantes por rodada
  fastify.get('/charts/evolution', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT round, COUNT(*) AS participants
      FROM draws
      GROUP BY round
      ORDER BY round ASC
    `);
    return reply.status(200).send(result.rows);
  });

  // Participação por gerente
  fastify.get('/charts/managers', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT manager, COUNT(*) AS participations
      FROM draws
      GROUP BY manager
      ORDER BY participations DESC
    `);
    return reply.status(200).send(result.rows);
  });

  // Distribuição de posições top 3
  fastify.get('/charts/positions', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT name,
        COUNT(*) FILTER (WHERE position = 1) AS first,
        COUNT(*) FILTER (WHERE position = 2) AS second,
        COUNT(*) FILTER (WHERE position = 3) AS third
      FROM draws
      GROUP BY name
      ORDER BY first DESC
      LIMIT 10
    `);
    return reply.status(200).send(result.rows);
  });

  // Sorteios por dia da semana
  fastify.get('/charts/weekdays', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT TO_CHAR(drawn_at AT TIME ZONE 'America/Sao_Paulo', 'Day') AS weekday,
      EXTRACT(DOW FROM drawn_at AT TIME ZONE 'America/Sao_Paulo') AS day_number,
      COUNT(DISTINCT round) AS draws
      FROM draws
      GROUP BY weekday, day_number
      ORDER BY day_number ASC
    `);
    return reply.status(200).send(result.rows);
  });

  // Assiduidade por corretor
  fastify.get('/charts/attendance', { preHandler: authenticate }, async (request, reply) => {
    const totalRounds = await pool.query('SELECT COUNT(DISTINCT round) AS total FROM draws');
    const total = totalRounds.rows[0].total;

    const result = await pool.query(`
      SELECT name, COUNT(*) AS participations,
      ROUND(COUNT(*) * 100.0 / $1, 1) AS attendance_rate
      FROM draws
      GROUP BY name
      ORDER BY attendance_rate DESC
      LIMIT 10
    `, [total]);

    return reply.status(200).send(result.rows);
  });

  // Average position per corretor
  fastify.get('/insights/avg-position', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT name, manager,
        COUNT(*) AS participations,
        ROUND(AVG(position), 1) AS avg_position,
        MIN(position) AS best_position,
        MAX(position) AS worst_position
      FROM draws
      GROUP BY name, manager
      ORDER BY avg_position ASC
    `);
    return reply.status(200).send(result.rows);
  });

  // New vs returning corretores per round
  fastify.get('/insights/new-vs-returning', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      SELECT d.round,
        COUNT(*) AS total,
        COUNT(CASE WHEN prev.name IS NULL THEN 1 END) AS new_corretores,
        COUNT(CASE WHEN prev.name IS NOT NULL THEN 1 END) AS returning_corretores
      FROM draws d
      LEFT JOIN (
        SELECT DISTINCT name, round FROM draws
      ) prev ON prev.name = d.name AND prev.round < d.round
      GROUP BY d.round
      ORDER BY d.round ASC
    `);
    return reply.status(200).send(result.rows);
  });

  // Participation streaks
  fastify.get('/insights/streaks', { preHandler: authenticate }, async (request, reply) => {
    const result = await pool.query(`
      WITH rounds AS (
        SELECT DISTINCT round FROM draws ORDER BY round
      ),
      corretor_rounds AS (
        SELECT DISTINCT name, manager, round FROM draws
      ),
      streaks AS (
        SELECT name, manager, COUNT(*) AS consecutive_rounds
        FROM (
          SELECT name, manager, round,
            round - ROW_NUMBER() OVER (PARTITION BY name ORDER BY round) AS grp
          FROM corretor_rounds
        ) s
        GROUP BY name, manager, grp
      )
      SELECT name, manager, MAX(consecutive_rounds) AS max_streak
      FROM streaks
      GROUP BY name, manager
      ORDER BY max_streak DESC
    `);
    return reply.status(200).send(result.rows);
  });

  // Ranking by period
  fastify.get('/insights/ranking-period', { preHandler: authenticate }, async (request, reply) => {
    const { start, end } = request.query;

    if (!start || !end) {
      return reply.status(400).send({ error: 'Start and end dates are required' });
    }

    const result = await pool.query(`
      SELECT name, manager, COUNT(*) AS participations
      FROM draws
      WHERE drawn_at BETWEEN $1::date AND ($2::date + INTERVAL '1 day')
      GROUP BY name, manager
      ORDER BY participations DESC
    `, [start, end]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Sem dados para o período selecionado' });
    }

    return reply.status(200).send(result.rows);
  });
}


module.exports = adminRoutes;