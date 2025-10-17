const { Router } = require('express');
const { v4: uuidv4, validate: validateUuid } = require('uuid');
const { getPool } = require('../db/client');
const { requireArtifactForUser } = require('../services/artifacts/access');
const { findArtifactByShareUuid } = require('../services/artifacts/repository');

const router = Router();

function buildShareResponse(artifact) {
  if (!artifact.shareUuid) {
    return { shared: false };
  }

  return {
    shared: true,
    shareId: artifact.shareUuid,
    url: `/share/${artifact.shareUuid}`,
  };
}

router.get('/:id', async (req, res) => {
  try {
    const artifact = await requireArtifactForUser(req.params.id, req.headers['x-user-id']);
    return res.json(buildShareResponse(artifact));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Erro ao consultar compartilhamento.' });
  }
});

router.post('/:id', async (req, res) => {
  const pool = getPool();
  try {
    const artifact = await requireArtifactForUser(req.params.id, req.headers['x-user-id']);
    const shareUuid = uuidv4();

    await pool.query('UPDATE artifacts SET share_uuid = $1 WHERE id = $2', [shareUuid, artifact.id]);

    return res.status(201).json({
      shared: true,
      shareId: shareUuid,
      url: `/share/${shareUuid}`,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Não foi possível ativar o compartilhamento.' });
  }
});

router.delete('/:id', async (req, res) => {
  const pool = getPool();
  try {
    const artifact = await requireArtifactForUser(req.params.id, req.headers['x-user-id']);
    await pool.query('UPDATE artifacts SET share_uuid = NULL WHERE id = $1', [artifact.id]);
    return res.status(204).send();
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Não foi possível remover o compartilhamento.' });
  }
});

router.get('/public/:uuid', async (req, res) => {
  const { uuid } = req.params;
  if (!validateUuid(uuid)) {
    return res.status(400).json({ message: 'Link de compartilhamento inválido.' });
  }

  try {
    const artifact = await findArtifactByShareUuid(uuid);
    if (!artifact) {
      return res.status(404).json({ message: 'Conteúdo compartilhado não encontrado.' });
    }

    return res.json({
      id: artifact.id,
      createdAt: artifact.createdAt,
      metadata: artifact.metadata,
      sermon: artifact.sermon,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Não foi possível carregar o conteúdo compartilhado.' });
  }
});

module.exports = router;
