import { z } from 'zod';

export const enlaceTramiteSchema = z.object({
  textoTramite: z.string().trim().max(1200),
  urlTramite: z.string().trim().max(500).refine(valor => {
    if (/^\/uploads\/[a-zA-Z0-9_./-]+\.pdf$/.test(valor) && !valor.includes('..')) return true;
    try { const url = new URL(valor); return url.protocol === 'https:' && !url.username && !url.password; }
    catch { return false; }
  }),
});

export function leerEnlaceTramite(contenido: string): { textoTramite: string; urlTramite: string } {
  try {
    const resultado = enlaceTramiteSchema.safeParse(JSON.parse(contenido));
    if (resultado.success) return resultado.data;
  } catch { /* Contenido inválido: no generar enlaces. */ }
  return { textoTramite: contenido, urlTramite: '' };
}

