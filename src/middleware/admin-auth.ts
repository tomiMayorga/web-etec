import { Request, RequestHandler, Response } from 'express';
import { RolUsuario } from '@prisma/client';

export const exigirAutenticacion: RequestHandler = (
  req,
  res,
  next
) => {
  if (!req.session.usuarioAdministrativo) {
    res.redirect(303, '/admin/login');
    return;
  }

  next();
};

export function exigirRol(
  ...rolesPermitidos: RolUsuario[]
): RequestHandler {
  return (req: Request, res: Response, next) => {
    const usuario = req.session.usuarioAdministrativo;

    if (!usuario) {
      res.redirect(303, '/admin/login');
      return;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      res.status(403).render('error', {
        title: 'Acceso denegado - ETEC UBA',
        page: 'acceso-denegado',
        message:
          'No tenés permisos para acceder a esta sección.',
      });

      return;
    }

    next();
  };
}