import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analizarCsvIngresantes, ErrorCsvIngresantes } from '../src/services/ingresantes.service';
import { readFileSync } from 'node:fs';
import ejs from 'ejs';

test('importa ingresantes desde CSV y ordena por número', () => {
  const listado = analizarCsvIngresantes('\uFEFFNúmero;Apellido;Nombre\n12;Pérez;Ana\n2;Gómez;Luis', 'lista-2026.csv', 2026);
  assert.deepEqual(listado.filas, [{ numero: 2, apellido: 'Gómez', nombre: 'Luis' }, { numero: 12, apellido: 'Pérez', nombre: 'Ana' }]);
  assert.equal(listado.cicloLectivo, 2026);
});

test('rechaza columnas o filas inseguras del CSV de ingresantes', () => {
  const casos = [
    ['Número,Apellido', 'Falta Nombre'],
    ['Número,Apellido,Nombre\n1,Pérez,Ana\n1,Gómez,Luis', 'número repetido'],
    ['Número,Apellido,Nombre\n0,Pérez,Ana', 'número inválido'],
    ['Número,Apellido,Nombre\n1,,Ana', 'apellido vacío'],
    ['Número,Apellido,Nombre,DNI\n1,Pérez,Ana,123', 'DNI no permitido'],
  ];
  for (const [csv, esperado] of casos) assert.throws(() => analizarCsvIngresantes(csv, 'lista.csv', 2026), ErrorCsvIngresantes, esperado);
});

test('la vista de ingresantes escapa nombres y muestra la tabla cargada', () => {
  const source = readFileSync('views/ingresantes.ejs', 'utf8').replace(/<%- include\([^\n]+%>/g, '');
  const html = ejs.render(source, { ingresantes: [{ numero: 1, apellido: '<script>alert(1)</script>', nombre: 'Ana' }], cicloLectivoIngresantes: 2026 });
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)/);
});
