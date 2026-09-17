import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import {
  cifrarDatoPersonal,
  crearHuellaDni,
  normalizarDni,
} from '../security/personal-data';
import {
  DatosPreinscripcion,
  preinscripcionSchema,
} from '../validation/preinscripcion';

export class PreinscripcionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'CICLO_CERRADO'
      | 'DNI_DUPLICADO'
      | 'DATOS_INVALIDOS'
  ) {
    super(message);
    this.name = 'PreinscripcionError';
  }
}

function responsableTieneDatos(
  responsable: DatosPreinscripcion['responsable2']
): responsable is NonNullable<DatosPreinscripcion['responsable2']> {
  if (!responsable) return false;

  return Object.values(responsable).some(
    (value) => typeof value === 'string' && value.trim() !== ''
  );
}

export async function crearPreinscripcion(
  entrada: unknown
): Promise<{
  id: string;
  numeroSorteo: number;
  cicloLectivo: number;
}> {
  const validacion = preinscripcionSchema.safeParse(entrada);

  if (!validacion.success) {
    throw new PreinscripcionError(
      'Los datos enviados no son válidos.',
      'DATOS_INVALIDOS'
    );
  }

  const datos = validacion.data;
  const ahora = new Date();
  const dniNormalizado = normalizarDni(datos.aspirante.dni);
  const dniHuella = crearHuellaDni(dniNormalizado);

  try {
    return await prisma.$transaction(async (tx) => {
      const ciclo = await tx.cicloIngreso.findFirst({
        where: {
          estado: 'ABIERTO',
          AND: [
            {
              OR: [
                { inscripcionesDesde: null },
                { inscripcionesDesde: { lte: ahora } },
              ],
            },
            {
              OR: [
                { inscripcionesHasta: null },
                { inscripcionesHasta: { gte: ahora } },
              ],
            },
          ],
        },
        orderBy: {
          anio: 'desc',
        },
      });

      if (!ciclo) {
        throw new PreinscripcionError(
          'La preinscripción no se encuentra habilitada.',
          'CICLO_CERRADO'
        );
      }

      const duplicada = await tx.preinscripcion.findUnique({
        where: {
          cicloId_dniHuella: {
            cicloId: ciclo.id,
            dniHuella,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicada) {
        throw new PreinscripcionError(
          'Ya existe una preinscripción para este DNI en el ciclo actual.',
          'DNI_DUPLICADO'
        );
      }

      /*
       * El incremento se realiza dentro de la transacción.
       * El valor anterior es el número asignado al aspirante.
       */
      const cicloActualizado = await tx.cicloIngreso.update({
        where: {
          id: ciclo.id,
        },
        data: {
          proximoNumero: {
            increment: 1,
          },
        },
        select: {
          anio: true,
          proximoNumero: true,
        },
      });

      const numeroSorteo = cicloActualizado.proximoNumero - 1;

      const responsables: Prisma.ResponsableCreateWithoutPreinscripcionInput[] =
        [
          {
            orden: 1,
            nombres: datos.responsable1.nombres,
            apellido: datos.responsable1.apellido,
            vinculo: datos.responsable1.vinculo,
            dniCifrado: datos.responsable1.dni
              ? cifrarDatoPersonal(
                  normalizarDni(datos.responsable1.dni)
                )
              : null,
            telefono: datos.responsable1.telefono,
            email: datos.responsable1.email || null,
          },
        ];

      if (
        responsableTieneDatos(datos.responsable2) &&
        datos.responsable2.nombres &&
        datos.responsable2.apellido &&
        datos.responsable2.vinculo &&
        datos.responsable2.telefono
      ) {
        responsables.push({
          orden: 2,
          nombres: datos.responsable2.nombres,
          apellido: datos.responsable2.apellido,
          vinculo: datos.responsable2.vinculo,
          dniCifrado: datos.responsable2.dni
            ? cifrarDatoPersonal(
                normalizarDni(datos.responsable2.dni)
              )
            : null,
          telefono: datos.responsable2.telefono,
          email: datos.responsable2.email || null,
        });
      }

      const preinscripcion = await tx.preinscripcion.create({
        data: {
          cicloId: ciclo.id,
          numeroSorteo,
          nombres: datos.aspirante.nombres,
          apellido: datos.aspirante.apellido,
          dniCifrado: cifrarDatoPersonal(dniNormalizado),
          dniHuella,
          fechaNacimiento: datos.aspirante.fechaNacimiento,
          escuelaOrigen: datos.aspirante.escuelaOrigen || null,
          emailContacto: datos.contacto.email,
          telefonoContacto: datos.contacto.telefono,
          versionAvisoPrivacidad:
            process.env.PRIVACY_NOTICE_VERSION || 'sin-version',
          consentimientoAceptadoEn: ahora,

          responsables: {
            create: responsables,
          },

          emails: {
            create: {
              destinatario: datos.contacto.email,
              plantilla: 'CONFIRMACION_PREINSCRIPCION',
              estado: 'PENDIENTE',
            },
          },
        },
        select: {
          id: true,
          numeroSorteo: true,
        },
      });

      return {
        id: preinscripcion.id,
        numeroSorteo: preinscripcion.numeroSorteo,
        cicloLectivo: cicloActualizado.anio,
      };
    });
  } catch (error) {
    if (error instanceof PreinscripcionError) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new PreinscripcionError(
        'Ya existe una preinscripción para este DNI o número.',
        'DNI_DUPLICADO'
      );
    }

    // No registramos el objeto error porque podría contener datos personales.
    console.error('No fue posible completar una preinscripción.');

    throw error;
  }
}