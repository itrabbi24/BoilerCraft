const mysql = require('mysql2/promise');

let pool;

async function connectDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || '{{DB_NAME}}',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });
    await pool.query('SELECT 1');
    console.log('⚡ Connected to MySQL');
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err.message);
  }
  return pool;
}

module.exports = { connectDB, getPool: () => pool };
