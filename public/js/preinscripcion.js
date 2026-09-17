'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-preinscripcion-form]');
  const printButton = document.querySelector(
    '[data-print-confirmation]'
  );

  if (printButton) {
    printButton.addEventListener('click', () => {
      window.print();
    });
  }

  if (!form) return;

  const steps = Array.from(
    form.querySelectorAll('[data-form-step]')
  );

  const progressItems = Array.from(
    document.querySelectorAll('[data-progress-step]')
  );

  const review = form.querySelector('[data-form-review]');
  const email = form.querySelector('#contacto-email');
  const emailConfirmation = form.querySelector(
    '#contacto-email-confirmacion'
  );

  let currentStep = 0;

  function showStep(index) {
    currentStep = Math.max(
      0,
      Math.min(index, steps.length - 1)
    );

    steps.forEach((step, stepIndex) => {
      const active = stepIndex === currentStep;

      step.hidden = !active;
      step.classList.toggle('is-active', active);
    });

    progressItems.forEach((item, itemIndex) => {
      item.classList.toggle(
        'is-active',
        itemIndex === currentStep
      );

      item.classList.toggle(
        'is-complete',
        itemIndex < currentStep
      );
    });

    const legend = steps[currentStep].querySelector('legend');

    if (legend) {
      legend.setAttribute('tabindex', '-1');
      legend.focus();
    }

    window.scrollTo({
      top: form.offsetTop - 120,
      behavior: 'smooth',
    });
  }

  function validateEmails() {
    if (!email || !emailConfirmation) return true;

    emailConfirmation.setCustomValidity('');

    if (
      email.value.trim().toLowerCase() !==
      emailConfirmation.value.trim().toLowerCase()
    ) {
      emailConfirmation.setCustomValidity(
        'Los correos electrónicos no coinciden.'
      );

      return false;
    }

    return true;
  }

  function validateCurrentStep() {
    const currentFields = Array.from(
      steps[currentStep].querySelectorAll(
        'input, select, textarea'
      )
    );

    validateEmails();

    for (const field of currentFields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }

    return true;
  }

  function readValue(selector) {
    const field = form.querySelector(selector);

    if (!field || typeof field.value !== 'string') {
      return 'No informado';
    }

    const value = field.value.trim();
    return value || 'No informado';
  }

  function addReviewSection(title, entries) {
    const section = document.createElement('section');
    section.className = 'review-section';

    const heading = document.createElement('h2');
    heading.textContent = title;
    section.appendChild(heading);

    const list = document.createElement('dl');

    entries.forEach(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;

      const description = document.createElement('dd');
      description.textContent = value;

      list.append(term, description);
    });

    section.appendChild(list);
    review.appendChild(section);
  }

  function buildReview() {
    if (!review) return;

    review.replaceChildren();

    addReviewSection('Aspirante', [
      [
        'Nombre completo',
        `${readValue('#aspirante-nombres')} ${readValue(
          '#aspirante-apellido'
        )}`,
      ],
      ['DNI', readValue('#aspirante-dni')],
      [
        'Fecha de nacimiento',
        readValue('#aspirante-fecha'),
      ],
      [
        'Escuela de procedencia',
        readValue('#aspirante-escuela'),
      ],
    ]);

    addReviewSection('Responsable 1', [
      [
        'Nombre completo',
        `${readValue('#responsable1-nombres')} ${readValue(
          '#responsable1-apellido'
        )}`,
      ],
      ['Vínculo', readValue('#responsable1-vinculo')],
      ['Teléfono', readValue('#responsable1-telefono')],
      ['Correo', readValue('#responsable1-email')],
    ]);

    const responsable2Name = readValue(
      '#responsable2-nombres'
    );

    if (responsable2Name !== 'No informado') {
      addReviewSection('Responsable 2', [
        [
          'Nombre completo',
          `${responsable2Name} ${readValue(
            '#responsable2-apellido'
          )}`,
        ],
        ['Vínculo', readValue('#responsable2-vinculo')],
        ['Teléfono', readValue('#responsable2-telefono')],
        ['Correo', readValue('#responsable2-email')],
      ]);
    }

    addReviewSection('Contacto', [
      ['Correo de confirmación', readValue('#contacto-email')],
      ['Teléfono', readValue('#contacto-telefono')],
    ]);
  }

  form.addEventListener('click', (event) => {
    const nextButton = event.target.closest('[data-next-step]');
    const previousButton = event.target.closest(
      '[data-previous-step]'
    );

    if (nextButton) {
      if (!validateCurrentStep()) return;

      if (currentStep === 2) {
        buildReview();
      }

      showStep(currentStep + 1);
    }

    if (previousButton) {
      showStep(currentStep - 1);
    }
  });

  if (email && emailConfirmation) {
    email.addEventListener('input', validateEmails);
    emailConfirmation.addEventListener(
      'input',
      validateEmails
    );
  }

  form.addEventListener('submit', (event) => {
    if (!validateCurrentStep()) {
      event.preventDefault();
      return;
    }

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
    }
  });

  showStep(0);
});