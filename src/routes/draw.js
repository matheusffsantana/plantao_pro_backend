const pool = require('../db');

async function drawRoutes(fastify, options) {

    //Perform the draw
    fastify.post('/', async (request, reply) => {
        const usersResult = await pool.query('SELECT * FROM users');
        const users = usersResult.rows;

        if (users.length === 0) {
            return reply.status(400).send({ error: 'No users registered' });
        }

        //Fisher-Yates shuffle
        for (let i = users.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [users[i], users[j]] = [users[j], users[i]];
        }

        //Get current round
        const roundResult = await pool.query('SELECT COALESCE(MAX(round),0) + 1 as ROUND from draws');
        const round = roundResult.rows[0].round;

        // Save draw results
        for (let i = 0; i < users.length; i++) {
            await pool.query(
                'INSERT INTO draws (user_id, name, manager, creci, position, round) VALUES ($1, $2, $3, $4, $5, $6)',
                [users[i].id, users[i].name, users[i].manager, users[i].creci, i + 1, round]
            );
        }

        return reply.status(201).send({ message: 'Draw performed sucessfully', round });
    });

    // Get last draw result
    fastify.get('/', async (request, reply) => {
        const result = await pool.query(`
    SELECT position, name, manager, creci, drawn_at, round
    FROM draws
    WHERE round = (SELECT MAX(round) FROM draws)
    ORDER BY position ASC
    `);

        if (result.rows.length === 0) {
            return reply.status(404).send({ error: 'No draw performed yet' });
        }

        return reply.status(200).send(result.rows);
    });

}

module.exports = drawRoutes;