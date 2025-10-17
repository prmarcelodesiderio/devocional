import { renderSermonAccordion, describeMetadata } from './sermon-utils.js';
import { showToast } from './toast.js';

const accordion = document.getElementById('shareAccordion');
const metaElement = document.getElementById('shareMeta');
const feedback = document.getElementById('shareFeedback');

function setFeedback(message, variant = 'info') {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.variant = variant;
}

function extractShareUuid() {
  const match = window.location.pathname.match(/\/share\/([^/]+)/);
  return match ? match[1] : null;
}

async function loadSharedSermon() {
  const uuid = extractShareUuid();
  if (!uuid) {
    setFeedback('Link de compartilhamento inválido.', 'error');
    return;
  }

  setFeedback('Carregando sermão compartilhado...', 'info');

  try {
    const response = await fetch(`/api/share/public/${uuid}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Conteúdo indisponível.' }));
      throw new Error(data.message || 'Conteúdo compartilhado não encontrado.');
    }

    const data = await response.json();
    renderSermonAccordion(accordion, data.sermon);
    if (metaElement) {
      metaElement.textContent = describeMetadata(data.metadata, data.createdAt);
    }
    setFeedback('Conteúdo carregado com sucesso.', 'success');
    showToast('Visualizando sermão compartilhado.', 'info');
  } catch (error) {
    console.error(error);
    setFeedback(error.message || 'Não foi possível carregar o sermão.', 'error');
  }
}

if (accordion) {
  loadSharedSermon();
}
