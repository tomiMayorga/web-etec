import { Request, Response } from 'express';
import { RequestConCsv } from '../security/multipart-csv';
import { analizarCsvOrdenMerito, ErrorCsvOrdenMerito, importarOrdenMerito } from '../services/orden-merito.service';

export async function mostrarOrdenMerito(_req: Request, res: Response): Promise<void> {
  res.redirect(303, '/admin/contenidos?editor=merito#orden-merito-editor');
}

export async function importarOrdenMeritoCsv(req: Request, res: Response): Promise<void> {
  const archivo = (req as RequestConCsv).archivoCsv;
  const ciclo = Number.parseInt(typeof req.body?.cicloLectivo === 'string' ? req.body.cicloLectivo : '', 10);
  if (!archivo || !Number.isInteger(ciclo) || ciclo < 2020 || ciclo > 2100) {
    res.redirect(303, '/admin/contenidos?editor=merito&errorMerito=Indicá un ciclo lectivo y seleccioná un archivo CSV.#orden-merito-editor');
    return;
  }

  try {
    if (!/\.csv$/i.test(archivo.nombreOriginal)) throw new ErrorCsvOrdenMerito('Solo se admite un archivo con extensión .csv.');
    const importado = analizarCsvOrdenMerito(archivo.contenido, archivo.nombreOriginal, ciclo);
    await importarOrdenMerito(importado, req.session.usuarioAdministrativo?.id ?? '');
    res.redirect(303, '/admin/contenidos?editor=merito&meritoGuardado=ok#orden-merito-editor');
  } catch (error) {
    const mensaje = error instanceof ErrorCsvOrdenMerito ? error.message : 'No se pudo importar el CSV.';
    res.redirect(303, `/admin/contenidos?editor=merito&errorMerito=${encodeURIComponent(mensaje)}#orden-merito-editor`);
  }
}
