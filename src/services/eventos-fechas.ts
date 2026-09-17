import { z } from 'zod';

export const mesesEventos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const categoriasEventos = { INSTITUCIONAL: 'Institucional', ACADEMICO: 'Académico', CURSO_INGRESO: 'Curso de ingreso', COMUNIDAD: 'Comunidad', EXTRACURRICULAR: 'Extracurricular' };
export function fechaArgentina(fecha: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}
export function horaArgentina(fecha: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(fecha);
}
export function periodoEventos(query: { anio?: unknown; mes?: unknown }) {
  const hoy = fechaArgentina(new Date());
  const anio = typeof query.anio === 'string' && /^(20\d\d|2100)$/.test(query.anio) && Number(query.anio) >= 2020 ? Number(query.anio) : Number(hoy.slice(0, 4));
  const mes = typeof query.mes === 'string' && /^(0?[1-9]|1[0-2])$/.test(query.mes) ? Number(query.mes) : Number(hoy.slice(5, 7));
  const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const siguiente = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
  return { anio, mes, inicio, desde: new Date(`${inicio}T00:00:00-03:00`), hasta: new Date(`${siguiente}T00:00:00-03:00`) };
}
const fechaValida = z.string().regex(/^20\d\d-\d{2}-\d{2}$|^2100-\d{2}-\d{2}$/).refine(valor => {
  const fecha = new Date(`${valor}T12:00:00-03:00`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor && Number(valor.slice(0, 4)) >= 2020;
}, 'Usá una fecha válida entre 2020 y 2100.');
const horaValida = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const camposEvento = z.object({
  id: z.string().max(40).optional(),
  titulo: z.string().trim().min(1).max(160), descripcion: z.string().trim().min(1).max(4000),
  ubicacion: z.string().trim().max(200),
  categoria: z.enum(['INSTITUCIONAL', 'ACADEMICO', 'CURSO_INGRESO', 'COMUNIDAD', 'EXTRACURRICULAR']),
  estado: z.enum(['BORRADOR', 'PUBLICADO', 'CANCELADO']),
  fechaInicio: fechaValida, fechaFin: z.union([fechaValida, z.literal('')]).optional(),
  horaInicio: z.union([horaValida, z.literal('')]).optional(), horaFin: z.union([horaValida, z.literal('')]).optional(),
  todoElDia: z.literal('on').optional(),
}).superRefine((datos, ctx) => {
  if (!datos.todoElDia && !datos.horaInicio) ctx.addIssue({ code: 'custom', path: ['horaInicio'], message: 'Indicá la hora de inicio o marcá Todo el día.' });
  if (!datos.todoElDia && datos.fechaFin && !datos.horaFin) ctx.addIssue({ code: 'custom', path: ['horaFin'], message: 'Indicá la hora de finalización.' });
  const fechas = fechasDelEvento(datos);
  if (fechas.fechaFin && fechas.fechaFin < fechas.fechaInicio) ctx.addIssue({ code: 'custom', path: ['fechaFin'], message: 'La finalización no puede ser anterior al inicio.' });
});
export function fechasDelEvento(datos: { fechaInicio: string; fechaFin?: string; horaInicio?: string; horaFin?: string; todoElDia?: string }) {
  return {
    fechaInicio: new Date(`${datos.fechaInicio}T${datos.todoElDia ? '00:00' : datos.horaInicio || '00:00'}:00-03:00`),
    fechaFin: datos.todoElDia ? new Date(`${datos.fechaFin || datos.fechaInicio}T23:59:59.999-03:00`)
      : datos.fechaFin || datos.horaFin ? new Date(`${datos.fechaFin || datos.fechaInicio}T${datos.horaFin || '00:00'}:00-03:00`) : null,
  };
}
