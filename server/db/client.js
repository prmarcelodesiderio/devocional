const { Pool } = require('pg');
const { envConfig } = require('../config/env');

let pool;

function getPool() {
  if (!envConfig.databaseUrl) {
    throw new Error('DATABASE_URL is required to use the database client.');
  }

  if (!pool) {
    pool = new Pool({ connectionString: envConfig.databaseUrl });
  }

  return pool;
}

async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  withTransaction,
};
