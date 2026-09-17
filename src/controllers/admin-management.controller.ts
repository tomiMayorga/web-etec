import { enlaceVerdeValido } from '../services/uba-verde-content';
import { enlaceTramiteSchema } from '../services/tramites-content';
import { Request, Response } from 'express';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { RolUsuario, EstadoCiclo, SeccionPagina } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { crearHashPassword } from '../services/auth.service';
import { generarTokenCsrf } from '../security/request-protection';
import { crearHuellaIp } from '../security/personal-data';
import { asegurarSeccionesAutoridades, asegurarSeccionesHistoria, asegurarSeccionesPagina, cargarSeccionesPagina, obtenerSeccionesInicialesPagina } from '../services/pagina-content.service';
import { RequestConImagen } from '../security/multipart-image';
import { cargarCronogramaIngreso } from '../services/cronograma-ingreso.service';
import { cargarEmpresas } from '../services/empresas-content.service';
import { cargarConfiguracionIngresantes } from '../services/ingresantes.service';
import { cargarOrdenMerito } from '../services/orden-merito.service';
import { camposPostulacionBeca, guardarPostulacionBeca, leerPostulacionBeca } from '../services/beca-postulacion';

function textoQuery(valor: unknown, max = 80): string {
  return typeof valor === 'string' ? valor.trim().slice(0, max) : '';
}

const urlDocumento = z.string().trim().max(500).refine(
  (valor) => !valor || /^https:\/\/[^\s]+$/i.test(valor) || /^\/uploads\/pliegos\/[A-Za-z0-9._/-]+$/i.test(valor),
  'La dirección del documento no es válida.',
);

function renderAdmin(res: Response, vista: string, title: string, datos: Record<string, unknown>): void {
  res.render(`admin/${vista}`, {
    title: `${title} - ETEC UBA`,
    page: `admin-${vista}`,
    csrfToken: generarTokenCsrf(res.req),
    guardado: typeof res.req.query.guardado === 'string' ? res.req.query.guardado : null,
    leerPostulacionBeca,
    ...datos,
  });
}

export async function mostrarInscripciones(req: Request, res: Response): Promise<void> {
  const busqueda = textoQuery(req.query.buscar);
  const cicloId = Number.parseInt(textoQuery(req.query.ciclo), 10);
  const ciclos = await prisma.cicloIngreso.findMany({ orderBy: { anio: 'desc' }, select: { id: true, anio: true } });
  const inscripciones = await prisma.preinscripcion.findMany({
    where: {
      ...(Number.isInteger(cicloId) ? { cicloId } : {}),
      ...(busqueda ? { OR: [{ apellido: { contains: busqueda } }, { nombres: { contains: busqueda } }, { emailContacto: { contains: busqueda } }] } : {}),
    },
    orderBy: [{ creadoEn: 'desc' }],
    take: 200,
    select: { id: true, numeroSorteo: true, nombres: true, apellido: true, emailContacto: true, telefonoContacto: true, estado: true, creadoEn: true, ciclo: { select: { anio: true } } },
  });
  renderAdmin(res, 'inscripciones', 'Preinscripciones', { inscripciones, ciclos, busqueda, cicloSeleccionado: Number.isInteger(cicloId) ? cicloId : null });
}

export async function mostrarExportaciones(_req: Request, res: Response): Promise<void> {
  const ciclos = await prisma.cicloIngreso.findMany({ orderBy: { anio: 'desc' }, include: { _count: { select: { preinscripciones: true } } } });
  renderAdmin(res, 'exportaciones', 'Exportaciones', { ciclos });
}

