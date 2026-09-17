(() => {
  const inicializarEditorMultimedia = (formulario) => {
    if (formulario.dataset.mediaReady === 'true') return;
    formulario.dataset.mediaReady = 'true';
    const contenedor = formulario.querySelector('[data-media-rows]');
    const campoContenido = formulario.querySelector('[data-media-value]');
    if (!contenedor || !campoContenido) return;

    const sincronizar = () => {
      const valores = [...contenedor.querySelectorAll('[data-media-row]')].map((fila) => [
        fila.querySelector('[data-media-url]')?.value.trim() || '',
        fila.querySelector('[data-media-title]')?.value.trim() || '',
        fila.querySelector('[data-media-description]')?.value.trim() || '',
        fila.querySelector('[data-media-date]')?.value.trim() || '',
      ]).filter((partes) => partes.some(Boolean)).map((partes) => partes.join(' | '));
      campoContenido.value = valores.join('\n');
    };

    const csrfToken = formulario.querySelector('input[name="_csrf"]')?.value || '';
    const subirArchivo = async (fila, archivo) => {
      const boton = fila.querySelector('[data-media-upload]');
      const estado = fila.querySelector('[data-media-upload-status]');
      if (!archivo || !boton || !estado) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        estado.textContent = 'Elegí una imagen JPG, PNG o WebP.';
        return;
      }
      if (archivo.size > 8 * 1024 * 1024) {
        estado.textContent = 'La imagen no puede superar los 8 MB.';
        return;
      }

      const datos = new FormData();
      datos.append('_csrf', csrfToken);
      datos.append('archivo', archivo);
      boton.disabled = true;
      estado.textContent = 'Subiendo…';
      try {
        const respuesta = await fetch('/admin/contenidos/imagenes', { method: 'POST', body: datos, credentials: 'same-origin' });
        const resultado = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok || typeof resultado.url !== 'string') {
          throw new Error(typeof resultado.error === 'string' ? resultado.error : 'No se pudo subir la imagen.');
        }
        const campoUrl = fila.querySelector('[data-media-url]');
        if (campoUrl) campoUrl.value = resultado.url;
        estado.textContent = 'Imagen subida. Guardá la sección para actualizar el carrusel.';
        sincronizar();
      } catch (error) {
        estado.textContent = error instanceof Error ? error.message : 'No se pudo subir la imagen.';
      } finally {
        boton.disabled = false;
      }
    };

    const conectarCarga = (fila) => {
      const boton = fila.querySelector('[data-media-upload]');
      const campoArchivo = fila.querySelector('[data-media-file]');
      if (!boton || !campoArchivo || boton.dataset.uploadReady === 'true') return;
      boton.dataset.uploadReady = 'true';
      boton.addEventListener('click', () => campoArchivo.click());
      campoArchivo.addEventListener('change', () => {
        const archivo = campoArchivo.files?.[0];
        if (archivo) void subirArchivo(fila, archivo);
      });
    };

    const agregarFila = () => {
      const fila = document.createElement('div');
      fila.className = 'admin-media-row';
      fila.setAttribute('data-media-row', '');
      fila.innerHTML = '<div class="form-field"><label>Imagen o URL</label><div class="admin-media-source"><input type="text" data-media-url placeholder="/img/foto.jpg o https://..." maxlength="500"><input type="file" data-media-file accept="image/jpeg,image/png,image/webp" hidden><button class="form-button form-button-secondary admin-media-upload" type="button" data-media-upload><i class="fa-solid fa-upload" aria-hidden="true"></i> Subir</button></div><small data-media-upload-status></small></div><div class="form-field"><label>Título de la imagen</label><input type="text" data-media-title maxlength="160"></div><div class="form-field"><label>Descripción</label><input type="text" data-media-description maxlength="500"></div><div class="form-field"><label>Fecha (opcional)</label><input type="text" data-media-date maxlength="80"></div><button class="form-button form-button-secondary admin-media-remove" type="button" data-media-remove>Quitar elemento</button>';
      const plantilla = formulario.querySelector('template[data-media-template]');
      if (plantilla) fila.replaceChildren(plantilla.content.cloneNode(true));
      contenedor.appendChild(fila);
      conectarCarga(fila);
    };

    formulario.addEventListener('submit', sincronizar);
    formulario.querySelector('[data-media-add]')?.addEventListener('click', () => { agregarFila(); sincronizar(); });
    contenedor.querySelectorAll('[data-media-row]').forEach(conectarCarga);
    contenedor.addEventListener('click', (evento) => {
      const elemento = evento.target instanceof Element ? evento.target : null;
      const boton = elemento?.closest('[data-media-remove]');
      if (!boton) return;
      boton.closest('[data-media-row]')?.remove();
      sincronizar();
    });
    contenedor.addEventListener('input', sincronizar);
  };

  const inicializarSelectorAutoridad = () => {
    const selector = document.querySelector('[data-authority-group]');
    const wrapper = document.querySelector('[data-new-authority-group]');
    const input = document.querySelector('#nuevo-grupo-nombre');
    if (!selector || !wrapper || !input) return;
    const sincronizar = () => {
      const nueva = selector.value === '__nueva__';
      wrapper.hidden = !nueva;
      input.required = nueva;
      if (!nueva) input.value = '';
    };
    selector.addEventListener('change', sincronizar);
    sincronizar();
  };

  const inicializarCargaPdf = (contenedor) => {
    if (contenedor.dataset.pdfReady === 'true') return;
    const boton = contenedor.querySelector('[data-pdf-select]');
    const archivo = contenedor.querySelector('[data-pdf-file]');
    const url = contenedor.querySelector('[data-pdf-url]');
    const nombre = contenedor.querySelector('[data-pdf-name]');
    const estado = contenedor.querySelector('[data-pdf-status]');
    const formulario = contenedor.closest('form');
    if (!boton || !archivo || !url || !nombre || !estado || !formulario) return;
    contenedor.dataset.pdfReady = 'true';
    if (boton.tagName !== 'LABEL') boton.addEventListener('click', () => archivo.click());
    archivo.addEventListener('change', async () => {
      const seleccionado = archivo.files?.[0];
      if (!seleccionado) return;
      if (seleccionado.type !== 'application/pdf') { estado.textContent = 'Elegí un archivo PDF.'; return; }
      if (seleccionado.size > 8 * 1024 * 1024) { estado.textContent = 'El PDF no puede superar los 8 MB.'; return; }
      const datos = new FormData();
      datos.append('_csrf', formulario.querySelector('input[name="_csrf"]')?.value || '');
      datos.append('archivo', seleccionado);
      boton.disabled = true;
      estado.textContent = 'Subiendo…';
      try {
        const respuesta = await fetch('/admin/contenidos/pliegos', { method: 'POST', body: datos, credentials: 'same-origin' });
        const resultado = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok || typeof resultado.url !== 'string') throw new Error(typeof resultado.error === 'string' ? resultado.error : 'No se pudo subir el PDF.');
        url.value = resultado.url;
        nombre.textContent = contenedor.dataset.pdfSuccessName || 'Pliego cargado correctamente';
        estado.textContent = contenedor.dataset.pdfSuccessMessage || 'Guardá la contratación para publicar el nuevo pliego.';
      } catch (error) {
        estado.textContent = error instanceof Error ? error.message : 'No se pudo subir el PDF.';
      } finally {
        boton.disabled = false;
        archivo.value = '';
      }
    });
  };

  const inicializarSelectorAnioCompras = () => {
    const selector = document.querySelector('[data-purchases-year]');
    const wrapper = document.querySelector('[data-purchases-new-year]');
    const input = wrapper?.querySelector('input[name="nuevoGrupo"]');
    if (!selector || !wrapper || !input) return;
    const sincronizar = () => { const nuevo = selector.value === '__nueva__'; wrapper.hidden = !nuevo; input.required = nuevo; if (!nuevo) input.value = ''; };
    selector.addEventListener('change', sincronizar);
    sincronizar();
  };

  document.querySelectorAll('[data-media-form]').forEach(inicializarEditorMultimedia);
  document.querySelectorAll('[data-beca-create]').forEach((formulario) => {
    const selector = formulario.querySelector('select[name="grupo"]');
    const campos = formulario.querySelector('[data-beca-button-fields]');
    if (!selector || !campos) return;
    const actualizar = () => {
      const visible = selector.value === 'Postulación';
      campos.hidden = !visible;
      campos.disabled = !visible;
    };
    selector.addEventListener('change', actualizar);
    actualizar();
  });
  document.querySelectorAll('[data-pdf-upload]').forEach(inicializarCargaPdf);
  inicializarSelectorAutoridad();
  inicializarSelectorAnioCompras();
})();


