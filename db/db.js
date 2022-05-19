const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const connectionString = process.env.RUBUS_BACKEND_DB_URI;

const pool = new Pool({
  connectionString: connectionString,
});

module.exports = {
  async query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ label: 'executed db query', text, params, duration, rows: res.rowCount });
    return res;
  }
};
