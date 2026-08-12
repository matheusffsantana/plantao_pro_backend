const pool = require('../db');

async function usersRoutes(fastify, options) {

    //register a new user

    fastify.post('/', async (request, reply) => {
        const { name, manager, creci } = request.body;

        if (!name || !manager || !creci) {
            return reply.status(400).send({ error: 'All fields are required' })
        }

        const result = await pool.query(
            'INSERT INTO users (name, manager, creci) VALUES ($1, $2, $3) RETURNING *', [name, manager, creci]
        );

        return reply.status(201).send(result.rows[0]);
    });

    // Get all users
    fastify.get('/', async (request, reply) => {
        const result = await pool.query(
            'SELECT * FROM users ORDER BY registered_at ASC'
        );

        return reply.status(200).send(result.rows);
    });

    // Reset users list
    fastify.delete('/reset', async (request,reply) => {
        await pool.query('DELETE FROM users');
        return reply.status(200).send({ message: 'Users list reset successfully'})
    })

    // Get last registration date
  fastify.get('/last-date', async (request, reply) => {
    const result = await pool.query(
      'SELECT MAX(registered_at) AS last_date FROM users'
    );
    return reply.status(200).send(result.rows[0]);
  });

}

module.exports = usersRoutes