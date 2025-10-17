const { getPool } = require('../../db/client');

function parseArtifactRow(row) {
  if (!row) return null;

  let sermon = row.content;
  if (typeof sermon === 'string') {
    try {
      sermon = JSON.parse(row.content);
    } catch (error) {
      sermon = { raw: row.content };
    }
  }

  let metadata = row.metadata;
  if (metadata && typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (_err) {
      metadata = {};
    }
  }
  metadata = metadata || {};

  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    metadata,
    sermon,
    shareUuid: row.share_uuid || null,
    prompt: row.prompt,
  };
}

async function findArtifactById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, user_id, content, metadata, created_at, share_uuid, prompt
       FROM artifacts
      WHERE id = $1`,
    [id]
  );
  return parseArtifactRow(result.rows[0]);
}

async function findArtifactByShareUuid(shareUuid) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, user_id, content, metadata, created_at, share_uuid, prompt
       FROM artifacts
      WHERE share_uuid = $1`,
    [shareUuid]
  );
  return parseArtifactRow(result.rows[0]);
}

module.exports = {
  parseArtifactRow,
  findArtifactById,
  findArtifactByShareUuid,
};
