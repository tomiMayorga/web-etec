(() => {
  'use strict';
  const popup = document.getElementById('events-day-popup');
  if (!popup) return;
  const title = popup.querySelector('#events-popup-title');
  const body = popup.querySelector('.events-popup-body');
  const closeButton = popup.querySelector('.events-popup-close');
  let active = null;
  let pinned = false;
  let timer;
  let restoringFocus = false;

  function position() {
    if (!active || popup.hidden) return;
    const anchor = active.getBoundingClientRect();
    const margin = 12;
    const width = popup.offsetWidth;
    const height = popup.offsetHeight;
    const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - width - margin));
    const below = anchor.bottom + 6;
    const top = below + height <= window.innerHeight - margin ? below : Math.max(margin, anchor.top - height - 6);
    popup.style.left = `${left}px`;
    popup.style.top = `${Math.min(top, Math.max(margin, window.innerHeight - height - margin))}px`;
  }

  function close(restore = false) {
    clearTimeout(timer);
    const trigger = active;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    popup.hidden = true;
    active = null;
    pinned = false;
    if (restore && trigger) {
      restoringFocus = true;
      trigger.focus({ preventScroll: true });
      restoringFocus = false;
    }
  }

  function open(trigger, pin = false) {
    clearTimeout(timer);
    if (restoringFocus || (pinned && trigger !== active && !pin)) return;
    if (active !== trigger) {
      const template = document.getElementById(trigger.dataset.dayTemplate);
      if (!(template instanceof HTMLTemplateElement)) return;
      if (active) active.setAttribute('aria-expanded', 'false');
      body.replaceChildren(template.content.cloneNode(true));
      title.textContent = trigger.dataset.dayLabel;
      active = trigger;
      body.scrollTop = 0;
    }
    pinned = pinned || pin;
    trigger.setAttribute('aria-expanded', 'true');
    popup.hidden = false;
    position();
    if (pin) closeButton.focus({ preventScroll: true });
  }

  function scheduleClose() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!pinned && !popup.matches(':hover') && !popup.contains(document.activeElement) && active !== document.activeElement) close();
    }, 220);
  }

  document.querySelectorAll('.calendar-day-trigger').forEach(trigger => {
    trigger.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') open(trigger); });
    trigger.addEventListener('pointerleave', scheduleClose);
    trigger.addEventListener('focus', () => open(trigger));
    trigger.addEventListener('click', () => open(trigger, true));
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(trigger, true); }
    });
  });
  popup.addEventListener('pointerenter', () => clearTimeout(timer));
  popup.addEventListener('pointerleave', scheduleClose);
  closeButton.addEventListener('click', () => close(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) { event.preventDefault(); close(popup.contains(document.activeElement)); }
  });
  document.addEventListener('pointerdown', event => {
    if (active && !popup.contains(event.target) && !active.contains(event.target)) close();
  });
  document.addEventListener('focusin', event => {
    if (active && !popup.contains(event.target) && event.target !== active) close();
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', event => {
    if (active && !popup.contains(event.target)) position();
  }, true);
})();
