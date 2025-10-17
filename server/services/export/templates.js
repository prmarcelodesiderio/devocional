function normalizeString(value, fallback = 'Não informado') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function composeHeader(metadata = {}) {
  const type = normalizeString(metadata.type || 'Sermão');
  const theme = normalizeString(metadata.theme || 'Tema não informado');
  const category = normalizeString(metadata.category || 'Categoria não informada');
  const depth = normalizeString(metadata.depth || 'curto');

  return {
    title: `${type} — ${theme}`,
    category,
    depth,
  };
}

function formatPoints(points = []) {
  return points.map((point, index) => ({
    title: normalizeString(point.title || `Ponto ${index + 1}`),
    summary: normalizeString(point.summary || ''),
    index: index + 1,
  }));
}

function formatReferences(references = []) {
  return references.map((reference) => ({
    reference: normalizeString(reference.reference || ''),
    note: normalizeString(reference.note || ''),
  }));
}

function buildPlainText(sermon, metadata = {}) {
  const header = composeHeader(metadata);
  const points = formatPoints(sermon.points);
  const references = formatReferences(sermon.references);

  const lines = [];
  lines.push(header.title.toUpperCase());
  lines.push(`Categoria: ${header.category}`);
  lines.push(`Profundidade: ${header.depth}`);
  lines.push('');
  lines.push(`Tese: ${normalizeString(sermon.thesis || '')}`);
  lines.push('');
  lines.push('Pontos principais:');
  points.forEach((point) => {
    lines.push(`${point.index}. ${point.title}`);
    lines.push(`   ${point.summary}`);
  });
  lines.push('');
  lines.push(`Ilustração: ${normalizeString(sermon.illustration || '')}`);
  lines.push('');
  lines.push('Referências bíblicas:');
  references.forEach((ref) => {
    lines.push(`- ${ref.reference} — ${ref.note}`);
  });
  lines.push('');
  lines.push(`Aplicação prática: ${normalizeString(sermon.callToAction || '')}`);

  return lines.join('\n');
}

function buildMarkdown(sermon, metadata = {}) {
  const header = composeHeader(metadata);
  const points = formatPoints(sermon.points);
  const references = formatReferences(sermon.references);

  const sections = [];
  sections.push(`# ${header.title}`);
  sections.push(`*Categoria:* ${header.category}`);
  sections.push(`*Profundidade:* ${header.depth}`);
  sections.push('');
  sections.push(`## Tese`);
  sections.push(normalizeString(sermon.thesis || ''));
  sections.push('');
  sections.push(`## Pontos principais`);
  points.forEach((point) => {
    sections.push(`### ${point.index}. ${point.title}`);
    sections.push(point.summary);
    sections.push('');
  });
  sections.push(`## Ilustração`);
  sections.push(normalizeString(sermon.illustration || ''));
  sections.push('');
  sections.push(`## Referências bíblicas`);
  references.forEach((ref) => {
    sections.push(`- **${ref.reference}** — ${ref.note}`);
  });
  sections.push('');
  sections.push(`## Aplicação prática`);
  sections.push(normalizeString(sermon.callToAction || ''));

  return sections.join('\n');
}

module.exports = {
  buildPlainText,
  buildMarkdown,
  composeHeader,
  formatPoints,
  formatReferences,
};
