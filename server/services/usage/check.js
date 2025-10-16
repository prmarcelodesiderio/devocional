const { getPool } = require('../../db/client');

const FREE_SERMON_LIMIT = 10;
const COUNTER_KEY = 'sermon_free_monthly';

function getPeriodBounds(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
}

async function ensureFreePlanAvailability(userId) {
  const pool = getPool();
  const { periodStart, periodEnd } = getPeriodBounds();

  const existing = await pool.query(
    `SELECT id, counter_value
       FROM usage_counters
      WHERE user_id = $1
        AND counter_key = $2
        AND period_start = $3`,
    [userId, COUNTER_KEY, periodStart]
  );

  let counterRow = existing.rows[0];

  if (!counterRow) {
    const inserted = await pool.query(
      `INSERT INTO usage_counters (user_id, counter_key, counter_value, period_start, period_end)
       VALUES ($1, $2, 0, $3, $4)
       RETURNING id, counter_value`,
      [userId, COUNTER_KEY, periodStart, periodEnd]
    );
    counterRow = inserted.rows[0];
  }

  if (Number(counterRow.counter_value) >= FREE_SERMON_LIMIT) {
    const error = new Error('limite atingido');
    error.statusCode = 402;
    throw error;
  }

  return {
    counterId: counterRow.id,
    used: Number(counterRow.counter_value),
    limit: FREE_SERMON_LIMIT,
  };
}

async function incrementFreePlanUsage(counterId) {
  const pool = getPool();
  const updated = await pool.query(
    `UPDATE usage_counters
        SET counter_value = counter_value + 1,
            updated_at = NOW()
      WHERE id = $1
      RETURNING counter_value`,
    [counterId]
  );

  const row = updated.rows[0];
  return Number(row?.counter_value ?? 0);
}

module.exports = {
  ensureFreePlanAvailability,
  incrementFreePlanUsage,
  FREE_SERMON_LIMIT,
  COUNTER_KEY,
};
