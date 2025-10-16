const USER_STORAGE_KEY = 'logosai-user-id';

function ensureUserId() {
  try {
    const existing = window.localStorage.getItem(USER_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const identifier = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(USER_STORAGE_KEY, identifier);
    return identifier;
  } catch (error) {
    console.warn('Não foi possível persistir o identificador local do usuário.', error);
    return undefined;
  }
}

async function loadFeatureFlags() {
  try {
    const response = await fetch('/api/config/feature-flags');
    if (!response.ok) {
      throw new Error('Não foi possível carregar as feature flags.');
    }
    const data = await response.json();
    return data.flags || {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function applyFeatureFlags(flags) {
  const modules = document.querySelectorAll('[data-feature]');
  const statusElement = document.getElementById('featureFlagStatus');
  const inactive = [];

  modules.forEach((moduleElement) => {
    const flagKey = moduleElement.getAttribute('data-feature');
    const enabled = Boolean(flags[flagKey]);

    if (!enabled) {
      moduleElement.classList.add('disabled');
      moduleElement.setAttribute('aria-disabled', 'true');
      inactive.push(flagKey);
    } else {
      moduleElement.classList.remove('disabled');
      moduleElement.removeAttribute('aria-disabled');
    }
  });

  if (statusElement) {
    if (inactive.length === 0) {
      statusElement.textContent = 'Todos os módulos estão ativos.';
    } else {
      statusElement.textContent = `Os módulos ${inactive.join(', ')} estão temporariamente desativados.`;
    }
  }
}

function showCurrentYear() {
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

async function bootstrap() {
  window.LogosAI = { ensureUserId };
  showCurrentYear();
  const flags = await loadFeatureFlags();
  applyFeatureFlags(flags);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
