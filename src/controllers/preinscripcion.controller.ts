import { NextFunction, Request, Response } from 'express';
import {
  crearPreinscripcion,
  PreinscripcionError,
} from '../services/preinscripcion.service';
import { generarTokenCsrf } from '../security/request-protection';
import { preinscripcionSchema } from '../validation/preinscripcion';

export function mostrarFormulario(
  req: Request,
  res: Response
): void {
  res.render('preinscripcion/formulario', {
    title: 'Preinscripción - ETEC UBA',
    page: 'formulario-de-inscripcion',
       csrfToken: generarTokenCsrf(req),
    errores: {},
    valores: {},
  });
}

export async function procesarFormulario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const validacion = preinscripcionSchema.safeParse(req.body);

  if (!validacion.success) {
    res.status(422).render('preinscripcion/formulario', {
      title: 'Preinscripción - ETEC UBA',
      page: 'formulario-de-inscripcion',
      csrfToken: generarTokenCsrf(req),
      errores: validacion.error.flatten(),
      valores: req.body,
    });

    return;
  }

  try {
    const resultado = await crearPreinscripcion(validacion.data);

    req.session.confirmacionPreinscripcion = {
      numeroSorteo: resultado.numeroSorteo,
      cicloLectivo: resultado.cicloLectivo,
    };

    /*
     * Esperamos que la sesión quede guardada antes de redireccionar.
     * Esto evita perder la confirmación si la respuesta es muy rápida.
     */
    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    res.redirect(303, '/formulario-de-inscripcion/confirmacion');
  } catch (error) {
    if (error instanceof PreinscripcionError) {
      const estadoHttp =
        error.code === 'DNI_DUPLICADO'
          ? 409
          : error.code === 'CICLO_CERRADO'
            ? 403
            : 422;

      res.status(estadoHttp).render('preinscripcion/formulario', {
        title: 'Preinscripción - ETEC UBA',
        page: 'formulario-de-inscripcion',
        csrfToken: generarTokenCsrf(req),
        errores: {
          formErrors: [error.message],
          fieldErrors: {},
        },
        valores: req.body,
      });

      return;
    }

    /*
     * Enviamos un error nuevo y genérico para evitar que datos internos
     * o personales lleguen al manejador global y a los logs.
     */
    next(
      new Error(
        'No fue posible completar la preinscripción.'
      )
    );
  }
}

export function mostrarConfirmacion(
  req: Request,
  res: Response
): void {
  const confirmacion = req.session.confirmacionPreinscripcion;

  if (!confirmacion) {
    res.redirect('/formulario-de-inscripcion');
    return;
  }

  delete req.session.confirmacionPreinscripcion;

  res.render('preinscripcion/confirmacion', {
    title: 'Preinscripción confirmada - ETEC UBA',
    page: 'formulario-de-inscripcion',
    numeroSorteo: confirmacion.numeroSorteo,
    cicloLectivo: confirmacion.cicloLectivo,
  });
}