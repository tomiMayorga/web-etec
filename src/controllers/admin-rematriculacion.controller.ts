import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { generarTokenCsrf } from '../security/request-protection';
import { crearHuellaIp } from '../security/personal-data';

const mensajePorDefecto =
  'Aquellos estudiantes que no presentaron apto físico ninguna vez durante el año. No podrán realizar Educación Física el año siguiente.';

function valorFecha(valor: unknown): Date | null | undefined {
  if (typeof valor !== 'string') return undefined;
  if (!valor.trim()) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

export async function mostrarAdministracionRematriculacion(req: Request, res: Response): Promise<void> {
  const configuracion = await prisma.configuracionRematriculacion.upsert({
    where: { id: 1 },
    create: { id: 1, mensajeAptoFisico: mensajePorDefecto },
    update: {},
  });

  res.render('admin/rematriculacion', {
    title: 'Administrar rematriculación - ETEC UBA',
    page: 'admin-rematriculacion',
    configuracion,
    guardado: typeof req.query.guardado === 'string' ? req.query.guardado : null,
    csrfToken: generarTokenCsrf(req),
  });
}

export async function actualizarAdministracionRematriculacion(req: Request, res: Response): Promise<void> {
  const inicio = valorFecha(req.body.fechaInicio);
  const fin = valorFecha(req.body.fechaFin);
  const validacion = z.object({
    cicloLectivo: z.coerce.number().int().min(2020).max(2100),
    mensajeAptoFisico: z.string().trim().min(10).max(600),
  }).safeParse(req.body);

  if (!validacion.success || inicio === undefined || fin === undefined || (inicio && fin && inicio > fin)) {
    res.redirect(303, '/admin/rematriculacion?guardado=error');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.configuracionRematriculacion.upsert({
        where: { id: 1 },
        create: { id: 1, activo: req.body.activo === 'on', cicloLectivo: validacion.data.cicloLectivo, fechaInicio: inicio, fechaFin: fin, mensajeAptoFisico: validacion.data.mensajeAptoFisico },
        update: { activo: req.body.activo === 'on', cicloLectivo: validacion.data.cicloLectivo, fechaInicio: inicio, fechaFin: fin, mensajeAptoFisico: validacion.data.mensajeAptoFisico },
      });
      await tx.eventoAuditoria.create({
        data: {
          usuarioId: req.session.usuarioAdministrativo?.id,
          tipo: 'MODIFICACION_REMATRICULACION',
          entidad: 'ConfiguracionRematriculacion',
          entidadId: '1',
          detalles: JSON.stringify({ accion: 'ACTUALIZAR_REMATRICULACION' }),
          ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
        },
      });
    });
    res.redirect(303, '/admin/rematriculacion?guardado=ok');
  } catch {
    res.redirect(303, '/admin/rematriculacion?guardado=error');
  }
}
