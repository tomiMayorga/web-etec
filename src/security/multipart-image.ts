import { NextFunction, Request, Response } from 'express';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export interface ArchivoImagenRecibido {
  nombreOriginal: string;
  mimeType: string;
  contenido: Buffer;
}

export interface RequestConImagen extends Request {
  archivoImagen?: ArchivoImagenRecibido;
}

function extraerParametroCabecera(valor: string, nombre: string): string | undefined {
  return valor.match(new RegExp(`${nombre}="([^"]*)"`, 'i'))?.[1];
}

function encontrarMarcador(buffer: Buffer, marcador: Buffer, desde = 0): number {
  return buffer.indexOf(marcador, desde);
}

export function recibirImagen(req: Request, res: Response, next: NextFunction): void {
  const contentType = String(req.headers['content-type'] ?? '');
  const coincidenciaBoundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = coincidenciaBoundary?.[1] ?? coincidenciaBoundary?.[2]?.trim();

  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundary) {
    res.status(400).json({ error: 'El formulario de carga no es válido.' });
    return;
  }

  const partes: Buffer[] = [];
  let cantidadBytes = 0;
  let finalizado = false;

  const rechazarPorTamano = () => {
    if (finalizado) return;
    finalizado = true;
    res.status(413).json({ error: 'La imagen supera el tamaño máximo permitido de 8 MB.' });
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
      res.status(400).json({ error: 'No se pudo leer la imagen.' });
    }
  });

  req.on('end', () => {
    if (finalizado) return;
    finalizado = true;

    const cuerpo = Buffer.concat(partes);
    const separador = Buffer.from(`--${boundary}`);
    const campos: Record<string, string> = {};
    let archivoImagen: ArchivoImagenRecibido | undefined;
    let cursor = 0;

    while (cursor < cuerpo.length) {
      const inicio = encontrarMarcador(cuerpo, separador, cursor);
      if (inicio < 0) break;
      const inicioParte = inicio + separador.length;
      if (cuerpo.slice(inicioParte, inicioParte + 2).toString() === '--') break;

      const siguiente = encontrarMarcador(cuerpo, separador, inicioParte);
      if (siguiente < 0) break;
      const parte = cuerpo.slice(inicioParte, siguiente).toString('binary').replace(/^\r?\n/, '').replace(/\r?\n$/, '');
      const parteBuffer = Buffer.from(parte, 'binary');
      const separadorCabecera = parteBuffer.indexOf(Buffer.from('\r\n\r\n'));
      if (separadorCabecera < 0) {
        cursor = siguiente;
        continue;
      }

      const cabeceras = parteBuffer.slice(0, separadorCabecera).toString('utf8');
      const contenido = parteBuffer.slice(separadorCabecera + 4);
      const disposicion = cabeceras.match(/Content-Disposition:\s*([^\r\n]+)/i)?.[1] ?? '';
      const nombreCampo = extraerParametroCabecera(disposicion, 'name');
      if (!nombreCampo) {
        cursor = siguiente;
        continue;
      }

      const nombreArchivo = extraerParametroCabecera(disposicion, 'filename');
      if (nombreArchivo !== undefined) {
        if (nombreCampo === 'archivo' && contenido.length > 0) {
          archivoImagen = {
            nombreOriginal: nombreArchivo.slice(0, 180),
            mimeType: cabeceras.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase() ?? '',
            contenido,
          };
        }
      } else {
        campos[nombreCampo] = contenido.toString('utf8').slice(0, 500);
      }
      cursor = siguiente;
    }

    req.body = campos;
    (req as RequestConImagen).archivoImagen = archivoImagen;
    next();
  });
}
