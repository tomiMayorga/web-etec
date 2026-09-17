import { prisma } from '../database/prisma';

export const claveCronograma = 'cronograma-curso-ingreso';
const filasIniciales = [
  ['Normal', '16 de Mayo', 'Comienzo de clases'],
  ['Alerta', '23 de Mayo', 'NO HAY CLASES'],
  ['Alerta', '20 de Junio', 'NO HAY CLASES'],
  ['Evaluación', '27 de Junio', '1era evaluación (TÉCNICA)'],
  ['Evaluación', '4 de Julio', '1era evaluación (MATEMÁTICA)'],
  ['Alerta', '11 de Julio', 'NO HAY CLASES'],
  ['Evaluación', '18 de Julio', '1era evaluación (LENGUA)'],
  ['Alerta', '25-Jul y 1-Ago', 'RECESO ESCOLAR'],
  ['Normal', '8 de Agosto', 'Entrega de boletines\n(puede modificarse fecha)'],
  ['Alerta', '15 de Agosto', 'NO HAY CLASES'],
  ['Alerta', '10 de Octubre', 'NO HAY CLASES'],
  ['Evaluación', '24 de Octubre', '2da evaluación (TÉCNICA)'],
  ['Evaluación', '31 de Octubre', '2da evaluación (MATEMÁTICA)'],
  ['Evaluación', '7 de Noviembre', '2da evaluación (LENGUA)'],
  ['Alerta', '14 de Noviembre', 'RECUPERATORIO'],
  ['Normal', '16 y 17 de Nov.', 'Entrega de boletines'],
  ['Normal', '27 de Noviembre', 'REVISIÓN DE EXÁMENES'],
  ['Evaluación', '30 de Noviembre', 'PUBLICACIÓN DE ORDEN DE MÉRITO'],
  ['Normal', '9 de Diciembre', 'Reunión con ingresantes'],
] as const;

export async function cargarCronogramaIngreso() {
  return prisma.$transaction(async (tx) => {
    const existentes = await tx.seccionPagina.findMany({ where: { paginaClave: claveCronograma }, orderBy: [{ orden: 'asc' }, { creadoEn: 'asc' }, { id: 'asc' }] });
    // Precarga única: editar una fecha o actividad no debe recrear el dato original.
    if (existentes.length) return existentes;
    await tx.seccionPagina.createMany({ data: [
      { paginaClave: claveCronograma, grupo: 'Cabecera', titulo: 'Cronograma de Curso de Ingreso', contenido: 'Calendario Académico Oficial', orden: 0 },
      ...filasIniciales.map(([grupo, titulo, contenido], indice) => ({ paginaClave: claveCronograma, grupo, titulo, contenido, orden: (indice + 1) * 10 })),
    ] });
    return tx.seccionPagina.findMany({ where: { paginaClave: claveCronograma }, orderBy: [{ orden: 'asc' }, { creadoEn: 'asc' }, { id: 'asc' }] });
  });
}
