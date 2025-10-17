import { renderSermonAccordion, buildClipboardContent, describeMetadata } from './sermon-utils.js';
import { showToast } from './toast.js';

const accordion = document.getElementById('sermonAccordion');
const feedback = document.getElementById('resultFeedback');
const metaElement = document.getElementById('resultMeta');
const copyButton = document.getElementById('copySermonBtn');
const exportButton = document.getElementById('exportToggle');
const exportMenu = document.getElementById('exportMenu');
const exportWrapper = document.getElementById('exportActions');
const shareButton = document.getElementById('shareActionBtn');
const sharePanel = document.getElementById('sharePanel');
const shareInfoText = document.getElementById('shareInfoText');
const shareCopyBtn = document.getElementById('shareCopyBtn');
const shareRevokeBtn = document.getElementById('shareRevokeBtn');

const ensuredUserId = window.LogosAI?.ensureUserId?.();

const state = {
  sermonId: null,
  sermon: null,
  metadata: null,
  share: { shared: false },
};

function setFeedback(message, variant = 'info') {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.variant = variant;
}

function extractSermonId() {
  const match = window.location.pathname.match(/\/client\/app\/result\/([^/]+)/);
  return match ? match[1] : null;
}

function closeExportMenu() {
  if (exportMenu && !exportMenu.hidden) {
    exportMenu.hidden = true;
    exportButton?.setAttribute('aria-expanded', 'false');
  }
}

function toggleExportMenu() {
  if (!exportMenu || !exportButton) return;
  const willOpen = exportMenu.hidden;
  closeSharePanel();
  exportMenu.hidden = !willOpen;
  exportButton.setAttribute('aria-expanded', String(willOpen));
}

function closeSharePanel() {
  if (sharePanel && !sharePanel.hidden) {
    sharePanel.hidden = true;
    shareButton?.setAttribute('aria-expanded', 'false');
  }
}

function toggleSharePanel() {
  if (!sharePanel || !shareButton) return;
  const willOpen = sharePanel.hidden;
  closeExportMenu();
  if (willOpen) {
    sharePanel.hidden = false;
    shareButton.setAttribute('aria-expanded', 'true');
  } else {
    closeSharePanel();
  }
}

function registerGlobalDismiss() {
  document.addEventListener('click', (event) => {
    if (exportWrapper && !exportWrapper.contains(event.target)) {
      closeExportMenu();
    }
    if (shareButton && !shareButton.contains(event.target) && sharePanel && !sharePanel.contains(event.target)) {
      closeSharePanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeExportMenu();
      closeSharePanel();
    }
  });
}

function updateMetadataDescription(createdAt, metadata) {
  if (!metaElement) return;
  metaElement.textContent = describeMetadata(metadata, createdAt);
}

function attachCopyHandler() {
  if (!copyButton || !state.sermon) return;
  copyButton.disabled = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildClipboardContent(state.sermon, state.metadata));
      setFeedback('Esboço copiado com sucesso.', 'success');
      showToast('Sermão copiado para a área de transferência.', 'success');
    } catch (error) {
      console.error('Erro ao copiar o sermão:', error);
      setFeedback('Não foi possível copiar o conteúdo automaticamente.', 'error');
    }
  });
}

