import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { generarTokenCsrf } from '../security/request-protection';
import { camposEvento, fechasDelEvento, periodoEventos, mesesEventos, categoriasEventos, fechaArgentina, horaArgentina } from '../services/eventos-fechas';

async function renderEventos(req: Request, res: Response, formulario?: Record<string, unknown>, error = '', estado = 200) {
  const periodo = periodoEventos(req.query);
  const eventos = await prisma.evento.findMany({ where: {
    fechaInicio: { lt: periodo.hasta },
    OR: [{ fechaFin: { gte: periodo.desde } }, { fechaFin: null, fechaInicio: { gte: periodo.desde } }],
  }, orderBy: [{ fechaInicio: 'asc' }, { titulo: 'asc' }] });
  if (!formulario && typeof req.query.editar === 'string') {
    const evento = await prisma.evento.findUnique({ where: { id: req.query.editar.slice(0, 40) } });
    if (!evento) { res.status(404).send('La actividad no existe. Volvé al calendario del panel.'); return; }
    formulario = { ...evento, fechaInicio: fechaArgentina(evento.fechaInicio), fechaFin: evento.fechaFin ? fechaArgentina(evento.fechaFin) : '', horaInicio: horaArgentina(evento.fechaInicio), horaFin: evento.fechaFin ? horaArgentina(evento.fechaFin) : '', todoElDia: evento.todoElDia ? 'on' : '' };
  }
  res.status(estado).render('admin/eventos', {
    title: 'Administrar eventos - ETEC UBA', page: 'admin-eventos', csrfToken: generarTokenCsrf(req),
    ...periodo, mesesEventos, categoriasEventos, eventos, fechaArgentina, horaArgentina, error,
    guardado: req.query.guardado === 'ok',
    eliminado: req.query.eliminado === 'ok',
    formulario: formulario || { fechaInicio: periodo.inicio, todoElDia: 'on', estado: 'BORRADOR', categoria: 'INSTITUCIONAL' },
  });
}
export async function mostrarAdminEventos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { await renderEventos(req, res); } catch (error) { next(error); }
}

const idEvento = z.string().trim().min(1).max(40);

export async function confirmarEliminacionEvento(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = idEvento.safeParse(req.query.id);
    if (!id.success) { res.status(400).send('La actividad no es válida. Volvé al calendario del panel.'); return; }
    const evento = await prisma.evento.findUnique({ where: { id: id.data } });
    if (!evento) { res.status(404).send('La actividad ya no existe. Volvé al calendario del panel.'); return; }
    res.render('admin/evento-eliminar', {
      title: 'Eliminar actividad - ETEC UBA', page: 'admin-evento-eliminar',
      csrfToken: generarTokenCsrf(req), evento, fechaArgentina, ...periodoEventos(req.query),
    });
  } catch (error) { next(error); }
}

export async function eliminarAdminEvento(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const datos = z.object({ id: idEvento, confirmar: z.literal('on') }).safeParse(req.body);
    if (!datos.success) { res.status(400).send('Confirmá la eliminación desde la pantalla de la actividad.'); return; }
    const usuarioId = req.session.usuarioAdministrativo?.id;
    if (!usuarioId) { res.sendStatus(401); return; }
    const eliminado = await prisma.$transaction(async tx => {
      const resultado = await tx.evento.deleteMany({ where: { id: datos.data.id } });
      if (!resultado.count) return false;
      await tx.eventoAuditoria.create({ data: {
        usuarioId, tipo: 'ELIMINACION_EVENTO', entidad: 'Evento', entidadId: datos.data.id,
      } });
      return true;
    });
    if (!eliminado) { res.status(404).send('La actividad ya no existe. Volvé al calendario del panel.'); return; }
    const { anio, mes } = periodoEventos(req.query);
    res.redirect(303, `/admin/eventos?anio=${anio}&mes=${mes}&eliminado=ok`);
  } catch (error) { next(error); }
}
export async function guardarAdminEvento(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validacion = camposEvento.safeParse(req.body);
    if (!validacion.success) {
      const mensajes = [...new Set(validacion.error.issues.map(item => `${item.path.join('.')}: ${item.message}`))].join(' ');
      await renderEventos(req, res, req.body, `Revisá los datos. ${mensajes}`, 400);
      return;
    }
    const usuarioId = req.session.usuarioAdministrativo?.id;
    if (!usuarioId) { res.sendStatus(401); return; }
    const datos = validacion.data;
    const guardado = await prisma.$transaction(async tx => {
      if (datos.id && !await tx.evento.findUnique({ where: { id: datos.id } })) return false;
      const data = { titulo: datos.titulo, descripcion: datos.descripcion, ubicacion: datos.ubicacion || null, categoria: datos.categoria, estado: datos.estado, todoElDia: datos.todoElDia === 'on', ...fechasDelEvento(datos) };
      const evento = datos.id
        ? await tx.evento.update({ where: { id: datos.id }, data: { ...data, actualizadoPorId: usuarioId } })
        : await tx.evento.create({ data: { ...data, creadoPorId: usuarioId } });
      await tx.eventoAuditoria.create({ data: { usuarioId, tipo: datos.id ? 'MODIFICACION_EVENTO' : 'CREACION_EVENTO', entidad: 'Evento', entidadId: evento.id } });
      return true;
    });
    if (!guardado) { res.status(404).send('La actividad ya no existe. Volvé al calendario del panel.'); return; }
    res.redirect(303, `/admin/eventos?anio=${datos.fechaInicio.slice(0, 4)}&mes=${Number(datos.fechaInicio.slice(5, 7))}&guardado=ok`);
  } catch (error) { next(error); }
}
