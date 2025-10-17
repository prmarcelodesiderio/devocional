function createDetails(summaryText, bodyContent, open = true) {
  const details = document.createElement('details');
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = summaryText;
  details.appendChild(summary);

  if (Array.isArray(bodyContent)) {
    bodyContent.forEach((content) => details.appendChild(content));
  } else {
    details.appendChild(bodyContent);
  }

  return details;
}

function renderPoints(points = []) {
  const list = document.createElement('ol');
  list.className = 'result__points';
  points.forEach((point, index) => {
    const item = document.createElement('li');
    const title = document.createElement('h3');
    title.textContent = `${index + 1}. ${point.title}`;
    const summary = document.createElement('p');
    summary.textContent = point.summary;
    item.appendChild(title);
    item.appendChild(summary);
    list.appendChild(item);
  });
  return list;
}

function renderReferences(references = []) {
  const list = document.createElement('ul');
  list.className = 'result__references';
  references.forEach((ref) => {
    const item = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = ref.reference;
    const note = document.createElement('span');
    note.textContent = ` — ${ref.note}`;
    item.appendChild(strong);
    item.appendChild(note);
    list.appendChild(item);
  });
  return list;
}

export function renderSermonAccordion(container, sermon) {
  container.innerHTML = '';

  const thesisParagraph = document.createElement('p');
  thesisParagraph.textContent = sermon.thesis;
  container.appendChild(createDetails('Tese central', thesisParagraph));

  container.appendChild(createDetails('Pontos principais', renderPoints(sermon.points)));

  const illustrationParagraph = document.createElement('p');
  illustrationParagraph.textContent = sermon.illustration;
  container.appendChild(createDetails('Ilustração', illustrationParagraph));

  container.appendChild(createDetails('Referências bíblicas', renderReferences(sermon.references)));

  const callParagraph = document.createElement('p');
  callParagraph.textContent = sermon.callToAction;
  container.appendChild(createDetails('Chamado à ação', callParagraph));
}

export function buildClipboardContent(sermon, metadata = {}) {
  const header = `Sermão (${metadata?.theme || metadata?.category || 'Tema não informado'} - ${
    metadata?.depth || 'curto'
  })`;
  const thesis = `Tese: ${sermon.thesis}`;
  const points = (sermon.points || [])
    .map((point, index) => `${index + 1}. ${point.title}: ${point.summary}`)
    .join('\n');
  const illustration = `Ilustração: ${sermon.illustration}`;
  const references = `Referências: ${(sermon.references || [])
    .map((ref) => `${ref.reference} (${ref.note})`)
    .join('; ')}`;
  const callToAction = `Aplicação: ${sermon.callToAction}`;

  return [header, thesis, 'Pontos:', points, illustration, references, callToAction].join('\n\n');
}

export function describeMetadata(metadata = {}, createdAt) {
  const category = metadata.category || 'Categoria indefinida';
  const depth = metadata.depth || 'curto';
  const theme = metadata.theme ? ` • Tema: ${metadata.theme}` : '';
  const created = createdAt ? new Date(createdAt) : null;
  const createdText = created ? created.toLocaleString('pt-BR') : 'instante atual';
  return `${category}${theme} • Profundidade: ${depth} • Gerado em ${createdText}`;
}
