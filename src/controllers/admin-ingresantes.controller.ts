import { Request, Response } from 'express';
import { generarTokenCsrf } from '../security/request-protection';
import { RequestConCsv } from '../security/multipart-csv';
import { analizarCsvIngresantes, cargarConfiguracionIngresantes, ErrorCsvIngresantes, guardarListadoIngresantes } from '../services/ingresantes.service';

export async function mostrarAdminIngresantes(req: Request, res: Response): Promise<void> {
  const listado = await cargarConfiguracionIngresantes().catch(() => null);
  res.render('admin/ingresantes', { title: 'Ingresantes - ETEC UBA', page: 'admin-ingresantes', csrfToken: generarTokenCsrf(req), listado, error: typeof req.query.error === 'string' ? req.query.error : null, guardado: req.query.guardado === 'ok' });
}

export async function importarIngresantesCsv(req: Request, res: Response): Promise<void> {
  const archivo = (req as RequestConCsv).archivoCsv;
  const ciclo = Number.parseInt(typeof req.body?.cicloLectivo === 'string' ? req.body.cicloLectivo : '', 10);
  if (!archivo || !/\.csv$/i.test(archivo.nombreOriginal)) { res.redirect(303, '/admin/ingresantes?error=Seleccioná un archivo con extensión .csv.'); return; }
  try {
    const listado = analizarCsvIngresantes(archivo.contenido, archivo.nombreOriginal, ciclo);
    const usuarioId = req.session.usuarioAdministrativo?.id;
    if (!usuarioId) { res.sendStatus(401); return; }
    await guardarListadoIngresantes(listado, usuarioId);
    res.redirect(303, `/admin/ingresantes?guardado=ok`);
  } catch (error) {
    const mensaje = error instanceof ErrorCsvIngresantes ? error.message : 'No se pudo importar el CSV.';
    res.redirect(303, `/admin/ingresantes?error=${encodeURIComponent(mensaje)}`);
  }
}
