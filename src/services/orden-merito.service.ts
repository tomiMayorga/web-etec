import { prisma } from '../database/prisma';

const MAX_FILAS = 2000;
const MAX_COLUMNAS = 30;
const MAX_CARACTERES_CELDA = 500;
const CABECERAS_SENSIBLES = /(^|_)(dni|documento|email|correo|telefono|tel|celular|domicilio|direccion|address)(_|$)/;

export class ErrorCsvOrdenMerito extends Error {}

export interface OrdenMeritoImportado {
  cicloLectivo: number;
  nombreArchivo: string;
  columnas: string[];
  filas: Array<Record<string, string> & { posicion: number }>;
}

function normalizarCabecera(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function separarCsv(linea: string, delimitador: string): string[] {
  const resultado: string[] = [];
  let valor = '';
  let entreComillas = false;

  for (let indice = 0; indice < linea.length; indice += 1) {
    const caracter = linea[indice];
    if (caracter === '"') {
      if (entreComillas && linea[indice + 1] === '"') {
        valor += '"';
        indice += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === delimitador && !entreComillas) {
      resultado.push(valor.trim());
      valor = '';
    } else {
      valor += caracter;
    }
  }

  if (entreComillas) throw new ErrorCsvOrdenMerito('El CSV tiene comillas sin cerrar.');
  resultado.push(valor.trim());
  return resultado;
}

function detectarDelimitador(linea: string): string {
  const candidatos = [',', ';', '\t'];
  return candidatos.sort((a, b) => separarCsv(linea, b).length - separarCsv(linea, a).length)[0];
}

function indiceDeCabecera(cabeceras: string[], alias: string[]): number {
  return cabeceras.findIndex((cabecera) => alias.includes(cabecera));
}

export function analizarCsvOrdenMerito(contenidoOriginal: string, nombreArchivo: string, cicloLectivo: number): OrdenMeritoImportado {
  const contenido = contenidoOriginal.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lineas = contenido.split('\n').filter((linea) => linea.trim().length > 0);
  if (lineas.length < 2) throw new ErrorCsvOrdenMerito('El CSV debe incluir encabezados y al menos una fila.');
  if (lineas.length > MAX_FILAS + 1) throw new ErrorCsvOrdenMerito(`El CSV no puede superar las ${MAX_FILAS} filas.`);

  const delimitador = detectarDelimitador(lineas[0]);
  const encabezadosOriginales = separarCsv(lineas[0], delimitador).map((valor) => valor.slice(0, 80));
  if (encabezadosOriginales.length === 0 || encabezadosOriginales.length > MAX_COLUMNAS || encabezadosOriginales.some((valor) => !valor)) {
    throw new ErrorCsvOrdenMerito('Los encabezados del CSV no son válidos.');
  }

  const encabezados = encabezadosOriginales.map(normalizarCabecera);
  if (new Set(encabezados).size !== encabezados.length) throw new ErrorCsvOrdenMerito('El CSV tiene encabezados repetidos.');
  if (encabezados.some((cabecera) => CABECERAS_SENSIBLES.test(cabecera))) throw new ErrorCsvOrdenMerito('El CSV no puede incluir DNI, correos, teléfonos ni domicilios.');

  const indicePosicion = indiceDeCabecera(encabezados, ['posicion', 'puesto', 'orden', 'lugar', 'numero', 'nro', 'ranking', 'rank']);
  const indiceApellido = indiceDeCabecera(encabezados, ['apellido', 'apellidos', 'surname']);
  const indiceNombre = indiceDeCabecera(encabezados, ['nombre', 'nombres', 'name']);
  const indiceAlumno = indiceDeCabecera(encabezados, ['alumno', 'estudiante', 'aspirante', 'nombre_completo', 'apellido_y_nombre']);

  if (indiceApellido < 0 && indiceNombre < 0 && indiceAlumno < 0) {
    throw new ErrorCsvOrdenMerito('El CSV debe incluir Nombre, Apellido o una columna de alumno/estudiante.');
  }

  const filas: Array<Record<string, string> & { posicion: number }> = [];
  for (let indiceFila = 1; indiceFila < lineas.length; indiceFila += 1) {
    const valores = separarCsv(lineas[indiceFila], delimitador);
    if (valores.length > MAX_COLUMNAS || valores.some((valor) => valor.length > MAX_CARACTERES_CELDA)) throw new ErrorCsvOrdenMerito('El CSV contiene una fila demasiado extensa.');
    const datos: Record<string, string> = {};
    encabezadosOriginales.forEach((cabecera, indiceColumna) => { datos[cabecera] = valores[indiceColumna] ?? ''; });
    const textoPosicion = indicePosicion >= 0 ? valores[indicePosicion] : String(indiceFila);
    const posicion = Number.parseInt(textoPosicion.replace(/[^0-9-]/g, ''), 10);
    if (!Number.isInteger(posicion) || posicion < 1 || posicion > MAX_FILAS) throw new ErrorCsvOrdenMerito(`La fila ${indiceFila} tiene una posición inválida.`);
    if (indiceApellido >= 0 && !valores[indiceApellido]?.trim() && indiceNombre >= 0 && !valores[indiceNombre]?.trim()) throw new ErrorCsvOrdenMerito(`La fila ${indiceFila} no tiene nombre ni apellido.`);
    if (indiceAlumno >= 0 && !valores[indiceAlumno]?.trim() && indiceApellido < 0 && indiceNombre < 0) throw new ErrorCsvOrdenMerito(`La fila ${indiceFila} no tiene estudiante.`);
    filas.push(Object.assign(datos, { posicion }));
  }

  const posiciones = new Set(filas.map((fila) => fila.posicion));
  if (posiciones.size !== filas.length) throw new ErrorCsvOrdenMerito('El CSV tiene posiciones repetidas.');
  filas.sort((a, b) => a.posicion - b.posicion);
  return { cicloLectivo, nombreArchivo: nombreArchivo.replace(/[\\/\r\n]/g, '_').slice(0, 180) || 'orden-de-merito.csv', columnas: encabezadosOriginales, filas };
}

export async function importarOrdenMerito(importado: OrdenMeritoImportado, usuarioId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const nuevaImportacion = await tx.ordenMeritoImportacion.create({
      data: {
        cicloLectivo: importado.cicloLectivo,
        nombreArchivo: importado.nombreArchivo,
        columnasJson: JSON.stringify(importado.columnas),
        creadoPorId: usuarioId,
        registros: {
          create: importado.filas.map((fila) => ({ posicion: fila.posicion, datosJson: JSON.stringify(fila) })),
        },
      },
    });
    await tx.ordenMeritoImportacion.deleteMany({ where: { cicloLectivo: importado.cicloLectivo, id: { not: nuevaImportacion.id } } });
    await tx.eventoAuditoria.create({
      data: {
        usuarioId,
        tipo: 'MODIFICACION_CONTENIDO',
        entidad: 'OrdenMeritoImportacion',
        entidadId: nuevaImportacion.id,
        detalles: JSON.stringify({ accion: 'IMPORTAR_CSV', cicloLectivo: importado.cicloLectivo, cantidad: importado.filas.length }),
      },
    });
  });
}

export async function cargarOrdenMerito(): Promise<OrdenMeritoImportado | null> {
  const importacion = await prisma.ordenMeritoImportacion.findFirst({ orderBy: { creadoEn: 'desc' }, include: { registros: { orderBy: { posicion: 'asc' } } } });
  if (!importacion) return null;
  let columnas: string[];
  try { columnas = JSON.parse(importacion.columnasJson) as string[]; } catch { return null; }
  const filas = importacion.registros.flatMap((registro) => {
    try { return [JSON.parse(registro.datosJson) as Record<string, string> & { posicion: number }]; } catch { return []; }
  });
  return { cicloLectivo: importacion.cicloLectivo, nombreArchivo: importacion.nombreArchivo, columnas, filas };
}
