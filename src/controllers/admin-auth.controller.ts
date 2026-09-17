import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { autenticarUsuario } from '../services/auth.service';
import { generarTokenCsrf } from '../security/request-protection';

const loginSchema = z.object({
  identificador: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254),

  password: z
    .string()
    .min(1)
    .max(128),
});

function guardarSesion(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function regenerarSesion(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function mostrarLogin(
  req: Request,
  res: Response
): void {
  if (req.session.usuarioAdministrativo) {
    res.redirect(303, '/admin');
    return;
  }

  res.render('admin/login', {
    title: 'Acceso administrativo - ETEC UBA',
    page: 'admin-login',
    csrfToken: generarTokenCsrf(req),
    error: null,
  });
}

export async function procesarLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const validacion = loginSchema.safeParse(req.body);

  if (!validacion.success) {
    res.status(400).render('admin/login', {
      title: 'Acceso administrativo - ETEC UBA',
      page: 'admin-login',
      csrfToken: generarTokenCsrf(req),
      error: 'Los datos de acceso no son válidos.',
    });

    return;
  }

  try {
    const usuario = await autenticarUsuario(
      validacion.data.identificador,
      validacion.data.password,
      req.ip || req.socket.remoteAddress || 'desconocida'
    );

    if (!usuario) {
      res.status(401).render('admin/login', {
        title: 'Acceso administrativo - ETEC UBA',
        page: 'admin-login',
        csrfToken: generarTokenCsrf(req),
        error: 'El correo o la contraseña no son correctos.',
      });

      return;
    }

    /*
     * Regenerar la sesión evita ataques de fijación de sesión.
     */
    await regenerarSesion(req);

    req.session.usuarioAdministrativo = {
      id: usuario.id,
      nombreMostrado: usuario.nombreMostrado,
      rol: usuario.rol,
    };

    await guardarSesion(req);

    res.redirect(303, '/admin');
  } catch {
    /*
     * No enviamos el error original al logger porque la operación
     * contiene credenciales.
     */
    next(
      new Error(
        'No fue posible completar el acceso administrativo.'
      )
    );
  }
}

export async function cerrarSesion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    res.clearCookie('etec.sid');
    res.redirect(303, '/admin/login');
  } catch {
    next(
      new Error(
        'No fue posible cerrar la sesión administrativa.'
      )
    );
  }
}
