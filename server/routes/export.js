const { Router } = require('express');
const { requireArtifactForUser } = require('../services/artifacts/access');
const { buildMarkdown } = require('../services/export/templates');
const { createPdfStream } = require('../services/export/pdf');
const { buildDocxBuffer } = require('../services/export/docx');

const router = Router();

function buildFilename(metadata, id) {
  const theme = metadata?.theme || metadata?.category || 'sermao';
  const normalized = String(theme)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);
  const suffix = normalized || `sermao-${id}`;
  return `${suffix}-${id}`;
}

router.get('/:id.:format', async (req, res) => {
  const { id, format } = req.params;
  const userId = req.headers['x-user-id'];

  try {
    const artifact = await requireArtifactForUser(id, userId);
    const filename = buildFilename(artifact.metadata, artifact.id);

    if (!artifact.sermon || typeof artifact.sermon !== 'object') {
      const error = new Error('Conteúdo do sermão inválido para exportação.');
      error.statusCode = 422;
      throw error;
    }

    switch (format) {
      case 'pdf':
        createPdfStream(res, artifact.sermon, artifact.metadata, filename);
        break;
      case 'docx': {
        const buffer = await buildDocxBuffer(artifact.sermon, artifact.metadata);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
        break;
      }
      case 'md': {
        const markdown = buildMarkdown(artifact.sermon, artifact.metadata);
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
        res.send(markdown);
        break;
      }
      default: {
        res.status(400).json({ message: 'Formato de exportação não suportado.' });
        return;
      }
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (!res.headersSent) {
      res
        .status(statusCode)
        .json({ message: error.message || 'Não foi possível exportar o sermão.' });
    }
  }
});

module.exports = router;
