import 'dotenv/config';
import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const cicloLectivo = 2027;

const inscripcionesDesde = new Date(
  '2026-09-03T00:00:00-03:00'
);

const inscripcionesHasta = new Date(
  '2026-09-15T23:59:59.999-03:00'
);

if (process.env.NODE_ENV === 'production') {
  console.error(
    'Este script solo puede utilizarse en desarrollo local.'
  );
  process.exitCode = 1;
} else {
  try {
    const ciclo = await prisma.cicloIngreso.update({
      where: {
        anio: cicloLectivo,
      },
      data: {
        estado: 'ABIERTO',
        inscripcionesDesde,
        inscripcionesHasta,
      },
      select: {
        anio: true,
        estado: true,
        inscripcionesDesde: true,
        inscripcionesHasta: true,
      },
    });

    console.log({
      ciclo: ciclo.anio,
      estado: ciclo.estado,
      apertura: ciclo.inscripcionesDesde,
      cierre: ciclo.inscripcionesHasta,
    });
  } catch {
    console.error(
      `No se encontró el ciclo ${cicloLectivo}. Crealo antes de configurar las fechas.`
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}