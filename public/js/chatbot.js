'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const launcher = document.querySelector('[data-chatbot-launcher]');
  const panel = document.querySelector('[data-chatbot-panel]');
  const close = document.querySelector('[data-chatbot-close]');
  const form = document.querySelector('[data-chatbot-form]');
  const input = document.querySelector('[data-chatbot-input]');
  const messages = document.querySelector('[data-chatbot-messages]');
  const options = document.querySelector('[data-chatbot-options]');
  if (!launcher || !panel || !form || !input || !messages || !options) return;

  let mainOptions = [];
  let sending = false;
  const submit = form.querySelector('button[type="submit"]');

  function addMessage(text, sender, action) {
    const item = document.createElement('div');
    item.className = `chatbot-message chatbot-message-${sender}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    item.appendChild(paragraph);

    if (action?.url) {
      const link = document.createElement('a');
      link.href = action.url;
      link.textContent = action.tipo === 'WHATSAPP' ? 'Abrir WhatsApp' : 'Ir a la sección';
      if (action.tipo === 'WHATSAPP') {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      item.appendChild(link);
    }

    if (action?.tipo === 'SIMULACION') {
      const badge = document.createElement('span');
      badge.className = 'chatbot-test-badge';
      badge.textContent = `Modo de prueba: ${action.etiqueta}`;
      item.appendChild(badge);
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function showOptions(items) {
    options.replaceChildren();
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.titulo;
      button.addEventListener('click', () => sendQuestion(item.titulo));
      options.appendChild(button);
    });
  }

  async function sendQuestion(question) {
    const clean = question.trim();
    if (clean.length < 2 || sending) return;
    sending = true;
    if (submit) submit.disabled = true;
    addMessage(clean, 'user');
    input.value = '';
    input.disabled = true;
    options.replaceChildren();

    try {
      const response = await fetch('/api/chatbot/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ mensaje: clean }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error('unavailable');
      addMessage(data.respuesta, 'bot', data.accion);
      showOptions(
        data.opciones?.length > 0
          ? data.opciones
          : mainOptions
      );
    } catch {
      addMessage('El asistente no está disponible temporalmente. Intentá nuevamente más tarde.', 'bot');
      showOptions(mainOptions);
    } finally {
      sending = false;
      if (submit) submit.disabled = false;
      input.disabled = false;
      if (!panel.hidden) input.focus();
    }
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }
  launcher.addEventListener('click', () => {
    if (!panel.hidden) { closePanel(); return; }
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  });
  close?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.reportValidity()) sendQuestion(input.value);
  });

  try {
    const response = await fetch('/api/chatbot', { headers: { Accept: 'application/json' } });
    const config = await response.json();
    if (!response.ok || !config.activo) return;
    mainOptions = config.opciones || [];
    launcher.hidden = false;
    addMessage(config.mensajeBienvenida, 'bot');
    showOptions(mainOptions);
  } catch {
    launcher.hidden = true;
  }
});
