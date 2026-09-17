import { Prisma, PrismaClient, EstadoCiclo } from '@prisma/client';
import { prisma } from '../database/prisma';

export function etapaPreinscripcionFinalizada(
  ciclo: { estado: EstadoCiclo; inscripcionesHasta: Date | null },
  ahora: Date
): boolean {
  return ciclo.estado === 'CERRADO' ||
    (ciclo.estado === 'ABIERTO' && ciclo.inscripcionesHasta !== null &&
      ciclo.inscripcionesHasta.getTime() < ahora.getTime());
}

export async function cargarSorteoPublico(
  ahora = new Date(),
  database: Pick<PrismaClient, '$transaction'> = prisma
) {
  return database.$transaction(async (tx: Prisma.TransactionClient) => {
    const ciclo = await tx.cicloIngreso.findFirst({
      where: { estado: { not: 'BORRADOR' } },
      orderBy: { anio: 'desc' },
      select: { id: true, anio: true, estado: true, inscripcionesHasta: true },
    });
    const publicado = Boolean(ciclo && etapaPreinscripcionFinalizada(ciclo, ahora));
    // Consultar únicamente los campos públicos y solo una vez cerrada la etapa.
    const postulantes = publicado && ciclo
      ? await tx.preinscripcion.findMany({
          where: { cicloId: ciclo.id, estado: 'CONFIRMADA', eliminadoEn: null },
          orderBy: { numeroSorteo: 'asc' },
          select: { numeroSorteo: true, nombres: true, apellido: true },
        })
      : [];
    return { cicloLectivo: ciclo?.anio ?? null, publicado, postulantes };
  });
}

