const express = require('express');
const { v4: uuidv4, validate: validateUuid } = require('uuid');
const { getPool } = require('../db/client');
const { generateFreeSermon } = require('../services/sermon/generateFree');
const { ensureFreePlanAvailability, incrementFreePlanUsage } = require('../services/usage/check');
const { requireArtifactForUser } = require('../services/artifacts/access');

const router = express.Router();

async function ensureUser(pool, userId) {
  const effectiveId = userId && validateUuid(userId) ? userId : uuidv4();
  const email = `guest+${effectiveId}@logosai.app`;

  await pool.query(
    `INSERT INTO users (id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [effectiveId, email, 'Visitante Logos AI']
  );

  return effectiveId;
}

router.post('/sermon', async (req, res) => {
  const pool = getPool();
  const { category, theme, depth = 'curto', userId } = req.body || {};
  const type = 'Sermão';

  if (!category || !theme) {
    return res.status(400).json({ message: 'category e theme são obrigatórios.' });
  }

  try {
    const effectiveUserId = await ensureUser(pool, userId);
    const usage = await ensureFreePlanAvailability(effectiveUserId);
    const { prompt, sermon } = await generateFreeSermon({ category, theme, depth });

    const metadata = { type, category, theme, depth };
    const inserted = await pool.query(
      `INSERT INTO artifacts (user_id, prompt, content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [effectiveUserId, prompt, JSON.stringify(sermon), JSON.stringify(metadata)]
    );

    const artifact = inserted.rows[0];
    const usageTotal = await incrementFreePlanUsage(usage.counterId);

    return res.status(201).json({
      id: artifact.id,
      createdAt: artifact.created_at,
      userId: effectiveUserId,
      usage: {
        used: usageTotal,
        limit: usage.limit,
      },
      sermon,
      metadata,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Não foi possível gerar o sermão no momento.',
    });
  }
});

router.get('/sermon/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const artifact = await requireArtifactForUser(req.params.id, userId);

    return res.json({
      id: artifact.id,
      userId: artifact.userId,
      createdAt: artifact.createdAt,
      metadata: artifact.metadata,
      sermon: artifact.sermon,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Erro ao carregar o sermão.' });
  }
});

module.exports = router;
