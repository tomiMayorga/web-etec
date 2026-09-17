import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const paginaOficial = "https://etec.uba.ar/sorteo/";
const cantidadEsperada = 556;
const tamanoMaximoRespuesta = 5_000_000;
const longitudMaximaNombre = 120;

const rutaScript = dirname(fileURLToPath(import.meta.url));
const rutaProyecto = resolve(rutaScript, "..");
const rutaSalida = resolve(
  rutaProyecto,
  "src",
  "data",
  "postulantes-sorteo.json"
);
const rutaTemporal = `${rutaSalida}.tmp`;

function limpiarHtml(valor) {
  return valor
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, codigo) =>
      String.fromCodePoint(Number(codigo))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, codigo) =>
      String.fromCodePoint(Number.parseInt(codigo, 16))
    )
    .replace(/\s+/g, " ")
    .trim();
}

async function importarPostulantes() {
  console.log("Descargando listado oficial...");

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 15_000);
  let respuesta;

  try {
    respuesta = await fetch(paginaOficial, {
      redirect: "error",
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    throw new Error(
      `No se pudo descargar la página: ${respuesta.status} ${respuesta.statusText}`
    );
  }

  const tipoContenido = respuesta.headers.get("content-type") || "";

  if (!tipoContenido.toLowerCase().includes("text/html")) {
    throw new Error(`Tipo de contenido inesperado: ${tipoContenido}`);
  }

  const longitudDeclarada = Number(
    respuesta.headers.get("content-length") || "0"
  );

  if (longitudDeclarada > tamanoMaximoRespuesta) {
    throw new Error("La respuesta oficial supera el tamaño permitido.");
  }

  const html = await respuesta.text();

  if (Buffer.byteLength(html, "utf8") > tamanoMaximoRespuesta) {
    throw new Error("La respuesta oficial supera el tamaño permitido.");
  }

  const cuerpoTabla = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);

  if (!cuerpoTabla) {
    throw new Error("No se encontró la tabla de postulantes.");
  }

  const filas = [
    ...cuerpoTabla[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi),
  ];

  const postulantes = filas.map((fila, indice) => {
      const celdas = [
        ...fila[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
      ].map((celda) => limpiarHtml(celda[1]));

      const filaEspecialValida =
        celdas.length === 4 && celdas[0] === "53" && celdas[3] === "";

      if (celdas.length !== 3 && !filaEspecialValida) {
        throw new Error(
          `La fila ${indice + 1} tiene una cantidad de columnas inválida.`
        );
      }

      const [numero, apellido, nombre] = celdas;
      const numeroNormalizado = Number(numero);

      if (
        !Number.isInteger(numeroNormalizado) ||
        numeroNormalizado < 1 ||
        numeroNormalizado > 10_000
      ) {
        throw new Error(`Número inválido en la fila ${indice + 1}.`);
      }

      for (const [campo, valor] of [
        ["apellido", apellido],
        ["nombre", nombre],
      ]) {
        if (
          !valor ||
          valor.length > longitudMaximaNombre ||
          /[\u0000-\u001f\u007f]/.test(valor)
        ) {
          throw new Error(`${campo} inválido en la fila ${indice + 1}.`);
        }
      }

      return {
        numero: numeroNormalizado,
        apellido,
        nombre,
      };
    });

  if (postulantes.length !== cantidadEsperada) {
    throw new Error(
      `Se esperaban ${cantidadEsperada} registros, pero se encontraron ${postulantes.length}.`
    );
  }

  const numeros = postulantes.map(({ numero }) => numero);

  if (new Set(numeros).size !== numeros.length) {
    throw new Error("El listado contiene números de postulante duplicados.");
  }

  await mkdir(dirname(rutaSalida), { recursive: true });

  try {
    await writeFile(
      rutaTemporal,
      `${JSON.stringify(postulantes, null, 2)}\n`,
      "utf8"
    );
    await rename(rutaTemporal, rutaSalida);
  } finally {
    await rm(rutaTemporal, { force: true });
  }

  console.log(`Importación terminada: ${postulantes.length} registros.`);
  console.log(`Archivo generado: ${rutaSalida}`);
}

importarPostulantes().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
