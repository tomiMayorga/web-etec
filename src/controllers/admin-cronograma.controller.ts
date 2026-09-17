import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { claveCronograma } from '../services/cronograma-ingreso.service';

const campos = z.object({
  id: z.string().min(1).max(40).optional(),
  grupo: z.enum(['Cabecera', 'Normal', 'Alerta', 'Evaluación']),
  titulo: z.string().trim().min(1).max(160),
  contenido: z.string().trim().min(1).max(2000),
  orden: z.coerce.number().int().min(0).max(9999),
  activo: z.enum(['on']).optional(),
});

export async function guardarCronogramaIngreso(req: Request, res: Response, next: NextFunction): Promise<void> {
  const resultado = campos.safeParse(req.body);
  if (!resultado.success) { res.status(400).send('Revisá la fecha, actividad, formato y posición (0 a 9999). Volvé atrás para corregirlos.'); return; }
  try {
    const { id, ...datos } = resultado.data;
    const actualizado = await prisma.$transaction(async (tx) => {
      const actual = id ? await tx.seccionPagina.findFirst({ where: { id, paginaClave: claveCronograma } }) : null;
      if (id && !actual) return false;
      if ((!actual && datos.grupo === 'Cabecera') || (actual && (actual.grupo === 'Cabecera') !== (datos.grupo === 'Cabecera'))) return false;
      const data = { ...datos, activo: datos.grupo === 'Cabecera' || datos.activo === 'on' };
      const fila = id
        ? await tx.seccionPagina.update({ where: { id }, data })
        : await tx.seccionPagina.create({ data: { ...data, paginaClave: claveCronograma } });
      await tx.eventoAuditoria.create({ data: { usuarioId: req.session.usuarioAdministrativo?.id, tipo: 'MODIFICACION_CONTENIDO', entidad: 'SeccionPagina', entidadId: fila.id, detalles: JSON.stringify({ accion: id ? 'ACTUALIZAR_CRONOGRAMA' : 'CREAR_FECHA_CRONOGRAMA', pagina: claveCronograma }) } });
      return true;
    });
    if (!actualizado) { res.status(400).send('La fila del cronograma no es válida. Volvé al panel para actualizarla.'); return; }
    res.redirect(303, '/admin/contenidos?guardado=seccion&editor=cronograma');
  } catch (error) { next(error); }
}
