const TOAST_VARIANTS = ['info', 'success', 'error'];

function ensureContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, variant = 'info', timeout = 4000) {
  const container = ensureContainer();
  const type = TOAST_VARIANTS.includes(variant) ? variant : 'info';

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.role = 'status';
  toast.textContent = message;
  toast.addEventListener('click', () => {
    toast.classList.add('toast--hide');
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--hide');
    setTimeout(() => toast.remove(), 250);
  }, timeout);
}

if (typeof window !== 'undefined') {
  window.LogosAI = window.LogosAI || {};
  window.LogosAI.showToast = showToast;
}
