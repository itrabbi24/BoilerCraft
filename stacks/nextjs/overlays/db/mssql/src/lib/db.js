import sql from 'mssql';

const config = {
  user: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || '{{DB_NAME}}',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: { encrypt: false, trustServerCertificate: true }
};

export function connectDB() {
  globalThis.__bcMssql ||= sql.connect(config);
  return globalThis.__bcMssql;
}

export { sql };
