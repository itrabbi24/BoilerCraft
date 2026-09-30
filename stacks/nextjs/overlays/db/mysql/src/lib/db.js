import mysql from 'mysql2/promise';

const pool = globalThis.__bcMysql || (globalThis.__bcMysql = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || '{{DB_NAME}}',
  port: parseInt(process.env.DB_PORT || '3306', 10)
}));

export function connectDB() {
  return pool;
}