async function downloadExport(format) {
  if (!state.sermonId || !ensuredUserId) {
    setFeedback('Não foi possível validar o acesso ao sermão.', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/export/${state.sermonId}.${format}`, {
      headers: { 'x-user-id': ensuredUserId },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Erro na exportação.' }));
      throw new Error(data.message || 'Não foi possível exportar.');
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `sermao-${state.sermonId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    showToast('Exportado com sucesso.', 'success');
  } catch (error) {
    console.error(error);
    setFeedback(error.message || 'Erro ao exportar o sermão.', 'error');
    showToast('Não foi possível exportar este sermão.', 'error');
  } finally {
    closeExportMenu();
  }
}

function registerExportActions() {
  if (!exportButton || !exportMenu) return;
  exportButton.addEventListener('click', () => {
    if (window.LogosAI?.flags && window.LogosAI.flags.export === false) {
      showToast('O módulo de exportação está temporariamente indisponível.', 'error');
      return;
    }
    toggleExportMenu();
  });

  exportMenu.querySelectorAll('[data-format]').forEach((button) => {
    button.addEventListener('click', () => {
      const format = button.getAttribute('data-format');
      if (format) {
        downloadExport(format);
      }
    });
  });
}

function resolveShareUrl(shareState) {
  if (!shareState?.shared) return null;
  const base = window.location.origin.replace(/\/$/, '');
  return `${base}${shareState.url}`;
}

function updateSharePanel() {
  if (!sharePanel || !shareInfoText || !shareCopyBtn || !shareRevokeBtn) return;
  if (state.share.shared) {
    shareInfoText.textContent = `Link ativo: ${resolveShareUrl(state.share)}`;
    shareCopyBtn.textContent = 'Copiar link';
    shareRevokeBtn.disabled = false;
  } else {
    shareInfoText.textContent = 'Nenhum link público está ativo para este sermão.';
    shareCopyBtn.textContent = 'Gerar link público';
    shareRevokeBtn.disabled = true;
  }
}

async function fetchShareState() {
  if (!state.sermonId || !ensuredUserId) return;
  try {
    const response = await fetch(`/api/share/${state.sermonId}`, {
      headers: { 'x-user-id': ensuredUserId },
    });
    if (!response.ok) {
      throw new Error('Não foi possível carregar o status de compartilhamento.');
    }
    state.share = await response.json();
  } catch (error) {
    console.warn(error);
    state.share = { shared: false };
  } finally {
    updateSharePanel();
  }
}

async function ensureShareLink() {
  if (!state.sermonId || !ensuredUserId) {
    throw new Error('Usuário não autorizado.');
  }

  if (state.share.shared) {
    return state.share;
  }

  const response = await fetch(`/api/share/${state.sermonId}`, {
    method: 'POST',
    headers: { 'x-user-id': ensuredUserId },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Não foi possível compartilhar.' }));
    throw new Error(data.message || 'Erro ao criar o link público.');
  }

  state.share = await response.json();
  updateSharePanel();
  return state.share;
}

async function handleShareCopy() {
  try {
    const shareState = await ensureShareLink();
    const shareUrl = resolveShareUrl(shareState);
    if (!shareUrl) {
      throw new Error('Não foi possível montar o link de compartilhamento.');
    }
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link público copiado com sucesso.', 'success');
  } catch (error) {
    console.error(error);
    setFeedback(error.message || 'Erro ao compartilhar o sermão.', 'error');
    showToast('Não foi possível gerar o link público.', 'error');
  }
}

async function handleShareRevoke() {
  if (!state.sermonId || !ensuredUserId) return;
  try {
    const response = await fetch(`/api/share/${state.sermonId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': ensuredUserId },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Erro ao remover link.' }));
      throw new Error(data.message || 'Não foi possível remover o link.');
    }
    state.share = { shared: false };
    updateSharePanel();
    showToast('Link público removido.', 'info');
  } catch (error) {
    console.error(error);
    setFeedback(error.message || 'Erro ao remover o link público.', 'error');
  }
}

function registerShareActions() {
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      toggleSharePanel();
    });
  }
  if (shareCopyBtn) {
    shareCopyBtn.addEventListener('click', handleShareCopy);
  }
  if (shareRevokeBtn) {
    shareRevokeBtn.addEventListener('click', handleShareRevoke);
  }
}

async function loadSermon() {
  state.sermonId = extractSermonId();
  if (!state.sermonId) {
    setFeedback('Identificador do sermão inválido.', 'error');
    return;
  }

  if (!ensuredUserId) {
    setFeedback(
      'Não foi possível validar o usuário local para carregar este sermão.',
      'error'
    );
    return;
  }

  setFeedback('Carregando esboço gerado...', 'info');

  try {
    const response = await fetch(`/api/generate/sermon/${state.sermonId}`, {
      headers: { 'x-user-id': ensuredUserId },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Não encontrado.' }));
      throw new Error(data.message || 'Erro ao carregar o sermão.');
    }
    const data = await response.json();
    state.sermon = data.sermon;
    state.metadata = data.metadata;
    renderSermonAccordion(accordion, state.sermon);
    updateMetadataDescription(data.createdAt, data.metadata);
    attachCopyHandler();
    setFeedback('Esboço disponível. Revise com cuidado pastoral.', 'success');
    await fetchShareState();
  } catch (error) {
    console.error(error);
    setFeedback(error.message || 'Não foi possível carregar o sermão.', 'error');
  }
}

if (accordion) {
  registerGlobalDismiss();
  registerExportActions();
  registerShareActions();
  loadSermon();
}
