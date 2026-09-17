import { Request, Response } from 'express';
import { prisma } from '../database/prisma';

function obtenerAnioActualArgentina(): number {
  return Number(
    new Intl.DateTimeFormat('en', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
    }).format(new Date())
  );
}

function obtenerAnioSolicitado(req: Request): number {
  const anioActual = obtenerAnioActualArgentina();
  const valor = Array.isArray(req.query.anio)
    ? req.query.anio[0]
    : req.query.anio;

  if (typeof valor !== 'string') {
    return anioActual;
  }

  const anio = Number.parseInt(valor, 10);

  if (!Number.isInteger(anio) || anio < 2020 || anio > 2100) {
    return anioActual;
  }

  return anio;
}

export async function mostrarCalendarioEventos(
  req: Request,
  res: Response
): Promise<void> {
  const anio = obtenerAnioSolicitado(req);

  /*
   * Argentina utiliza UTC-3. El límite superior corresponde
   * al comienzo del año siguiente y no está incluyente.
   */
  const desde = new Date(
    `${anio}-01-01T00:00:00-03:00`
  );

  const hasta = new Date(
    `${anio + 1}-01-01T00:00:00-03:00`
  );

  try {
    const eventos = await prisma.evento.findMany({
      where: {
        estado: 'PUBLICADO',
        fechaInicio: {
          lt: hasta,
        },
        OR: [
          {
            fechaFin: {
              gte: desde,
            },
          },
          {
            fechaFin: null,
            fechaInicio: {
              gte: desde,
            },
          },
        ],
      },

      orderBy: [
        {
          fechaInicio: 'asc',
        },
        {
          titulo: 'asc',
        },
      ],

      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        todoElDia: true,
        ubicacion: true,
        categoria: true,
      },
    });

    res.render('eventos', {
      title: `Eventos ${anio} - ETEC UBA`,
      page: 'eventos',
      anio,
      anioAnterior: anio - 1,
      anioSiguiente: anio + 1,
      eventos,
    });
  } catch {
    /*
     * No exponemos detalles internos de Prisma o de la base.
     */
    res.status(500).render('error', {
      title: 'Error al cargar eventos - ETEC UBA',
      page: 'server-error',
      message:
        'No fue posible cargar el calendario de eventos.',
    });
  }
}