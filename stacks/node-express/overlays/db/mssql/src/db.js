const sql = require('mssql');

const config = {
  user: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || '{{DB_NAME}}',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: { encrypt: false, trustServerCertificate: true }
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log('⚡ Connected to MSSQL (SQL Server)');
    return pool;
  } catch (err) {
    console.error('❌ MSSQL Connection Error:', err.message);
  }
}

module.exports = { connectDB, sql };
