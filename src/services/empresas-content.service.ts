import { SeccionPagina } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../database/prisma';

export const camposPresentacionEmpresas = z.object({
  antetitulo: z.string().trim().min(1).max(160),
  encabezado: z.string().trim().min(1).max(160),
  descripcion: z.string().trim().min(1).max(2000),
});
export const camposContactoEmpresas = z.object({
  instrucciones: z.string().trim().min(1).max(2000),
  boton: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  asunto: z.string().trim().min(1).max(160).refine(valor => !/[\r\n]/.test(valor)),
});

function leerDatos<T>(contenido: string, esquema: z.ZodType<T>): T {
  return esquema.parse(JSON.parse(contenido));
}

export function prepararEmpresas(secciones: SeccionPagina[]) {
  const presentacion = secciones.find(fila => fila.grupo === 'Presentación');
  const contacto = secciones.find(fila => fila.grupo === 'Contacto');
  if (!presentacion || !contacto) throw new Error('Falta la configuración de Empresas.');
  const datosContacto = leerDatos(contacto.contenido, camposContactoEmpresas);
  return {
    presentacion: { ...presentacion, datos: leerDatos(presentacion.contenido, camposPresentacionEmpresas) },
    contacto: { ...contacto, datos: datosContacto },
    enlaceContacto: `mailto:${datosContacto.email}?subject=${encodeURIComponent(datosContacto.asunto)}`,
    propuestas: secciones.filter(fila => fila.grupo === 'Propuesta'),
  };
}

export async function cargarEmpresas() {
  const secciones = await prisma.$transaction(async tx => {
    const where = { paginaClave: 'empresas' };
    const orderBy = [{ orden: 'asc' }, { creadoEn: 'asc' }, { id: 'asc' }] as const;
    const existentes = await tx.seccionPagina.findMany({ where, orderBy: [...orderBy] });
    // Precargar una sola vez: nunca restaurar títulos editados ni tarjetas ocultas.
    if (existentes.length) return existentes;
    await tx.seccionPagina.createMany({ data: [
      { paginaClave: 'empresas', grupo: 'Presentación', titulo: 'Empresas', orden: 0, contenido: JSON.stringify({
        antetitulo: 'Vínculo Escuela – Empresa',
        encabezado: 'Impulse el talento técnico del futuro en su organización',
        descripcion: 'La ETEC articula con empresas y organizaciones para acercar a sus estudiantes a experiencias reales de trabajo, innovación y desarrollo tecnológico.',
      }) },
      ...[
        ['🧰', 'Pasantías Profesionalizantes'], ['🤝', 'Intercambios Pedagógicos'],
        ['💼', 'Inserción Laboral'], ['⚙️', 'Proyectos Tecnológicos'],
      ].map(([contenido, titulo], indice) => ({ paginaClave: 'empresas', grupo: 'Propuesta', titulo, contenido, orden: (indice + 1) * 10 })),
      { paginaClave: 'empresas', grupo: 'Contacto', titulo: 'Inicie una propuesta', orden: 1000, contenido: JSON.stringify({
        instrucciones: 'Escríbanos indicando el nombre de la empresa, una descripción de la propuesta y sus datos de contacto.',
        boton: 'Contactar a la ETEC', email: 'info@etec.uba.ar', asunto: 'Propuesta de Alianza Empresa - ETEC',
      }) },
    ] });
    return tx.seccionPagina.findMany({ where, orderBy: [...orderBy] });
  });
  return prepararEmpresas(secciones);
}
