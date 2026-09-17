import argon2, { HashOptions } from 'argon2';
import { RolUsuario } from '@prisma/client';
import { prisma } from '../database/prisma';
import { crearHuellaIp } from '../security/personal-data';

const MAXIMO_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

const opcionesArgon2: HashOptions & {
    raw: false;
  } = {
  raw: false,
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export interface UsuarioAutenticado {
  id: string;
  nombreMostrado: string;
  rol: RolUsuario;
}

function normalizarIdentificador(identificador: string): string {
  return identificador.trim().toLowerCase();
}

export async function crearHashPassword(
  password: string
): Promise<string> {
  if (password.length < 12 || password.length > 128) {
    throw new Error(
      'La contraseña debe tener entre 12 y 128 caracteres.'
    );
  }

  return argon2.hash(password, opcionesArgon2);
}

async function ejecutarVerificacionSimulada(): Promise<void> {
  /*
   * Evita que la diferencia de tiempo permita determinar
   * si una dirección de correo está registrada.
   */
  await argon2.hash(
    'verificacion-simulada-no-utilizable',
    opcionesArgon2
  );
}

export async function autenticarUsuario(
  identificadorIngresado: string,
  password: string,
  ip: string
): Promise<UsuarioAutenticado | null> {
  const identificador = normalizarIdentificador(identificadorIngresado);
  const esEmail = identificador.includes('@');

  const usuario = esEmail
    ? await prisma.usuarioAdministrativo.findUnique({
        where: { email: identificador },
      })
    : await prisma.usuarioAdministrativo.findFirst({
        where: {
          nombreUsuario: identificador,
          rol: 'SUPER_ADMIN',
        },
      });

  if (!usuario || (esEmail && usuario.rol === 'SUPER_ADMIN')) {
    await ejecutarVerificacionSimulada();
    return null;
  }

  let passwordValida = false;

  try {
    passwordValida = await argon2.verify(
      usuario.passwordHash,
      password
    );
  } catch {
    passwordValida = false;
  }

  const ahora = new Date();

  if (
    !usuario.activo ||
    (usuario.bloqueadoHasta &&
      usuario.bloqueadoHasta > ahora)
  ) {
    return null;
  }

  if (!passwordValida) {
    const nuevosIntentos = usuario.intentosFallidos + 1;
    const bloquear = nuevosIntentos >= MAXIMO_INTENTOS;

    await prisma.usuarioAdministrativo.update({
      where: {
        id: usuario.id,
      },
      data: {
        intentosFallidos: bloquear
          ? 0
          : nuevosIntentos,
        bloqueadoHasta: bloquear
          ? new Date(
              ahora.getTime() +
                MINUTOS_BLOQUEO * 60 * 1000
            )
          : null,
      },
    });

    await prisma.eventoAuditoria.create({
      data: {
        usuarioId: usuario.id,
        tipo: 'INICIO_SESION',
        entidad: 'UsuarioAdministrativo',
        entidadId: usuario.id,
        detalles: JSON.stringify({
          resultado: 'FALLIDO',
        }),
        ipHuella: crearHuellaIp(ip),
      },
    });

    return null;
  }

  await prisma.$transaction([
    prisma.usuarioAdministrativo.update({
      where: {
        id: usuario.id,
      },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoAccesoEn: ahora,
      },
    }),

    prisma.eventoAuditoria.create({
      data: {
        usuarioId: usuario.id,
        tipo: 'INICIO_SESION',
        entidad: 'UsuarioAdministrativo',
        entidadId: usuario.id,
        detalles: JSON.stringify({
          resultado: 'EXITOSO',
        }),
        ipHuella: crearHuellaIp(ip),
      },
    }),
  ]);

  return {
    id: usuario.id,
    nombreMostrado: usuario.nombreMostrado,
    rol: usuario.rol,
  };
}
