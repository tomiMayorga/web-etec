import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ejs from 'ejs';
import { camposEvento, fechasDelEvento, fechaArgentina, periodoEventos } from '../src/services/eventos-fechas';

const base = { titulo: 'Actividad', descripcion: 'Descripción', ubicacion: '', categoria: 'ACADEMICO', estado: 'PUBLICADO', fechaInicio: '2026-09-12', todoElDia: 'on' };

test('valida fechas reales, horarios y finalización', () => {
  assert.equal(camposEvento.safeParse(base).success, true);
  for (const cambio of [{ fechaInicio: '2026-02-30' }, { fechaInicio: '2026-13-01' }, { fechaFin: '2026-09-11' }, { todoElDia: undefined }, { todoElDia: undefined, horaInicio: '25:00' }, { todoElDia: undefined, horaInicio: '18:00', horaFin: '17:00' }, { estado: 'OTRO' }]) {
    assert.equal(camposEvento.safeParse({ ...base, ...cambio }).success, false, JSON.stringify(cambio));
  }
  assert.equal(camposEvento.safeParse({ ...base, todoElDia: undefined, horaInicio: '23:00', fechaFin: '2026-09-13', horaFin: '01:00' }).success, true);
  assert.equal(camposEvento.safeParse({ ...base, fechaInicio: '2028-02-29' }).success, true);
});

test('todo el día y límites de mes usan Argentina', () => {
  const datos = fechasDelEvento(base);
  assert.equal(datos.fechaInicio.toISOString(), '2026-09-12T03:00:00.000Z');
  assert.equal(datos.fechaFin?.toISOString(), '2026-09-13T02:59:59.999Z');
  assert.equal(fechaArgentina(datos.fechaFin!), '2026-09-12');
  const diciembre = periodoEventos({ anio: '2026', mes: '12' });
  assert.equal(diciembre.hasta.toISOString(), '2027-01-01T03:00:00.000Z');
});

test('cada fecha agrupa todas sus actividades y escapa el texto', () => {
  const vista = readFileSync('views/eventos.ejs', 'utf8').replace(/<%- include\([^\n]+%>/g, '');
  const eventos = [
    { ...base, id: 'uno', fechaInicio: new Date('2026-09-12T03:00:00Z'), fechaFin: null, todoElDia: true },
    { ...base, id: 'dos', titulo: '<script>Prueba</script>', fechaInicio: new Date('2026-09-12T16:00:00Z'), fechaFin: null, todoElDia: false },
    { ...base, id: 'tres', titulo: 'Varios meses', fechaInicio: new Date('2026-09-30T03:00:00Z'), fechaFin: new Date('2026-10-02T02:59:59Z'), todoElDia: true },
  ];
  const html = ejs.render(vista, { anio: 2026, anioAnterior: 2025, anioSiguiente: 2027, eventos });
  assert.match(html, /12 de Septiembre de 2026: 2 actividades/);
  assert.match(html, /id="agenda-2026-09-30"/);
  assert.match(html, /id="agenda-2026-10-01"/);
  assert.doesNotMatch(html, /id="agenda-2026-10-02"/);
  assert.match(html, /&lt;script&gt;Prueba&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>Prueba/);
  const vacio = ejs.render(vista, { anio: 2026, anioAnterior: 2025, anioSiguiente: 2027, eventos: [] });
  assert.match(vacio, /No hay eventos publicados/);
  assert.doesNotMatch(vacio, /class="calendar-day-trigger"/);
});
