const { validate: validateUuid } = require('uuid');
const { findArtifactById } = require('./repository');

async function requireArtifactForUser(artifactId, userId) {
  if (!validateUuid(artifactId)) {
    const error = new Error('Identificador inválido.');
    error.statusCode = 400;
    throw error;
  }

  if (!userId || !validateUuid(userId)) {
    const error = new Error('Usuário não autorizado a acessar este recurso.');
    error.statusCode = 403;
    throw error;
  }

  const artifact = await findArtifactById(artifactId);
  if (!artifact) {
    const error = new Error('Sermão não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (artifact.userId !== userId) {
    const error = new Error('Sermão não disponível para este usuário.');
    error.statusCode = 403;
    throw error;
  }

  return artifact;
}

module.exports = {
  requireArtifactForUser,
};
