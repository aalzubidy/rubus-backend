const { Pool } = require('pg');
const { logger } = require('./logger');

const connectionString = process.env.RUBUS_BACKEND_DB_URI;

const pool = new Pool({
  connectionString: connectionString,
});

module.exports = {
  async query(text, params, queryLabel = '') {
    logger.debug({ label: `about to execute db query - ${queryLabel}`, text, params });
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ label: `executed db query - ${queryLabel}`, text, params, duration, rowCount: res.rowCount, rows: res.rows });
    return res.rows || res;
  }
};
