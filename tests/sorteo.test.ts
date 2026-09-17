import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarSorteoPublico, etapaPreinscripcionFinalizada } from '../src/services/sorteo.service';

const ahora = new Date('2026-09-15T23:00:00Z');

test('publicación: cierre manual, fecha vencida y frontera exacta', () => {
  assert.equal(etapaPreinscripcionFinalizada({ estado: 'CERRADO', inscripcionesHasta: null }, ahora), true);
  assert.equal(etapaPreinscripcionFinalizada({ estado: 'ABIERTO', inscripcionesHasta: new Date(ahora.getTime() - 1) }, ahora), true);
  for (const estado of ['BORRADOR', 'ARCHIVADO'] as const) {
    assert.equal(etapaPreinscripcionFinalizada({ estado, inscripcionesHasta: new Date(0) }, ahora), false);
  }
  for (const inscripcionesHasta of [null, ahora, new Date(ahora.getTime() + 1)]) {
    assert.equal(etapaPreinscripcionFinalizada({ estado: 'ABIERTO', inscripcionesHasta }, ahora), false);
  }
});

test('no consulta nombres durante la inscripción, sin ciclo o al archivar', async () => {
  for (const ciclo of [null, { id: 4, anio: 2027, estado: 'ABIERTO', inscripcionesHasta: ahora }, { id: 4, anio: 2027, estado: 'ARCHIVADO', inscripcionesHasta: new Date(0) }]) {
    const database = {
      $transaction: async (fn: (tx: unknown) => unknown) => fn({
        cicloIngreso: { findFirst: async () => ciclo },
        preinscripcion: { findMany: () => { throw new Error('No consultar datos personales'); } },
      }),
    } as unknown as NonNullable<Parameters<typeof cargarSorteoPublico>[1]>;
    const resultado = await cargarSorteoPublico(ahora, database);
    assert.equal(resultado.publicado, false);
    assert.deepEqual(resultado.postulantes, []);
  }
});

test('consulta solo confirmadas del ciclo actual, sin datos privados ni límite de mil', async () => {
  const filas = Array.from({ length: 1250 }, (_, i) => ({ numeroSorteo: i * 2 + 1, nombres: 'Nombre de prueba', apellido: 'Apellido de prueba' }));
  const database = {
    $transaction: async (fn: (tx: unknown) => unknown) => fn({
      cicloIngreso: { findFirst: async (args: unknown) => {
        assert.deepEqual(args, { where: { estado: { not: 'BORRADOR' } }, orderBy: { anio: 'desc' }, select: { id: true, anio: true, estado: true, inscripcionesHasta: true } });
        return { id: 4, anio: 2027, estado: 'CERRADO', inscripcionesHasta: null };
      } },
      preinscripcion: { findMany: async (args: unknown) => {
        assert.deepEqual(args, { where: { cicloId: 4, estado: 'CONFIRMADA', eliminadoEn: null }, orderBy: { numeroSorteo: 'asc' }, select: { numeroSorteo: true, nombres: true, apellido: true } });
        return filas;
      } },
    }),
  } as unknown as NonNullable<Parameters<typeof cargarSorteoPublico>[1]>;
  const resultado = await cargarSorteoPublico(ahora, database);
  assert.equal(resultado.publicado, true);
  assert.equal(resultado.cicloLectivo, 2027);
  assert.deepEqual(resultado.postulantes, filas);
});
