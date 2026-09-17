import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import argon2 from 'argon2';
import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient({ log: ['warn', 'error'] });

const opcionesArgon2 = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

function leerPassword(mensaje) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('La contraseña debe ingresarse desde una terminal interactiva.');
  }

  return new Promise((resolve, reject) => {
    let password = '';
    const estadoRawAnterior = stdin.isRaw;

    stdout.write(mensaje);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const limpiar = () => {
      stdin.off('data', recibir);
      stdin.setRawMode(Boolean(estadoRawAnterior));
      stdin.pause();
    };

    const recibir = (tecla) => {
      if (tecla === '\u0003') {
        limpiar();
        stdout.write('\n');
        reject(new Error('Operación cancelada.'));
        return;
      }

      if (tecla === '\r' || tecla === '\n') {
        limpiar();
        stdout.write('\n');
        resolve(password);
        return;
      }

      if (tecla === '\u007f' || tecla === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      if (/^[\x20-\x7E]$/.test(tecla)) {
        password += tecla;
        stdout.write('*');
      }
    };

    stdin.on('data', recibir);
  });
}

const emailValido = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

async function main() {
  const existente = await prisma.usuarioAdministrativo.findFirst({
    where: { rol: 'SUPER_ADMIN' },
    select: { id: true },
  });

  if (existente) {
    throw new Error(
      'Ya existe un SuperAdmin. Los próximos usuarios deben crearse desde el panel.'
    );
  }

  const interfaz = createInterface({ input: stdin, output: stdout });
  const nombreMostrado = (await interfaz.question('Nombre visible: ')).trim();
  const nombreUsuario = (await interfaz.question('Nombre de usuario: ')).trim().toLowerCase();
  const email = (await interfaz.question('Correo electrónico: ')).trim().toLowerCase();
  interfaz.close();

  if (nombreMostrado.length < 2 || nombreMostrado.length > 100) {
    throw new Error('El nombre visible debe tener entre 2 y 100 caracteres.');
  }

  if (!/^[a-z0-9._-]{3,40}$/.test(nombreUsuario)) {
    throw new Error(
      'El nombre de usuario debe tener entre 3 y 40 caracteres y usar letras, números, punto, guion o guion bajo.'
    );
  }

  if (!emailValido(email)) {
    throw new Error('El correo electrónico no es válido.');
  }

  const password = await leerPassword('Contraseña (mínimo 12 caracteres): ');
  const confirmacion = await leerPassword('Repetí la contraseña: ');

  if (password.length < 12 || password.length > 128) {
    throw new Error('La contraseña debe tener entre 12 y 128 caracteres.');
  }

  if (password !== confirmacion) {
    throw new Error('Las contraseñas no coinciden.');
  }

  const passwordHash = await argon2.hash(password, opcionesArgon2);

  const usuario = await prisma.usuarioAdministrativo.create({
    data: {
      email,
      nombreUsuario,
      nombreMostrado,
      passwordHash,
      rol: 'SUPER_ADMIN',
    },
    select: {
      id: true,
      email: true,
      nombreMostrado: true,
      rol: true,
    },
  });

  await prisma.eventoAuditoria.create({
    data: {
      usuarioId: usuario.id,
      tipo: 'CREACION_USUARIO',
      entidad: 'UsuarioAdministrativo',
      entidadId: usuario.id,
      detalles: JSON.stringify({ accion: 'BOOTSTRAP_SUPER_ADMIN' }),
    },
  });

  stdout.write(`SuperAdmin creado correctamente para ${usuario.email}.\n`);
}

try {
  await main();
} catch (error) {
  const mensaje = error instanceof Error ? error.message : 'Error desconocido.';
  console.error(`No se pudo crear el SuperAdmin: ${mensaje}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
