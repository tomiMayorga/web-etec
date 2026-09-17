import 'dotenv/config';
import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient({ log: ['warn', 'error'] });

const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const definiciones = [
  { clave: 'REMATRICULACION', titulo: 'Rematriculación', respuesta: 'Encontré la sección para renovar la matrícula de estudiantes actuales.', tipoDestino: 'PAGINA_INTERNA', rutaInterna: '/rematriculacion', orden: 1, frases: ['rematriculación', 'rematricular', 'renovar matrícula', 'matrícula alumno actual'] },
  { clave: 'PREINSCRIPCION', titulo: 'Preinscripción al curso de ingreso', respuesta: 'Podés iniciar la preinscripción al curso de ingreso desde nuestro formulario.', tipoDestino: 'PAGINA_INTERNA', rutaInterna: '/formulario-de-inscripcion', orden: 2, frases: ['preinscripción', 'pre inscripción', 'quiero ingresar', 'anotar a mi hijo', 'curso de ingreso', 'inscribir aspirante'] },
  { clave: 'EVENTOS', titulo: 'Eventos', respuesta: 'Podés consultar todas las actividades publicadas en el calendario anual.', tipoDestino: 'PAGINA_INTERNA', rutaInterna: '/eventos', orden: 3, frases: ['eventos', 'calendario de eventos', 'actividades', 'agenda'] },
  { clave: 'SORTEO', titulo: 'Sorteo', respuesta: 'La información disponible sobre el sorteo se encuentra en esta sección.', tipoDestino: 'PAGINA_INTERNA', rutaInterna: '/sorteo', orden: 4, frases: ['sorteo', 'bolillero', 'bolillas', 'número de sorteo', 'vacantes sorteo'] },
  { clave: 'RECURSOS_HUMANOS', titulo: 'Recursos Humanos', respuesta: 'Te comunico con el área de Recursos Humanos.', tipoDestino: 'WHATSAPP', areaSlug: 'recursos-humanos', orden: 5, frases: ['recursos humanos', 'trabajar en la escuela', 'empleo', 'personal', 'rrhh'] },
  { clave: 'SECRETARIA_ALUMNOS', titulo: 'Secretaría de Alumnos', respuesta: 'Te comunico con la Secretaría de Alumnos.', tipoDestino: 'WHATSAPP', areaSlug: 'secretaria-alumnos', orden: 6, frases: ['secretaría de alumnos', 'secretaria alumnos', 'hablar con secretaría', 'consulta de alumno', 'trámite alumno'] },
];

try {
  await prisma.configuracionChatbot.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      activo: true,
      modoPrueba: true,
      mensajeBienvenida: 'Hola, soy el asistente de ETEC UBA. ¿En qué podemos ayudarte?',
      mensajeNoEntendido: 'No pude identificar la consulta. Elegí una de estas opciones para continuar.',
    },
  });

  const areas = {};
  for (const area of [
    { nombre: 'Recursos Humanos', slug: 'recursos-humanos', orden: 1, mensajeInicial: 'Hola, quisiera comunicarme con Recursos Humanos.' },
    { nombre: 'Secretaría de Alumnos', slug: 'secretaria-alumnos', orden: 2, mensajeInicial: 'Hola, quisiera comunicarme con la Secretaría de Alumnos.' },
  ]) {
    areas[area.slug] = await prisma.areaContacto.upsert({
      where: { slug: area.slug },
      update: { nombre: area.nombre, orden: area.orden, mensajeInicial: area.mensajeInicial },
      create: { ...area, telefonoWhatsapp: null, activo: true },
    });
  }

  for (const definicion of definiciones) {
    const { frases, areaSlug, ...datos } = definicion;
    const intencion = await prisma.intencionChatbot.upsert({
      where: { clave: definicion.clave },
      update: {
        ...datos,
        areaContactoId: areaSlug ? areas[areaSlug].id : null,
      },
      create: {
        ...datos,
        areaContactoId: areaSlug ? areas[areaSlug].id : null,
        activo: true,
      },
    });

    await prisma.fraseChatbot.deleteMany({ where: { intencionId: intencion.id } });
    await prisma.fraseChatbot.createMany({
      data: frases.map((texto) => ({ intencionId: intencion.id, texto, textoNormalizado: normalizar(texto) })),
    });
  }

  console.log('Chatbot configurado correctamente en modo de prueba.');
} catch {
  console.error('No se pudo configurar el chatbot.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