export async function exportarInscripciones(req: Request, res: Response): Promise<void> {
  const cicloId = Number.parseInt(textoQuery(req.body.ciclo), 10);
  if (!Number.isInteger(cicloId)) { res.redirect(303, '/admin/exportaciones'); return; }
  const registros = await prisma.preinscripcion.findMany({ where: { cicloId }, orderBy: { numeroSorteo: 'asc' }, select: { numeroSorteo: true, nombres: true, apellido: true, emailContacto: true, telefonoContacto: true, estado: true, ciclo: { select: { anio: true } } } });
  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`;
  const filas = [['numero_sorteo', 'nombres', 'apellido', 'email', 'telefono', 'estado', 'ciclo'], ...registros.map((r) => [r.numeroSorteo, r.nombres, r.apellido, r.emailContacto, r.telefonoContacto, r.estado, r.ciclo.anio])];
  await prisma.eventoAuditoria.create({
    data: {
      usuarioId: req.session.usuarioAdministrativo?.id,
      tipo: 'EXPORTACION_XLSX',
      entidad: 'Preinscripcion',
      entidadId: String(cicloId),
      detalles: JSON.stringify({ formato: 'CSV', cantidad: registros.length }),
      ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
    },
  });
  res.type('text/csv').setHeader('Content-Disposition', `attachment; filename="preinscripciones-${registros[0]?.ciclo.anio ?? 'ciclo'}.csv"`).send(`\uFEFF${filas.map((fila) => fila.map(escapar).join(';')).join('\r\n')}`);
}

export async function mostrarCiclos(_req: Request, res: Response): Promise<void> {
  const ciclos = await prisma.cicloIngreso.findMany({ orderBy: { anio: 'desc' }, include: { _count: { select: { preinscripciones: true } } } });
  renderAdmin(res, 'ciclos', 'Ciclos y fechas', { ciclos });
}

export async function crearCiclo(req: Request, res: Response): Promise<void> {
  const validacion = z.object({ anio: z.coerce.number().int().min(2020).max(2100) }).safeParse(req.body);
  if (validacion.success) {
    await prisma.cicloIngreso.create({ data: { anio: validacion.data.anio, estado: 'BORRADOR' } }).catch(() => undefined);
  }
  res.redirect(303, '/admin/ciclos');
}

export async function actualizarEstadoCiclo(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(textoQuery(req.body.id), 10);
  const estado = req.body.estado as EstadoCiclo;
  if (Number.isInteger(id) && ['BORRADOR', 'ABIERTO', 'CERRADO', 'ARCHIVADO'].includes(estado)) {
    await prisma.cicloIngreso.update({ where: { id }, data: { estado } }).catch(() => undefined);
  }
  res.redirect(303, '/admin/ciclos');
}

export async function mostrarUsuarios(req: Request, res: Response): Promise<void> {
  const usuarios = await prisma.usuarioAdministrativo.findMany({ orderBy: { creadoEn: 'desc' }, select: { id: true, email: true, nombreUsuario: true, nombreMostrado: true, rol: true, activo: true, ultimoAccesoEn: true } });
  renderAdmin(res, 'usuarios', 'Usuarios administrativos', { usuarios, usuarioActualId: req.session.usuarioAdministrativo?.id });
}

export async function crearUsuario(req: Request, res: Response): Promise<void> {
  const validacion = z.object({ email: z.string().trim().email().max(254), nombreMostrado: z.string().trim().min(2).max(100), password: z.string().min(12).max(128), rol: z.enum(['SUPER_ADMIN', 'OPERADOR_INGRESO']) }).safeParse(req.body);
  if (validacion.success) {
    const passwordHash = await crearHashPassword(validacion.data.password);
    await prisma.usuarioAdministrativo.create({ data: { email: validacion.data.email.toLowerCase(), nombreMostrado: validacion.data.nombreMostrado, passwordHash, rol: validacion.data.rol as RolUsuario } }).catch(() => undefined);
  }
  res.redirect(303, '/admin/usuarios');
}

export async function cambiarEstadoUsuario(req: Request, res: Response): Promise<void> {
  const id = textoQuery(req.body.id, 50);
  if (id && id !== req.session.usuarioAdministrativo?.id) await prisma.usuarioAdministrativo.update({ where: { id }, data: { activo: req.body.activo === 'on' } }).catch(() => undefined);
  res.redirect(303, '/admin/usuarios');
}

export async function mostrarAuditoria(_req: Request, res: Response): Promise<void> {
  const registros = await prisma.eventoAuditoria.findMany({ orderBy: { creadoEn: 'desc' }, take: 200, include: { usuario: { select: { nombreMostrado: true, nombreUsuario: true, email: true } } } });
  renderAdmin(res, 'auditoria', 'Auditoría', { registros });
}

export async function mostrarConservacion(_req: Request, res: Response): Promise<void> {
  const solicitudes = await prisma.solicitudEliminacion.findMany({ orderBy: { creadaEn: 'desc' }, take: 200, include: { preinscripcion: { select: { id: true, numeroSorteo: true, estado: true, ciclo: { select: { anio: true } } } }, solicitadaPor: { select: { nombreMostrado: true } } } });
  renderAdmin(res, 'conservacion', 'Conservación de datos', { solicitudes });
}

export async function mostrarContenidos(_req: Request, res: Response): Promise<void> {
  const paginasBase = [
    ['home', '/', 'Inicio'], ['historia', '/historia', 'Historia'], ['autoridades', '/autoridades', 'Autoridades'],
    ['plan', '/plan_de_estudio', 'Plan de estudio'], ['orientaciones', '/orientaciones', 'Orientaciones'],
    ['calendario', '/calendario-escolar', 'Calendario académico'], ['ingreso', '/presentacion', 'Presentación del curso de ingreso'],
    ['novedades', '/novedades-institucionales', 'Novedades institucionales'], ['genero', '/oficina-de-genero', 'Oficina de Género'],
    ['contrataciones', '/contrataciones', 'Compras y contrataciones'], ['recursos-humanos', '/recursos-humanos', 'Recursos Humanos'],
    ['reglamento-convivencial', '/reglamento_convivencial', 'Reglamento convivencial'], ['tramites-alumnos', '/tramites-para-alumnos-as', 'Trámites para alumnos/as'],
    ['rematriculacion', '/rematriculacion', 'Rematriculación'], ['regimen-academico', '/regimen-academico', 'Régimen académico'],
    ['informacion-general', '/informaciongeneral', 'Información general'], ['reglamento-ingreso', '/reglamento', 'Reglamento del ingreso'],
    ['cronograma-curso-ingreso', '/cronograma-curso-ingreso', 'Cronograma del ingreso'], ['sorteo', '/sorteo', 'Sorteo'],
    ['ingresantes', '/ingresantes', 'Ingresantes'], ['orden-de-merito', '/orden-de-merito', 'Orden de mérito'],
    ['condiciones-de-postulacion', '/condiciones-de-postulacion', 'Preguntas frecuentes'], ['uba-verde', '/uba-verde', 'UBA Verde'],
    ['empresas', '/empresas', 'Empresas'], ['uba-en-accion', '/uba-en-accion', 'UBA en acción'],
    ['odontologia-estudiantes', '/servicio-de-odontologia-para-estudiantes', 'Odontología'], ['beca-ricardo-rojas', '/beca-rector-ricardo-rojas', 'Becas'],
    ['actividades-extracurriculares', '/actividades-extracurriculares', 'Actividades extracurriculares'], ['semana-tecnica', '/semana-tecnica', 'Semana Técnica'],
    ['eventos', '/eventos', 'Eventos'],
  ];
  const modeloContenido = prisma.paginaContenido;
  const paginasFallback = paginasBase.map(([clave, ruta, nombre]) => ({ id: clave, clave, ruta, nombre, titulo: nombre, texto: '', mostrarAviso: false }));
  if (!modeloContenido) {
    renderAdmin(res, 'contenidos', 'Contenido del sitio', { paginas: paginasFallback, contenidoDisponible: false });
    return;
  }
  let paginas;
  try {
    const existentes = await modeloContenido.findMany({ orderBy: { nombre: 'asc' } });
    const clavesExistentes = new Set(existentes.map((pagina) => pagina.clave));
    const faltantes = paginasBase.filter(([clave]) => !clavesExistentes.has(clave));
    if (faltantes.length > 0) {
      await prisma.$transaction(faltantes.map(([clave, ruta, nombre]) => modeloContenido.create({ data: { clave, ruta, nombre, titulo: nombre } })));
    }
    paginas = await modeloContenido.findMany({ orderBy: { nombre: 'asc' } });
  } catch {
    /* La pantalla sigue siendo accesible aunque la base esté temporalmente bloqueada. */
    paginas = await modeloContenido.findMany({ orderBy: { nombre: 'asc' } }).catch(() => paginasFallback);
  }
  let seccionesAutoridades: SeccionPagina[] = [];
  try {
    seccionesAutoridades = await asegurarSeccionesAutoridades();
  } catch {
    seccionesAutoridades = [];
  }
  let seccionesHistoria: SeccionPagina[] = [];
  try {
    seccionesHistoria = await asegurarSeccionesHistoria();
  } catch {
    seccionesHistoria = [];
  }
  const seccionesGenericas: Record<string, SeccionPagina[]> = {};
  for (const clave of ['uba-en-accion', 'uba-verde', 'tramites-alumnos', 'sorteo', 'regimen-academico', 'condiciones-de-postulacion', 'plan', 'genero', 'recursos-humanos', 'ingreso', 'beca-ricardo-rojas', 'contrataciones', 'novedades', 'odontologia-estudiantes', 'home', 'orientaciones', 'calendario', 'informacion-general', 'actividades-extracurriculares', 'semana-tecnica', 'reglamento-convivencial', 'reglamento-ingreso', 'rematriculacion']) {
    try {
      seccionesGenericas[clave] = await asegurarSeccionesPagina(clave);
    } catch {
      const existentes = await cargarSeccionesPagina(clave).catch(() => []);
      seccionesGenericas[clave] = existentes.length ? existentes : obtenerSeccionesInicialesPagina(clave);
    }
  }
  const seccionesCronograma = await cargarCronogramaIngreso().catch(() => null);
  const contenidoEmpresas = await cargarEmpresas().catch(() => null);
  const contenidoIngresantes = await cargarConfiguracionIngresantes().catch(() => null);
  let errorMerito = textoQuery(_req.query.errorMerito, 300);
  const ordenMerito = await cargarOrdenMerito().catch(() => {
    errorMerito = 'No se pudo consultar la lista publicada. Volvé a cargar esta pantalla.';
    return null;
  });
  renderAdmin(res, 'contenidos', 'Contenido del sitio', { paginas, contenidoDisponible: true, seccionesAutoridades, seccionesHistoria, seccionesGenericas, seccionesCronograma, contenidoEmpresas, contenidoIngresantes, ordenMerito, errorMerito, meritoGuardado: _req.query.meritoGuardado === 'ok', cicloActual: new Date().getFullYear(), editorAbierto: _req.query.editor === 'merito' ? 'merito' : _req.query.editor === 'cronograma' ? 'cronograma' : _req.query.editor === 'empresas' ? 'empresas' : '' });
}

export async function actualizarContenido(req: Request, res: Response): Promise<void> {
  const validacion = z.object({ id: z.string().min(1).max(40), titulo: z.string().trim().min(2).max(160), texto: z.string().trim().max(2000) }).safeParse(req.body);
  if (validacion.success) {
    await prisma.$transaction(async (tx) => {
      await tx.paginaContenido.update({ where: { id: validacion.data.id }, data: { titulo: validacion.data.titulo, texto: validacion.data.texto, mostrarAviso: req.body.mostrarAviso === 'on' } });
      await tx.eventoAuditoria.create({ data: { usuarioId: req.session.usuarioAdministrativo?.id, tipo: 'MODIFICACION_CONTENIDO', entidad: 'PaginaContenido', entidadId: validacion.data.id, detalles: JSON.stringify({ accion: 'ACTUALIZAR_PAGINA' }) } });
    }).catch(() => undefined);
  }
  res.redirect(303, '/admin/contenidos?guardado=ok');
}

export async function actualizarSeccionPagina(req: Request, res: Response): Promise<void> {
  if (req.body.editorBotonVerde === '1') {
    const seccion = await prisma.seccionPagina.findFirst({ where: { id: typeof req.body.id === 'string' ? req.body.id : '', paginaClave: 'uba-verde', grupo: 'Botón' } });
    if (!seccion || typeof req.body.contenido !== 'string' || !enlaceVerdeValido(req.body.contenido.trim())) {
      res.status(400).send('Revisá el destino del botón: usá HTTPS, una ruta interna o #participar.'); return;
    }
    req.body.grupo = seccion.grupo;
  }
  if (req.body.urlTramite !== undefined || req.body.textoTramite !== undefined) {
    const validado = enlaceTramiteSchema.safeParse(req.body);
    const seccion = await prisma.seccionPagina.findFirst({ where: { id: typeof req.body.id === 'string' ? req.body.id : '', paginaClave: 'tramites-alumnos', grupo: { in: ['Enlaces', 'Legalización'] } } });
    if (!validado.success || !seccion) { res.status(400).send('Revisá el texto y el enlace: usá una dirección HTTPS o un PDF subido desde el panel.'); return; }
    req.body.contenido = JSON.stringify(validado.data);
    req.body.grupo = seccion.grupo;
  }
  if (req.body.botonUrl !== undefined || req.body.botonTexto !== undefined) {
    const campos = camposPostulacionBeca.safeParse(req.body);
    const id = typeof req.body.id === 'string' ? req.body.id : '';
    const seccion = await prisma.seccionPagina.findFirst({ where: { id, paginaClave: 'beca-ricardo-rojas', grupo: 'Postulación' } });
    if (!campos.success || !seccion) {
      res.status(400).send('Revisá las instrucciones, el texto del botón y su dirección HTTPS. Volvé atrás para corregirlos.');
      return;
    }
    req.body.contenido = guardarPostulacionBeca(campos.data);
    req.body.grupo = 'Postulación';
    if (req.body.contenido.length > 2000) { res.status(400).send('Las instrucciones y el botón superan el límite de 2000 caracteres.'); return; }
  }
  const validacion = z.object({ id: z.string().min(1).max(40), grupo: z.string().trim().min(2).max(120), subgrupo: z.string().trim().max(120).optional(), titulo: z.string().trim().min(2).max(160), contenido: z.string().trim().max(2000), pliegoUrl: urlDocumento.optional() }).safeParse(req.body);
  if (validacion.success) {
    const pliegoUrl = validacion.data.pliegoUrl?.trim();
    const contenido = pliegoUrl !== undefined
      ? `${validacion.data.contenido.split(/\r?\n/).filter((linea) => !/^PDF:\s*/i.test(linea.trim())).join('\n')}${pliegoUrl ? `\nPDF: ${pliegoUrl} | Ver Pliego` : ''}`.trim()
      : validacion.data.contenido;
    await prisma.seccionPagina.update({ where: { id: validacion.data.id }, data: { grupo: validacion.data.grupo, subgrupo: validacion.data.subgrupo?.trim() || null, titulo: validacion.data.titulo, contenido, activo: req.body.activo === 'on' } }).then(async (seccion) => {
      await prisma.eventoAuditoria.create({ data: { usuarioId: req.session.usuarioAdministrativo?.id, tipo: 'MODIFICACION_CONTENIDO', entidad: 'SeccionPagina', entidadId: seccion.id, detalles: JSON.stringify({ accion: 'ACTUALIZAR_SECCION', pagina: seccion.paginaClave }) } });
    }).catch(() => undefined);
  }
  res.redirect(303, '/admin/contenidos?guardado=seccion');
}

export async function crearSeccionPagina(req: Request, res: Response): Promise<void> {
  if (req.body.paginaClave === 'beca-ricardo-rojas' && req.body.grupo === 'Postulación') {
    const campos = camposPostulacionBeca.safeParse(req.body);
    if (!campos.success) { res.status(400).send('Completá el texto del botón y una dirección HTTPS válida. Volvé atrás para corregirlos.'); return; }
    req.body.contenido = guardarPostulacionBeca(campos.data);
    if (req.body.contenido.length > 2000) { res.status(400).send('Las instrucciones y el botón superan el límite de 2000 caracteres.'); return; }
  }
  const validacion = z.object({ paginaClave: z.enum(['uba-en-accion', 'uba-verde', 'tramites-alumnos', 'sorteo', 'regimen-academico', 'condiciones-de-postulacion', 'plan', 'autoridades', 'historia', 'genero', 'recursos-humanos', 'ingreso', 'beca-ricardo-rojas', 'contrataciones', 'novedades', 'odontologia-estudiantes', 'home', 'orientaciones', 'informacion-general', 'actividades-extracurriculares', 'semana-tecnica', 'reglamento-convivencial', 'reglamento-ingreso', 'rematriculacion']), grupo: z.string().trim().min(1).max(120), nuevoGrupo: z.string().trim().max(120).optional(), subgrupo: z.string().trim().max(120).optional(), titulo: z.string().trim().min(2).max(160), contenido: z.string().trim().max(2000), pliegoUrl: urlDocumento.optional() }).safeParse(req.body);
  if (validacion.success) {
    if (validacion.data.paginaClave === 'novedades' && !validacion.data.contenido && !validacion.data.pliegoUrl) {
      res.redirect(303, '/admin/contenidos?guardado=seccion');
      return;
    }
    if (validacion.data.paginaClave !== 'novedades' && !validacion.data.contenido) {
      res.redirect(303, '/admin/contenidos?guardado=seccion');
      return;
    }
    const grupo = ['autoridades', 'contrataciones'].includes(validacion.data.paginaClave) && validacion.data.grupo === '__nueva__'
      ? validacion.data.nuevoGrupo?.trim() ?? ''
      : validacion.data.grupo;

    if (grupo.length >= 2 && grupo !== '__nueva__' && (validacion.data.paginaClave !== 'contrataciones' || grupo === 'Finalizadas' || grupo === 'Vigentes' || /^\d{4}$/.test(grupo) || grupo === 'Encabezado')) {
      const ultima = await prisma.seccionPagina.aggregate({ where: { paginaClave: validacion.data.paginaClave }, _max: { orden: true } });
      const pliegoUrl = validacion.data.pliegoUrl?.trim();
      const contenido = pliegoUrl ? `${validacion.data.contenido}\nPDF: ${pliegoUrl} | Ver Pliego` : validacion.data.contenido;
      await prisma.seccionPagina.create({ data: { paginaClave: validacion.data.paginaClave, grupo, subgrupo: validacion.data.subgrupo?.trim() || null, titulo: validacion.data.titulo, contenido, orden: (ultima._max.orden ?? 0) + 1 } }).catch(() => undefined);
    }
  }
  res.redirect(303, '/admin/contenidos?guardado=seccion-creada');
}

function detectarFormatoImagen(contenido: Buffer): { extension: string; mimeType: string } | null {
  if (contenido.length >= 3 && contenido[0] === 0xff && contenido[1] === 0xd8 && contenido[2] === 0xff) return { extension: 'jpg', mimeType: 'image/jpeg' };
  if (contenido.length >= 8 && contenido.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: 'png', mimeType: 'image/png' };
  if (contenido.length >= 12 && contenido.subarray(0, 4).toString('ascii') === 'RIFF' && contenido.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: 'webp', mimeType: 'image/webp' };
  return null;
}

export async function subirImagenActividad(req: Request, res: Response): Promise<void> {
  const archivo = (req as RequestConImagen).archivoImagen;
  if (!archivo) {
    res.status(400).json({ error: 'Seleccioná una imagen para subir.' });
    return;
  }

  const formato = detectarFormatoImagen(archivo.contenido);
  if (!formato) {
    res.status(415).json({ error: 'Solo se admiten imágenes JPG, PNG o WebP.' });
    return;
  }

  const directorio = path.join(process.cwd(), 'public', 'uploads', 'actividades');
  const nombreSeguro = `actividad-${randomUUID()}.${formato.extension}`;
  try {
    await mkdir(directorio, { recursive: true });
    await writeFile(path.join(directorio, nombreSeguro), archivo.contenido, { flag: 'wx' });
    await prisma.eventoAuditoria.create({
      data: {
        usuarioId: req.session.usuarioAdministrativo?.id,
        tipo: 'MODIFICACION_CONTENIDO',
        entidad: 'ImagenActividad',
        entidadId: nombreSeguro,
        detalles: JSON.stringify({ accion: 'SUBIR_IMAGEN', formato: formato.mimeType, bytes: archivo.contenido.length }),
      },
    }).catch(() => undefined);
    res.status(201).json({ url: `/uploads/actividades/${nombreSeguro}` });
  } catch {
    res.status(500).json({ error: 'No se pudo guardar la imagen.' });
  }
}

export async function subirPliego(req: Request, res: Response): Promise<void> {
  const archivo = (req as RequestConImagen).archivoImagen;
  if (!archivo) {
    res.status(400).json({ error: 'Seleccioná un archivo PDF para subir.' });
    return;
  }
  const esPdf = archivo.contenido.length >= 5 && archivo.contenido.subarray(0, 5).toString('ascii') === '%PDF-';
  if (!esPdf || (archivo.mimeType && archivo.mimeType !== 'application/pdf')) {
    res.status(415).json({ error: 'Solo se admiten archivos PDF válidos.' });
    return;
  }
  const directorio = path.join(process.cwd(), 'public', 'uploads', 'pliegos');
  const nombreSeguro = `pliego-${randomUUID()}.pdf`;
  try {
    await mkdir(directorio, { recursive: true });
    await writeFile(path.join(directorio, nombreSeguro), archivo.contenido, { flag: 'wx' });
    await prisma.eventoAuditoria.create({
      data: {
        usuarioId: req.session.usuarioAdministrativo?.id,
        tipo: 'MODIFICACION_CONTENIDO',
        entidad: 'PliegoCompra',
        entidadId: nombreSeguro,
        detalles: JSON.stringify({ accion: 'SUBIR_PLIEGO', bytes: archivo.contenido.length }),
      },
    }).catch(() => undefined);
    res.status(201).json({ url: `/uploads/pliegos/${nombreSeguro}` });
  } catch {
    res.status(500).json({ error: 'No se pudo guardar el pliego.' });
  }
}












