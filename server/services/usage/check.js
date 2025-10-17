const FREE_SERMON_LIMIT = 10;
const COUNTER_KEY = 'sermon_free_monthly';

function getPeriodBounds(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
}

async function consumeFreePlanUsage(client, userId) {
  if (!client) {
    throw new Error('Database client is required to consume usage.');
  }

  const { periodStart, periodEnd } = getPeriodBounds();

  const selectForUpdate = async () => {
    const result = await client.query(
      `SELECT id, counter_value
         FROM usage_counters
        WHERE user_id = $1
          AND counter_key = $2
          AND period_start = $3
        FOR UPDATE`,
      [userId, COUNTER_KEY, periodStart]
    );
    return result.rows[0];
  };

  let counterRow = await selectForUpdate();

  if (!counterRow) {
    await client.query(
      `INSERT INTO usage_counters (user_id, counter_key, counter_value, period_start, period_end)
       VALUES ($1, $2, 0, $3, $4)
       ON CONFLICT (user_id, counter_key, period_start) DO NOTHING`,
      [userId, COUNTER_KEY, periodStart, periodEnd]
    );

    counterRow = await selectForUpdate();
  }

  if (!counterRow) {
    throw new Error('Não foi possível inicializar o contador de uso.');
  }

  if (Number(counterRow.counter_value) >= FREE_SERMON_LIMIT) {
    const error = new Error('limite atingido');
    error.statusCode = 402;
    throw error;
  }

  const updated = await client.query(
    `UPDATE usage_counters
        SET counter_value = counter_value + 1,
            updated_at = NOW()
      WHERE id = $1
      RETURNING counter_value`,
    [counterRow.id]
  );

  const row = updated.rows[0];

  if (!row) {
    throw new Error('Não foi possível atualizar o contador de uso.');
  }

  return {
    counterId: counterRow.id,
    used: Number(row.counter_value),
    limit: FREE_SERMON_LIMIT,
  };
}

module.exports = {
  consumeFreePlanUsage,
  FREE_SERMON_LIMIT,
  COUNTER_KEY,
};
