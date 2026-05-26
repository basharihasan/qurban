require('dotenv').config();

/**
 * Knex configuration.
 * Supports both DATABASE_URL (Supabase / Render) and individual params.
 * SSL is enabled automatically in production.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Build connection config.
 * DATABASE_URL takes priority (used by Supabase, Render, Heroku, etc.)
 */
const buildConnection = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'qurban_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};

/** @type { Object.<string, import("knex").Knex.Config> } */
module.exports = {
  development: {
    client: 'pg',
    connection: buildConnection(),
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: buildConnection(),
    pool: {
      min: 2,
      max: 10,
      // Supabase serverless connections can time out — keep alive
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000,
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
};
