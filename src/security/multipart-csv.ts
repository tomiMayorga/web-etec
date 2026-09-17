import { NextFunction, Request, Response } from 'express';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export interface ArchivoCsvRecibido {
  nombreOriginal: string;
  contenido: string;
}

export interface RequestConCsv extends Request {
  archivoCsv?: ArchivoCsvRecibido;
}

function extraerParametroCabecera(valor: string, nombre: string): string | undefined {
  const coincidencia = valor.match(new RegExp(`${nombre}="([^"]*)"`, 'i'));
  return coincidencia?.[1];
}

export function recibirCsv(req: Request, res: Response, next: NextFunction): void {
  const contentType = String(req.headers['content-type'] ?? '');
  const coincidenciaBoundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = coincidenciaBoundary?.[1] ?? coincidenciaBoundary?.[2]?.trim();

  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundary) {
    res.status(400).send('El formulario de carga no es válido.');
    return;
  }

  const partes: Buffer[] = [];
  let cantidadBytes = 0;
  let finalizado = false;

  const rechazarPorTamano = () => {
    if (finalizado) return;
    finalizado = true;
    res.status(413).send('El archivo supera el tamaño máximo permitido de 2 MB.');
    req.resume();
  };

  req.on('data', (fragmento: Buffer | string) => {
    const buffer = Buffer.isBuffer(fragmento) ? fragmento : Buffer.from(fragmento);
    cantidadBytes += buffer.length;
    if (cantidadBytes > MAX_UPLOAD_BYTES) {
      rechazarPorTamano();
      return;
    }
    partes.push(buffer);
  });

  req.on('error', () => {
    if (!finalizado) {
      finalizado = true;
      res.status(400).send('No se pudo leer el archivo.');
    }
  });

  req.on('end', () => {
    if (finalizado) return;
    finalizado = true;

    const cuerpo = Buffer.concat(partes).toString('utf8');
    const separador = `--${boundary}`;
    const campos: Record<string, string> = {};
    let archivoCsv: ArchivoCsvRecibido | undefined;

    for (const parteOriginal of cuerpo.split(separador)) {
      const parte = parteOriginal.replace(/^\r?\n/, '').replace(/\r?\n--$/, '');
      const separadorCabecera = parte.indexOf('\r\n\r\n');
      if (separadorCabecera < 0) continue;

      const cabeceras = parte.slice(0, separadorCabecera);
      let contenido = parte.slice(separadorCabecera + 4).replace(/\r\n$/, '');
      const disposicion = cabeceras.match(/Content-Disposition:\s*([^\r\n]+)/i)?.[1] ?? '';
      const nombreCampo = extraerParametroCabecera(disposicion, 'name');
      if (!nombreCampo) continue;

      const nombreArchivo = extraerParametroCabecera(disposicion, 'filename');
      if (nombreArchivo !== undefined) {
        if (nombreCampo !== 'archivo') continue;
        archivoCsv = { nombreOriginal: nombreArchivo.slice(0, 180), contenido };
        continue;
      }

      campos[nombreCampo] = contenido.slice(0, 500);
    }

    req.body = campos;
    (req as RequestConCsv).archivoCsv = archivoCsv;
    next();
  });
}
