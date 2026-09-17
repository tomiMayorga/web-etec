import { SeccionPagina } from '@prisma/client';
import { prisma } from '../database/prisma';

const MAX_FILAS = 2000;
const MAX_COLUMNAS = 12;
const MAX_CARACTERES = 160;

export interface Ingresante {
  numero: number;
  apellido: string;
  nombre: string;
}

export interface ListadoIngresantes {
  cicloLectivo: number;
  nombreArchivo: string;
  filas: Ingresante[];
}

export class ErrorCsvIngresantes extends Error {}

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function separar(linea: string, delimitador: string): string[] {
  const valores: string[] = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];
    if (caracter === '"') {
      if (comillas && linea[i + 1] === '"') { actual += '"'; i += 1; }
      else comillas = !comillas;
    } else if (caracter === delimitador && !comillas) { valores.push(actual.trim()); actual = ''; }
    else actual += caracter;
  }
  if (comillas) throw new ErrorCsvIngresantes('El CSV tiene comillas sin cerrar.');
  valores.push(actual.trim());
  return valores;
}

function delimitadorDe(linea: string): string {
  return [',', ';', '\t'].sort((a, b) => separar(linea, b).length - separar(linea, a).length)[0];
}

function indice(encabezados: string[], alias: string[]): number {
  return encabezados.findIndex((encabezado) => alias.includes(encabezado));
}

export function analizarCsvIngresantes(contenidoOriginal: string, nombreArchivo: string, cicloLectivo: number): ListadoIngresantes {
  if (!Number.isInteger(cicloLectivo) || cicloLectivo < 2020 || cicloLectivo > 2100) throw new ErrorCsvIngresantes('El ciclo lectivo debe estar entre 2020 y 2100.');
  const contenido = contenidoOriginal.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lineas = contenido.split('\n').filter((linea) => linea.trim());
  if (lineas.length < 2) throw new ErrorCsvIngresantes('El CSV debe incluir encabezados y al menos una fila.');
  if (lineas.length > MAX_FILAS + 1) throw new ErrorCsvIngresantes(`El CSV no puede superar las ${MAX_FILAS} filas.`);
  const encabezadosOriginales = separar(lineas[0], delimitadorDe(lineas[0])).map((valor) => valor.slice(0, MAX_CARACTERES));
  if (!encabezadosOriginales.length || encabezadosOriginales.length > MAX_COLUMNAS || encabezadosOriginales.some((valor) => !valor)) throw new ErrorCsvIngresantes('Los encabezados del CSV no son válidos.');
  const encabezados = encabezadosOriginales.map(normalizar);
  if (new Set(encabezados).size !== encabezados.length) throw new ErrorCsvIngresantes('El CSV tiene encabezados repetidos.');
  if (encabezados.some((encabezado) => /(^|_)(dni|documento|email|correo|telefono|tel|celular|domicilio|direccion)(_|$)/.test(encabezado))) throw new ErrorCsvIngresantes('El CSV no puede incluir DNI, correos, teléfonos ni domicilios.');
  const numero = indice(encabezados, ['numero', 'n', 'nro', 'numero_sorteo', 'posicion', 'orden']);
  const apellido = indice(encabezados, ['apellido', 'apellidos', 'surname']);
  const nombre = indice(encabezados, ['nombre', 'nombres', 'name']);
  if (numero < 0 || apellido < 0 || nombre < 0) throw new ErrorCsvIngresantes('El CSV debe incluir las columnas Número, Apellido y Nombre.');
  const filas: Ingresante[] = [];
  const separador = delimitadorDe(lineas[0]);
  const numeros = new Set<number>();
  for (let i = 1; i < lineas.length; i += 1) {
    const valores = separar(lineas[i], separador);
    if (valores.length > MAX_COLUMNAS || valores.some((valor) => valor.length > MAX_CARACTERES)) throw new ErrorCsvIngresantes(`La fila ${i} es demasiado extensa.`);
    const valorNumero = Number.parseInt(valores[numero]?.replace(/[^0-9]/g, '') || '', 10);
    const valorApellido = valores[apellido]?.trim() || '';
    const valorNombre = valores[nombre]?.trim() || '';
    if (!Number.isInteger(valorNumero) || valorNumero < 1 || valorNumero > 999999) throw new ErrorCsvIngresantes(`La fila ${i} tiene un número inválido.`);
    if (!valorApellido || !valorNombre) throw new ErrorCsvIngresantes(`La fila ${i} debe tener apellido y nombre.`);
    if (numeros.has(valorNumero)) throw new ErrorCsvIngresantes(`El número ${valorNumero} aparece más de una vez.`);
    numeros.add(valorNumero);
    filas.push({ numero: valorNumero, apellido: valorApellido, nombre: valorNombre });
  }
  filas.sort((a, b) => a.numero - b.numero);
  return { cicloLectivo, nombreArchivo: nombreArchivo.replace(/[\\/\r\n]/g, '_').slice(0, 180) || 'ingresantes.csv', filas };
}

export async function cargarListadoIngresantes(): Promise<ListadoIngresantes | null> {
  const seccion = await prisma.seccionPagina.findFirst({ where: { paginaClave: 'ingresantes', grupo: 'Listado', activo: true }, orderBy: { actualizadoEn: 'desc' } });
  if (!seccion) return null;
  try {
    const datos = JSON.parse(seccion.contenido) as ListadoIngresantes;
    if (!Number.isInteger(datos.cicloLectivo) || !Array.isArray(datos.filas)) return null;
    return { cicloLectivo: datos.cicloLectivo, nombreArchivo: String(datos.nombreArchivo || 'ingresantes.csv'), filas: datos.filas.filter((fila) => Number.isInteger(fila.numero) && typeof fila.apellido === 'string' && typeof fila.nombre === 'string') };
  } catch { return null; }
}

export async function cargarConfiguracionIngresantes(): Promise<(ListadoIngresantes & { id: string }) | null> {
  const seccion = await prisma.seccionPagina.findFirst({ where: { paginaClave: 'ingresantes', grupo: 'Listado' }, orderBy: { actualizadoEn: 'desc' } });
  if (!seccion) return null;
  try {
    const datos = JSON.parse(seccion.contenido) as ListadoIngresantes;
    return { id: seccion.id, cicloLectivo: datos.cicloLectivo, nombreArchivo: datos.nombreArchivo, filas: datos.filas };
  } catch { return null; }
}

export async function guardarListadoIngresantes(listado: ListadoIngresantes, usuarioId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const contenido = JSON.stringify(listado);
    const existente = await tx.seccionPagina.findFirst({ where: { paginaClave: 'ingresantes', grupo: 'Listado' }, orderBy: { actualizadoEn: 'desc' } });
    const seccion = existente
      ? await tx.seccionPagina.update({ where: { id: existente.id }, data: { titulo: `Ingresantes ${listado.cicloLectivo}`, contenido, activo: true } })
      : await tx.seccionPagina.create({ data: { paginaClave: 'ingresantes', grupo: 'Listado', titulo: `Ingresantes ${listado.cicloLectivo}`, contenido, orden: 0, activo: true } });
    await tx.eventoAuditoria.create({ data: { usuarioId, tipo: 'MODIFICACION_CONTENIDO', entidad: 'SeccionPagina', entidadId: seccion.id, detalles: JSON.stringify({ accion: 'IMPORTAR_CSV_INGRESANTES', cicloLectivo: listado.cicloLectivo, cantidad: listado.filas.length }) } });
  });
}
