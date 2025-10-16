const accordion = document.getElementById('sermonAccordion');
const feedback = document.getElementById('resultFeedback');
const metaElement = document.getElementById('resultMeta');
const copyButton = document.getElementById('copySermonBtn');

function setFeedback(message, variant = 'info') {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.variant = variant;
}

function extractSermonId() {
  const match = window.location.pathname.match(/\/client\/app\/result\/([^/]+)/);
  return match ? match[1] : null;
}

function createDetails(summaryText, bodyContent) {
  const details = document.createElement('details');
  details.open = true;
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

function renderPoints(points) {
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

function renderReferences(references) {
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

function buildClipboardContent(sermon, metadata) {
  const header = `Sermão (${metadata?.category || 'Categoria não informada'} - ${metadata?.depth || 'curto'})`;
  const thesis = `Tese: ${sermon.thesis}`;
  const points = sermon.points
    .map((point, index) => `${index + 1}. ${point.title}: ${point.summary}`)
    .join('\n');
  const illustration = `Ilustração: ${sermon.illustration}`;
  const references = `Referências: ${sermon.references
    .map((ref) => `${ref.reference} (${ref.note})`)
    .join('; ')}`;
  const callToAction = `Aplicação: ${sermon.callToAction}`;

  return [header, thesis, 'Pontos:', points, illustration, references, callToAction].join('\n\n');
}

function attachCopyHandler(sermon, metadata) {
  if (!copyButton) return;
  copyButton.disabled = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildClipboardContent(sermon, metadata));
      setFeedback('Esboço copiado com sucesso.', 'success');
    } catch (error) {
      console.error('Erro ao copiar o sermão:', error);
      setFeedback('Não foi possível copiar o conteúdo automaticamente.', 'error');
    }
  });
}

function renderSermon(data) {
  if (!accordion) return;
  accordion.innerHTML = '';

  const thesisParagraph = document.createElement('p');
  thesisParagraph.textContent = data.sermon.thesis;
  accordion.appendChild(createDetails('Tese central', thesisParagraph));

  accordion.appendChild(createDetails('Pontos principais', renderPoints(data.sermon.points)));

  const illustrationParagraph = document.createElement('p');
  illustrationParagraph.textContent = data.sermon.illustration;
  accordion.appendChild(createDetails('Ilustração', illustrationParagraph));

  accordion.appendChild(createDetails('Referências bíblicas', renderReferences(data.sermon.references)));

  const callParagraph = document.createElement('p');
  callParagraph.textContent = data.sermon.callToAction;
  accordion.appendChild(createDetails('Chamado à ação', callParagraph));

  if (metaElement) {
    const created = data.createdAt ? new Date(data.createdAt) : null;
    const createdText = created ? created.toLocaleString('pt-BR') : 'instante atual';
    metaElement.textContent = `${data.metadata?.category || 'Categoria indefinida'} • Profundidade: ${
      data.metadata?.depth || 'curto'
    } • Gerado em ${createdText}`;
  }

  attachCopyHandler(data.sermon, data.metadata);
}

async function loadSermon() {
  const sermonId = extractSermonId();
  if (!sermonId) {
    setFeedback('Identificador do sermão inválido.', 'error');
    return;
  }

  setFeedback('Carregando esboço gerado...', 'info');

  try {
    const response = await fetch(`/api/generate/sermon/${sermonId}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Não encontrado.' }));
      throw new Error(data.message || 'Erro ao carregar o sermão.');
    }
    const data = await response.json();
    renderSermon(data);
    setFeedback('Esboço disponível. Revise com cuidado pastoral.', 'success');
  } catch (error) {
    console.error(error);
    setFeedback(error.message || 'Não foi possível carregar o sermão.', 'error');
  }
}

if (accordion) {
  loadSermon();
}
