require('dotenv').config();
const pool = require('./db');

async function setupDb() {
  await pool.query('DROP TABLE IF EXISTS draws');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.query('DROP TABLE IF EXISTS admins');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      manager VARCHAR(100) NOT NULL,
      creci VARCHAR(20) NOT NULL,
      registered_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS draws (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name VARCHAR(100) NOT NULL,
      manager VARCHAR(100) NOT NULL,
      creci VARCHAR(20) NOT NULL,
      position INTEGER NOT NULL,
      drawn_at TIMESTAMPTZ DEFAULT NOW(),
      round INTEGER NOT NULL
    )
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

  console.log('Tables created successfully!');
  await pool.end();
}

setupDb().catch(console.error);
