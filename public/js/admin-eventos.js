(() => {
  'use strict';
  const menus = [...document.querySelectorAll('[data-event-actions]')].map((menu, index) => {
    const trigger = menu.querySelector('summary');
    const panel = menu.querySelector('.admin-event-actions-list');
    panel.id = `event-actions-panel-${index}`;
    panel.hidden = true;
    panel.classList.add('is-floating');
    document.body.append(panel);
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    return { menu, trigger, panel };
  });

  function close(item, restoreFocus = false) {
    item.menu.open = false;
    item.panel.hidden = true;
    item.trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) item.trigger.focus();
  }

  function position(item) {
    const anchor = item.trigger.getBoundingClientRect();
    const margin = 10;
    const { offsetWidth: width, offsetHeight: height } = item.panel;
    const left = Math.max(margin, Math.min(anchor.right - width, window.innerWidth - width - margin));
    const below = anchor.bottom + 6;
    const top = below + height <= window.innerHeight - margin ? below : anchor.top - height - 6;
    item.panel.style.left = `${left}px`;
    item.panel.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - height - margin))}px`;
  }

  menus.forEach(item => {
    const { menu, trigger, panel } = item;
    menu.addEventListener('toggle', () => {
      if (!menu.open) { close(item); return; }
      menus.forEach(other => { if (other !== item) close(other); });
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position(item);
    });
    const onKeyDown = event => {
      if (event.key === 'Escape' && menu.open) {
        event.preventDefault();
        close(item, true);
      }
    };
    menu.addEventListener('keydown', onKeyDown);
    panel.addEventListener('keydown', onKeyDown);
    trigger.addEventListener('keydown', event => {
      if (event.key === 'Tab' && !event.shiftKey && menu.open) {
        event.preventDefault();
        panel.querySelector('a').focus();
      }
    });
    panel.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const links = panel.querySelectorAll('a');
      if (event.shiftKey && event.target === links[0]) {
        event.preventDefault();
        trigger.focus();
      } else if (!event.shiftKey && event.target === links[links.length - 1]) {
        // Devuelve el foco al disparador para que Tab siga por la siguiente fila.
        close(item, true);
      }
    });
  });
  document.addEventListener('click', event => {
    menus.forEach(item => { if (!item.menu.contains(event.target) && !item.panel.contains(event.target)) close(item); });
  });
  document.addEventListener('focusin', event => {
    menus.forEach(item => { if (!item.menu.contains(event.target) && !item.panel.contains(event.target)) close(item); });
  });
  window.addEventListener('resize', () => menus.forEach(item => { if (item.menu.open) position(item); }));
  window.addEventListener('scroll', event => {
    menus.forEach(item => { if (item.menu.open && !item.panel.contains(event.target)) close(item); });
  }, true);
})();
