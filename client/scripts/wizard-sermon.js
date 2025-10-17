const form = document.getElementById('sermonForm');
const feedback = document.getElementById('wizardFeedback');
const submitButton = document.getElementById('generateSermonBtn');

function setFeedback(message, variant = 'info') {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.variant = variant;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!form) return;

  const ensuredUserId = window.LogosAI?.ensureUserId?.();
  const formData = new FormData(form);
  const payload = {
    category: formData.get('category'),
    theme: formData.get('theme'),
    depth: formData.get('depth') || 'curto',
    userId: ensuredUserId,
  };

  if (!payload.category || !payload.theme) {
    setFeedback('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Gerando...';
    setFeedback('Estamos preparando o esboço com responsabilidade teológica.', 'info');

    const response = await fetch('/api/generate/sermon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Não foi possível gerar.' }));
      throw new Error(data.message || 'Erro ao gerar o sermão.');
    }

    const data = await response.json();
    if (data?.userId && window.LogosAI?.ensureUserId) {
      window.localStorage.setItem('logosai-user-id', data.userId);
    }
    setFeedback('Esboço pronto! Redirecionando para a visualização.', 'success');
    window.location.href = `/client/app/result/${data.id}`;
  } catch (error) {
    const message = error?.message === 'limite atingido'
      ? 'Limite mensal do plano gratuito atingido. Volte no próximo período ou migre de plano.'
      : error?.message || 'Não foi possível gerar o sermão agora.';
    setFeedback(message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Gerar esboço';
  }
}

if (form) {
  form.addEventListener('submit', handleSubmit);
}
