import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { camposContactoEmpresas, camposPresentacionEmpresas } from '../services/empresas-content.service';

const base = { id: z.string().min(1).max(40).optional(), titulo: z.string().trim().min(1).max(160), activo: z.literal('on').optional() };
const campos = z.discriminatedUnion('grupo', [
  z.object({ ...base, grupo: z.literal('Presentación'), ...camposPresentacionEmpresas.shape }),
  z.object({ ...base, grupo: z.literal('Contacto'), ...camposContactoEmpresas.shape }),
  z.object({ ...base, grupo: z.literal('Propuesta'), icono: z.string().trim().min(1).max(16), orden: z.coerce.number().int().min(0).max(9999) }),
]);

export async function guardarEmpresas(req: Request, res: Response, next: NextFunction): Promise<void> {
  const resultado = campos.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).send('Revisá los campos de Empresas: completá los textos, usá un correo válido y una posición entre 0 y 9999. Volvé atrás para corregirlos.');
    return;
  }
  try {
    const datos = resultado.data;
    const guardado = await prisma.$transaction(async tx => {
      const actual = datos.id ? await tx.seccionPagina.findFirst({ where: { id: datos.id, paginaClave: 'empresas' } }) : null;
      if (datos.id ? !actual || actual.grupo !== datos.grupo : datos.grupo !== 'Propuesta') return false;
      const contenido = datos.grupo === 'Propuesta' ? datos.icono : JSON.stringify(
        datos.grupo === 'Presentación' ? camposPresentacionEmpresas.parse(datos) : camposContactoEmpresas.parse(datos),
      );
      const data = { titulo: datos.titulo, contenido, activo: datos.grupo === 'Presentación' || datos.activo === 'on', orden: datos.grupo === 'Propuesta' ? datos.orden : actual!.orden };
      const fila = datos.id
        ? await tx.seccionPagina.update({ where: { id: datos.id }, data })
        : await tx.seccionPagina.create({ data: { ...data, paginaClave: 'empresas', grupo: 'Propuesta' } });
      await tx.eventoAuditoria.create({ data: {
        usuarioId: req.session.usuarioAdministrativo?.id, tipo: 'MODIFICACION_CONTENIDO', entidad: 'SeccionPagina', entidadId: fila.id,
        detalles: JSON.stringify({ accion: datos.id ? 'ACTUALIZAR_EMPRESAS' : 'CREAR_PROPUESTA_EMPRESAS', pagina: 'empresas' }),
      } });
      return true;
    });
    if (!guardado) { res.status(400).send('La sección de Empresas no es válida. Volvé a abrirla desde el panel.'); return; }
    res.redirect(303, '/admin/contenidos?guardado=seccion&editor=empresas');
  } catch (error) { next(error); }
}
