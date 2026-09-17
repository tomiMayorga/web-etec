import 'dotenv/config';
import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const anio = Number.parseInt(process.argv[2], 10);

if (process.env.NODE_ENV === 'production') {
  console.error(
    'Este script solo puede utilizarse en desarrollo local.'
  );
  process.exitCode = 1;
} else if (
  !Number.isInteger(anio) ||
  anio < 2026 ||
  anio > 2100
) {
  console.error(
    'Debés indicar un año válido. Ejemplo: node scripts/crear-ciclo-ingreso.mjs 2027'
  );
  process.exitCode = 1;
} else {
  try {
    const existente = await prisma.cicloIngreso.findUnique({
      where: { anio },
    });

    if (existente) {
      console.log(
        `El ciclo ${anio} ya existe y se encuentra en estado ${existente.estado}.`
      );
    } else {
      const ciclo = await prisma.cicloIngreso.create({
        data: {
          anio,
          estado: 'ABIERTO',
          proximoNumero: 1,
        },
      });

      console.log(
        `Ciclo ${ciclo.anio} creado y abierto. El primer número será el 1.`
      );
    }
  } catch {
    console.error('No fue posible crear el ciclo de ingreso.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}