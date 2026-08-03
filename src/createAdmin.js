require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'change_me';
  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO admins (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    [email, hashedPassword]
  );

  console.log('Admin created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  await pool.end();
}

createAdmin().catch(console.error);