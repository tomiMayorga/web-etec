import { z } from 'zod';

export function leerPostulacionBeca(contenido: string) {
  const lineas = contenido.split(/\r?\n/);
  const esBoton = (linea: string) => /^https?:\/\/\S+\s*(?:\|.*)?$/i.test(linea.trim());
  const enlace = lineas.find(esBoton)?.trim().split('|') ?? [];
  return {
    instrucciones: lineas.filter((linea) => !esBoton(linea)).join('\n').trim(),
    botonUrl: enlace[0]?.trim() ?? '',
    botonTexto: enlace.slice(1).join('|').trim() || 'Ir a Trámites a Distancia (TAD)',
  };
}

export const camposPostulacionBeca = z.object({
  contenido: z.string().trim().max(2000),
  botonTexto: z.string().trim().min(1).max(160).regex(/^[^|\r\n]+$/),
  botonUrl: z.string().trim().max(500).url().refine((valor) => {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password && !/[|\s]/.test(valor);
  }),
});

export function guardarPostulacionBeca(datos: z.infer<typeof camposPostulacionBeca>) {
  return `${leerPostulacionBeca(datos.contenido).instrucciones}\n${datos.botonUrl} | ${datos.botonTexto}`.trim();
}
