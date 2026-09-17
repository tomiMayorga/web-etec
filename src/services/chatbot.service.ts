import { prisma } from '../database/prisma';

const palabrasIgnoradas = new Set([
  'a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los',
  'me', 'mi', 'para', 'por', 'que', 'quiero', 'un', 'una', 'y',
]);

export function normalizarConsulta(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function obtenerPalabras(texto: string): Set<string> {
  return new Set(
    normalizarConsulta(texto)
      .split(' ')
      .filter((palabra) => palabra.length > 1 && !palabrasIgnoradas.has(palabra))
  );
}

function calcularPuntaje(consulta: string, frase: string): number {
  if (consulta === frase) return 1000 + frase.length;
  if (consulta.includes(frase)) return 500 + frase.length;

  const consultaPalabras = obtenerPalabras(consulta);
  const frasePalabras = obtenerPalabras(frase);
  let coincidencias = 0;

  for (const palabra of frasePalabras) {
    if (consultaPalabras.has(palabra)) coincidencias += 1;
  }

  return coincidencias === 0 ? 0 : coincidencias / frasePalabras.size;
}

export async function obtenerConfiguracionPublicaChatbot() {
  const [configuracion, opciones] = await Promise.all([
    prisma.configuracionChatbot.findUnique({ where: { id: 1 } }),
    prisma.intencionChatbot.findMany({
      where: {
        activo: true,
        OR: [
          { tipoDestino: 'PAGINA_INTERNA' },
          { tipoDestino: 'WHATSAPP', areaContacto: { is: { activo: true } } },
        ],
      },
      orderBy: [{ orden: 'asc' }, { titulo: 'asc' }],
      select: { clave: true, titulo: true },
    }),
  ]);

  return {
    activo: configuracion?.activo ?? false,
    mensajeBienvenida: configuracion?.mensajeBienvenida ?? '',
    opciones,
  };
}

export async function responderConsultaChatbot(mensaje: string) {
  const configuracion = await prisma.configuracionChatbot.findUnique({
    where: { id: 1 },
  });

  if (!configuracion?.activo) return null;

  const consulta = normalizarConsulta(mensaje);
  const intenciones = await prisma.intencionChatbot.findMany({
    where: {
      activo: true,
      OR: [
        { tipoDestino: 'PAGINA_INTERNA' },
        { tipoDestino: 'WHATSAPP', areaContacto: { is: { activo: true } } },
      ],
    },
    include: { frases: true, areaContacto: true },
    orderBy: [{ orden: 'asc' }, { titulo: 'asc' }],
  });

  const resultados = intenciones.map((intencion) => ({
    intencion,
    puntaje: Math.max(
      calcularPuntaje(consulta, normalizarConsulta(intencion.titulo)),
      ...intencion.frases.map((frase) =>
        calcularPuntaje(consulta, frase.textoNormalizado)
      )
    ),
  }));

  resultados.sort((a, b) => b.puntaje - a.puntaje);
  const mejor = resultados[0];

  if (!mejor || mejor.puntaje < 0.5) {
    return {
      respuesta: configuracion.mensajeNoEntendido,
      accion: null,
      opciones: intenciones.map(({ clave, titulo }) => ({ clave, titulo })),
    };
  }

  const { intencion } = mejor;

  if (intencion.tipoDestino === 'PAGINA_INTERNA' && intencion.rutaInterna) {
    return {
      respuesta: intencion.respuesta,
      accion: { tipo: 'PAGINA_INTERNA' as const, url: intencion.rutaInterna },
      opciones: [],
    };
  }

  const area = intencion.areaContacto;
  const telefonoValido = area?.telefonoWhatsapp?.match(/^\d{8,15}$/);

  if (configuracion.modoPrueba || !telefonoValido) {
    return {
      respuesta: `${intencion.respuesta} Simulación: se abriría el WhatsApp de ${area?.nombre ?? 'esta área'}.`,
      accion: { tipo: 'SIMULACION' as const, etiqueta: area?.nombre ?? intencion.titulo },
      opciones: [],
    };
  }

  const textoWhatsapp = encodeURIComponent(area?.mensajeInicial ?? 'Hola, quisiera realizar una consulta.');
  return {
    respuesta: intencion.respuesta,
    accion: {
      tipo: 'WHATSAPP' as const,
      url: `https://wa.me/${area?.telefonoWhatsapp}?text=${textoWhatsapp}`,
    },
    opciones: [],
  };
}
