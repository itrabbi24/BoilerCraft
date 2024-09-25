import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Password',
  database: process.env.DB_NAME || '{{PROJECT_NAME}}',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // Set to true for Azure
    trustServerCertificate: true
  }
};

let poolPromise = null;

export async function getMssqlPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig)
      .then(pool => {
        console.log('⚡ Connected to MSSQL Server (Next.js App Router)');
        return pool;
      })
      .catch(err => {
        poolPromise = null;
        console.error('Database connection failed:', err);
        throw err;
      });
  }
  return poolPromise;
}

export { sql };
