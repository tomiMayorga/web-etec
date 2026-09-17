import { z } from 'zod';

const nombre = z
  .string()
  .trim()
  .min(2, 'Debe tener al menos 2 caracteres.')
  .max(80, 'No puede superar los 80 caracteres.')
  .regex(
    /^[\p{L}\p{M}' -]+$/u,
    'Solo puede contener letras, espacios, guiones y apóstrofes.'
  );

const dni = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 números.')
  );

const telefono = z
  .string()
  .trim()
  .min(6, 'Ingresá un teléfono válido.')
  .max(30, 'El teléfono es demasiado largo.')
  .regex(/^[0-9()+\-\s]+$/, 'El teléfono contiene caracteres inválidos.');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Ingresá un correo electrónico válido.')
  .max(254);

const responsableSchema = z.object({
  nombres: nombre,
  apellido: nombre,
  vinculo: z.string().trim().min(2).max(40),
  dni: dni.optional().or(z.literal('')),
  telefono,
  email: email.optional().or(z.literal('')),
});

export const preinscripcionSchema = z
  .object({
    aspirante: z.object({
      nombres: nombre,
      apellido: nombre,
      dni,
      fechaNacimiento: z.coerce.date({
        error: 'Ingresá una fecha de nacimiento válida.',
      }),
      escuelaOrigen: z.string().trim().max(150).optional(),
    }),

    responsable1: responsableSchema,

    responsable2: responsableSchema
      .partial()
      .optional(),

    contacto: z.object({
      email,
      confirmarEmail: email,
      telefono,
    }),

    consentimiento: z.literal('aceptado', {
      error: 'Debés aceptar el aviso de privacidad.',
    }),
  })
  .superRefine((data, context) => {
    if (data.contacto.email !== data.contacto.confirmarEmail) {
      context.addIssue({
        code: 'custom',
        path: ['contacto', 'confirmarEmail'],
        message: 'Los correos electrónicos no coinciden.',
      });
    }

    const hoy = new Date();

    if (data.aspirante.fechaNacimiento >= hoy) {
      context.addIssue({
        code: 'custom',
        path: ['aspirante', 'fechaNacimiento'],
        message: 'La fecha de nacimiento debe ser anterior a hoy.',
      });
    }

    const responsable2 = data.responsable2;

    if (responsable2) {
      const tieneAlgunDato = Object.values(responsable2).some(
        (value) => typeof value === 'string' && value.trim() !== ''
      );

      const estaCompleto =
        responsable2.nombres &&
        responsable2.apellido &&
        responsable2.vinculo &&
        responsable2.telefono;

      if (tieneAlgunDato && !estaCompleto) {
        context.addIssue({
          code: 'custom',
          path: ['responsable2'],
          message:
            'Si cargás un segundo responsable, completá sus datos obligatorios.',
        });
      }
    }
  });

export type DatosPreinscripcion = z.infer<
  typeof preinscripcionSchema
>;