import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/server';

let server: Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
    server.once('error', reject);
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('la administración de eventos exige iniciar sesión', async () => {
  for (const ruta of ['/admin/eventos', '/admin/eventos/eliminar']) {
    for (const method of ['GET', 'POST']) {
      const response = await fetch(`${baseUrl}${ruta}`, { method, redirect: 'manual' });
      assert.equal(response.status, 303);
      assert.equal(response.headers.get('location'), '/admin/login');
    }
  }
});

test('la página principal incluye cabeceras de seguridad', async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.match(
    response.headers.get('content-security-policy') || '',
    /default-src 'self'/
  );
  assert.match(
    response.headers.get('content-security-policy') || '',
    /frame-src 'self' https:\/\/maps\.google\.com https:\/\/www\.google\.com https:\/\/etec\.uba\.ar https:\/\/www\.etec\.uba\.ar/
  );
  assert.equal(
    response.headers.get('permissions-policy'),
    'camera=(), geolocation=(), microphone=()'
  );
});

test('las rutas inexistentes responden con un 404 real', async () => {
  const response = await fetch(`${baseUrl}/ruta-que-no-existe`);
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.match(body, /Página no encontrada/);
});

test('los archivos de configuración no se sirven como estáticos', async () => {
  const response = await fetch(`${baseUrl}/.env`, { redirect: 'manual' });

  assert.equal(response.status, 404);
});

test('todas las páginas enlazadas desde el menú responden correctamente', async () => {
  const rutas = [
    '/eventos',
    '/informaciongeneral',
    '/ingresantes',
    '/orden-de-merito',
    '/condiciones-de-postulacion',
    '/uba-verde',
    '/empresas',
    '/uba-en-accion',
    '/actividades-extracurriculares',
    '/servicio-de-odontologia-para-estudiantes',
    '/beca-rector-ricardo-rojas',
  ];

  const respuestas = await Promise.all(
    rutas.map(async (ruta) => ({ ruta, status: (await fetch(`${baseUrl}${ruta}`)).status }))
  );

  assert.deepEqual(
    respuestas.filter(({ status }) => status !== 200),
    []
  );
});
