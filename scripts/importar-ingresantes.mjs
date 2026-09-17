import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , sourceArgument] = process.argv;
if (!sourceArgument) {
  console.error('Uso: npm run import:ingresantes -- <archivo-html>');
  process.exit(1);
}

const sourcePath = path.resolve(sourceArgument);
const destinationPath = path.resolve('src/data/ingresantes.json');
const temporaryPath = `${destinationPath}.tmp`;

const sourceStat = await stat(sourcePath);
if (sourceStat.size > 2_000_000) throw new Error('El archivo de origen supera 2 MB.');

const html = await readFile(sourcePath, 'utf8');
const rowPattern = /<tr>\s*<td>(\d+)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gis;
const stripMarkup = (value) => value.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
const records = [...html.matchAll(rowPattern)].map((match) => ({
  numero: Number.parseInt(match[1], 10),
  apellido: stripMarkup(match[2]),
  nombre: stripMarkup(match[3]),
}));

if (records.length === 0 || records.length > 1_000) throw new Error('No se encontró un listado válido.');
if (records.some((record) => !Number.isInteger(record.numero) || record.numero < 1 || !record.apellido || !record.nombre || record.apellido.length > 120 || record.nombre.length > 120)) {
  throw new Error('El listado contiene registros inválidos.');
}
if (new Set(records.map(({ numero }) => numero)).size !== records.length) throw new Error('El listado contiene números duplicados.');

await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
await rename(temporaryPath, destinationPath);
console.log(`Se importaron ${records.length} postulantes en ${destinationPath}.`);
