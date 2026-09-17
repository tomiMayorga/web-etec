import { SeccionPagina } from '@prisma/client';
import { prisma } from '../database/prisma';

export interface GrupoAutoridades {
  nombre: string;
  secciones: Awaited<ReturnType<typeof cargarSeccionesAutoridades>>;
  subgrupos: Array<{
    nombre: string;
    secciones: Awaited<ReturnType<typeof cargarSeccionesAutoridades>>;
  }>;
}

const seccionesIniciales = [
  ['Equipo Directivo', 'RECTORÍA', 'Lic. Alejandro Ferrarini Cobas\nVicerrector a cargo'],
  ['Equipo Directivo', 'VICERRECTORA', 'Dra. Luciana M. Alonso'],
  ['Equipo Directivo', 'VICERRECTOR', 'Lic. Pablo B. Ronderos'],
  ['Gestión Académica', 'REGENCIA', 'Prof. Cristian Serrano\nProf. Pablo Daponte\nProf. Diego Cal'],
  ['Gestión Académica', 'SECRETARÍA DE PLANEAMIENTO EDUCATIVO', 'Esp. Carlos A. Ruiz'],
  ['Gestión Académica', 'SECRETARÍA INSTITUCIONAL', 'Prof. María Alonso'],
  ['Gestión Administrativa', 'DIRECTOR GRAL. DE ADMINISTRACIÓN', 'Cont. Alejandro Zalazar Carreño'],
] as const;

const seccionesHistoriaIniciales = [
  ['Línea de tiempo', 'Diciembre 2014 — El Origen', 'Bajo un convenio entre el Ministerio de Educación de la Nación y la UBA, nace el proyecto de crear una escuela secundaria técnica en Villa Lugano, CABA.'],
  ['Línea de tiempo', 'Excelencia Académica', 'Un plan de estudios de élite diseñado por una comisión experta de Ingeniería (FIUBA), Exactas y Naturales (FCEN) y Arquitectura y Diseño (FADU).'],
  ['Línea de tiempo', 'Justicia Educativa', '“Garantizar las mejores condiciones pedagógicas y materiales para los jóvenes, transformando el entorno productivo a través del conocimiento.”'],
  ['Línea de tiempo', '2024 — Una Década Formando el Futuro', 'Consolidamos dos especialidades de alta demanda laboral: Mecatrónica y TIC, orientando vocaciones tempranas hacia las carreras de ingeniería y tecnología.'],
] as const;

const seccionesGenericas: Record<string, readonly (readonly [string, string, string])[]> = {
 'uba-en-accion': [
  [
    "Encabezado",
    "Servicio Odontología para la Comunidad",
    "Facultad de Odontología UBA"
  ],
  [
    "Presentación",
    "UBA en Acción",
    "Nuestra Escuela es punto de atención del programa de salud territorial de la UBA, brindando asistencia gratuita a la comunidad."
  ],
  [
    "Acceso al servicio",
    "¿Cómo recibo el servicio?",
    "Acercate a la mesa de información en los horarios de atención para reservar tu lugar."
  ],
  [
    "Atención",
    "Frecuencia",
    "1.° y 3.° jueves"
  ],
  [
    "Atención",
    "Horario",
    "Desde las 13:00 h"
  ],
  [
    "Atención",
    "Cupos",
    "15 turnos por día"
  ],
  [
    "Coordinación",
    "Aviso de coordinación",
    "Coordinado por la Secretaría de Extensión y Bienestar Estudiantil de la ETEC."
  ]
],
 'uba-verde': [
  [
    "Encabezado",
    "UBA Verde",
    "Compromiso Ambiental ETEC"
  ],
  [
    "Programa",
    "Programa UBA Verde",
    "Desde 2013, la Universidad de Buenos Aires promueve el cuidado del ambiente y la separación de residuos. Como parte de esta red, nuestra Escuela asume el desafío de transformar nuestro entorno cotidiano."
  ],
  [
    "Convocatoria",
    "¡Sumate al cambio!",
    "Estamos lanzando la convocatoria para integrar el equipo de:"
  ],
  [
    "Equipo",
    "Promotores Verdes Preuniversitarios",
    ""
  ],
  [
    "Acciones",
    "Separación de Residuos",
    ""
  ],
  [
    "Acciones",
    "Conciencia Global",
    ""
  ],
  [
    "Acciones",
    "Acción Local",
    ""
  ],
  [
    "Lanzamiento",
    "Aviso de lanzamiento",
    "Lanzamiento: A confirmar fecha."
  ],
  [
    "Botón",
    "Quiero participar",
    "#participar"
  ]
],
  'tramites-alumnos': [
  [
    "Presentación",
    "Trámites para alumnos/as.",
    "Te informamos cómo realizar los siguientes trámites:"
  ],
  [
    "Constancia",
    "Constancia de Alumno/a Regular:",
    "se lo debes solicitar a tu preceptor/a."
  ],
  [
    "Enlaces",
    "https://tramitesadistancia.uba.ar/",
    "{\"textoTramite\":\"Los siguientes trámites se solicitan exclusivamente a través de Trámites a Distancia UBA\",\"urlTramite\":\"https://tramitesadistancia.uba.ar/\"}"
  ],
  [
    "Enlaces",
    "ACÁ",
    "{\"textoTramite\":\"Para saber cómo hacer estos trámites podés consultar el instructivo haciendo clic\",\"urlTramite\":\"https://www.etec.uba.ar/wp-content/uploads/2024/09/Instructivo-TAD.pdf\"}"
  ],
  [
    "Trámites TAD",
    "Constancia de Pase en Trámite.",
    ""
  ],
  [
    "Trámites TAD",
    "Constancia de Vacante.",
    ""
  ],
  [
    "Trámites TAD",
    "Constancia de Título en Trámite.",
    ""
  ],
  [
    "Trámites TAD",
    "Constancia de Finalización con materias adeudadas.",
    ""
  ],
  [
    "Legalización",
    "Instructivo",
    "{\"textoTramite\":\"Para legalizar tu Certificado Analítico Parcial consultá el\",\"urlTramite\":\"https://www.etec.uba.ar/wp-content/uploads/2024/09/Legalizacion-TAD.pdf\"}"
  ],
  [
    "Aviso",
    "Aviso final",
    "* No se reciben solicitudes de estos trámites en forma presencial."
  ]
],
  sorteo: [
    ['Presentación', 'Sorteo', 'Consultá la información del sorteo para el ingreso a la Escuela Técnica.'],
    ['Listado', 'Postulantes preinscriptos para el sorteo', 'El listado incluye las preinscripciones confirmadas y conserva el número asignado al completar el formulario.'],
    ['Espera', 'Listado pendiente de publicación', 'La tabla estará disponible cuando finalice la etapa de preinscripción.'],
  ],
 'regimen-academico': [
  [
    "Presentación",
    "Encabezado: Régimen Académico",
    "Régimen Académico"
  ],
  [
    "Presentación",
    "Presentación · Párrafo 1",
    "El régimen académico es un elemento estructurante de las prácticas de enseñanza y evaluación."
  ],
  [
    "Título I",
    "Encabezado: TÍTULO I",
    "TÍTULO I"
  ],
  [
    "Título I",
    "Encabezado: ENSEÑANZA",
    "ENSEÑANZA"
  ],
  [
    "Título I",
    "Encabezado: Artículo 1°: Pautas curriculares",
    "Artículo 1°: Pautas curriculares"
  ],
  [
    "Título I",
    "Artículo 1°: Pautas curriculares · Párrafo 1",
    "La enseñanza en la Escuela Técnica de la Universidad de Buenos Aires, en adelante la Escuela, es teórico-práctica, fomentando el rol activo de las y los estudiantes en el proceso de aprendizaje. La educación técnico-profesional se centra en la reflexión sistemática de la práctica y la aplicación sistematizada de la teoría. En este sentido, el vínculo entre teoría y praxis es indivisible y genera elementos propios para el aprendizaje y la reflexión sobre el hecho educativo."
  ],
  [
    "Título I",
    "Artículo 1°: Pautas curriculares · Párrafo 2",
    "Los planes de estudio y el régimen académico y sus modificaciones serán aprobados por el Consejo Directivo de la Facultad de Ciencias Económicas y elevados para su ratificación por el Consejo Superior de la Universidad. Tendrán como principios rectores la formación técnico-profesional, la justicia social con perspectiva en Derechos Humanos y una clara conciencia ciudadana, respondiendo a las problemáticas socioculturales en las que se inscribe la Escuela."
  ],
  [
    "Título II",
    "Encabezado: TÍTULO II",
    "TÍTULO II"
  ],
  [
    "Título II",
    "Encabezado: RÉGIMEN DE INSCRIPCIÓN",
    "RÉGIMEN DE INSCRIPCIÓN"
  ],
  [
    "Título II",
    "Encabezado: Artículo 2°: Calendario de inscripción y vacantes",
    "Artículo 2°: Calendario de inscripción y vacantes"
  ],
  [
    "Título II",
    "Artículo 2°: Calendario de inscripción y vacantes · Párrafo 1",
    "Las autoridades de la Escuela fijarán, cada año lectivo, las fechas de inscripción y cantidad de vacantes a ofrecer."
  ],
  [
    "Título II",
    "Encabezado: Artículo 3°: Condiciones de ingreso",
    "Artículo 3°: Condiciones de ingreso"
  ],
  [
    "Título II",
    "Artículo 3°: Condiciones de ingreso · Párrafo 2",
    "Para presentar la postulación a primer año, las y los estudiantes deberán tener aprobado séptimo año del nivel primario de la Ciudad Autónoma de Buenos Aires o su equivalente en otras jurisdicciones, acreditado con la certificación correspondiente, y no podrán tener más de QUINCE (15) años cumplidos al 30 de junio del año de incorporación a la Escuela."
  ],
  [
    "Título II",
    "Artículo 3°: Condiciones de ingreso · Párrafo 3",
    "Además, deberán participar en todas las instancias del curso de ingreso establecidas en el Anexo I."
  ],
  [
    "Título II",
    "Encabezado: Artículo 4°: Ingreso a primer año",
    "Artículo 4°: Ingreso a primer año"
  ],
  [
    "Título II",
    "Artículo 4°: Ingreso a primer año · Párrafo 4",
    "Son estudiantes de primer año de la Escuela las y los jóvenes que, habiendo cumplido los requisitos establecidos en el curso de ingreso, recibieron una vacante, efectivizaron su inscripción a través de sus representantes y entregaron la documentación correspondiente solicitada."
  ],
  [
    "Título III",
    "Encabezado: TÍTULO III",
    "TÍTULO III"
  ],
  [
    "Título III",
    "Encabezado: DEFINICIÓN DE LAS CONDICIONES DE LAS Y LOS ESTUDIANTES",
    "DEFINICIÓN DE LAS CONDICIONES DE LAS Y LOS ESTUDIANTES"
  ],
  [
    "Título III",
    "Encabezado: Artículo 5°: Condición de las y los estudiantes",
    "Artículo 5°: Condición de las y los estudiantes"
  ],
  [
    "Título III",
    "Artículo 5°: Condición de las y los estudiantes · Párrafo 1",
    "Las y los estudiantes pueden ser regulares o libres. Esta condición se extiende a todas las actividades académicas curriculares que se realizan en la Escuela."
  ],
  [
    "Título III",
    "Encabezado: Artículo 6°: Estudiantes regulares",
    "Artículo 6°: Estudiantes regulares"
  ],
  [
    "Título III",
    "Artículo 6°: Estudiantes regulares · Párrafo 2",
    "Son estudiantes regulares quienes cumplen con el régimen de asistencia y promoción establecido."
  ],
  [
    "Título III",
    "Encabezado: Artículo 7°: Estudiantes libres",
    "Artículo 7°: Estudiantes libres"
  ],
  [
    "Título III",
    "Artículo 7°: Estudiantes libres · Párrafo 3",
    "Son estudiantes libres quienes no cumplen con lo estipulado en el artículo 6°. Tienen derecho a rendir exámenes libres de los espacios curriculares que adeuden, de acuerdo con las normativas de la Escuela, y a participar en actividades de apoyo académico programadas para su preparación."
  ],
  [
    "Título III",
    "Encabezado: Artículo 8°: Representación de las y los estudiantes menores",
    "Artículo 8°: Representación de las y los estudiantes menores"
  ],
  [
    "Título III",
    "Artículo 8°: Representación de las y los estudiantes menores · Párrafo 4",
    "Las y los estudiantes menores de edad son representados ante las autoridades de la Escuela por sus padres, madres o representantes legales, quienes deben registrar su firma en la Escuela, indicando domicilio y contactos donde se los pueda encontrar en casos de urgencia."
  ],
  [
    "Título III",
    "Encabezado: Artículo 9°: Acreditación de la representación de menores",
    "Artículo 9°: Acreditación de la representación de menores"
  ],
  [
    "Título III",
    "Artículo 9°: Acreditación de la representación de menores · Párrafo 5",
    "Los representantes legales de las y los estudiantes menores de edad deben acreditar su condición por escrito ante las autoridades."
  ],
  [
    "Título IV",
    "Encabezado: TÍTULO IV",
    "TÍTULO IV"
  ],
  [
    "Título IV",
    "Encabezado: DERECHOS Y OBLIGACIONES DE LAS Y LOS ESTUDIANTES Y SUS REPRESENTANTES",
    "DERECHOS Y OBLIGACIONES DE LAS Y LOS ESTUDIANTES Y SUS REPRESENTANTES"
  ],
  [
    "Título IV",
    "Encabezado: ESTUDIANTES",
    "ESTUDIANTES"
  ],
  [
    "Título IV",
    "Encabezado: Artículo 10°: Conocimiento y observancia de las normas escolares",
    "Artículo 10°: Conocimiento y observancia de las normas escolares"
  ],
  [
    "Título IV",
    "Artículo 10°: Conocimiento y observancia de las normas escolares · Párrafo 1",
    "La mera presentación de la solicitud de inscripción a la Escuela implica, por parte de las y los estudiantes y sus padres, madres o representantes legales, la conformidad y observancia de las normas de la Escuela."
  ],
  [
    "Título IV",
    "Encabezado: Artículo 11°: Derechos de las y los estudiantes",
    "Artículo 11°: Derechos de las y los estudiantes"
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Párrafo 2",
    "La Escuela reconoce como principio rector la Convención sobre los Derechos del Niño, Niña y Adolescentes. Por lo tanto, las y los estudiantes gozan de los siguientes derechos:"
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 3",
    "Recibir educación de excelencia que contribuya a su formación en ciudadanía, ciencia, tecnología, producción, actividad física y arte de manera significativa."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 4",
    "Ser tratados/as con respeto por todos/as los/las integrantes de la Comunidad Educativa."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 5",
    "No ser discriminados por causa de género, ideologías, creencias religiosas, origen o cualquier otra índole."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 6",
    "Conocer el programa de cada espacio curricular donde se explicitan propósitos educativos, contenidos, métodos de enseñanza, formación en la práctica y criterios de evaluación."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 7",
    "Recibir información con fundamentos sobre la evaluación de sus actividades."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 8",
    "Hacer uso de las instalaciones y del material de la Escuela."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 9",
    "Expresar y publicar sus ideas sin censura previa."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 10",
    "Participar libre y voluntariamente del Centro de Estudiantes o agrupaciones vinculadas a actividades curriculares y extracurriculares."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 11",
    "Plantear sus problemas, propuestas, debates y peticiones ante las autoridades de la Escuela en forma individual o colectiva, a través de los canales habilitados para ese fin."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 12",
    "Ser oídos antes de adoptar cualquier tipo de decisión que los involucre, aun en los casos en que se requiera la presencia de padres, madres o representantes legales."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 13",
    "Solicitar la designación de mediador en caso de estar involucrados en un conflicto."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 14",
    "Recibir orientación educativa, académica, profesional y ocupacional que posibilite su inserción en el mundo del trabajo o la prosecución de estudios universitarios."
  ],
  [
    "Título IV",
    "Artículo 11°: Derechos de las y los estudiantes · Punto 15",
    "Conocer las reglamentaciones de la Escuela."
  ],
  [
    "Título IV",
    "Encabezado: Artículo 12°: Obligaciones de las y los estudiantes",
    "Artículo 12°: Obligaciones de las y los estudiantes"
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Párrafo 16",
    "Las y los estudiantes tienen las siguientes obligaciones:"
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 17",
    "Cumplir con los requisitos para la aprobación de cada espacio curricular."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 18",
    "Cumplir con los requerimientos de las actividades extracurriculares que hayan comprometido."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 19",
    "Cumplir las reglamentaciones de la Escuela."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 20",
    "Respetar a sus compañeras y compañeros y a todas y todos los integrantes de la Comunidad Educativa."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 21",
    "Preservar las instalaciones, mobiliario, equipamiento y materiales de la Escuela y de otras instituciones donde deban concurrir en cumplimiento de actividades escolares."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 22",
    "Cuidar las condiciones de aseo personal."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 23",
    "Permanecer en la Escuela durante toda la jornada escolar, cumpliendo las actividades educativas programadas."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 24",
    "Devolver a quien corresponda en la Escuela toda documentación o constancia de notificación remitida al padre, madre o representante legal antes de los TRES (3) días hábiles, salvo que expresamente se indique otro plazo."
  ],
  [
    "Título IV",
    "Artículo 12°: Obligaciones de las y los estudiantes · Punto 25",
    "Cumplir con las indicaciones de las autoridades, docentes y demás personal de la Escuela que contribuyan a la convivencia armónica, al desarrollo académico o ante situaciones que demanden atención adulta."
  ],
  [
    "Título IV",
    "Encabezado: PADRES, MADRES Y REPRESENTANTES LEGALES DE LOS/AS ESTUDIANTES",
    "PADRES, MADRES Y REPRESENTANTES LEGALES DE LOS/AS ESTUDIANTES"
  ],
  [
    "Título IV",
    "Encabezado: Artículo 13°: Derechos de los representantes de las y los estudiantes",
    "Artículo 13°: Derechos de los representantes de las y los estudiantes"
  ],
  [
    "Título IV",
    "Artículo 13°: Derechos de los representantes de las y los estudiantes · Párrafo 26",
    "Los padres, madres o representantes legales tienen los siguientes derechos:"
  ],
  [
    "Título IV",
    "Artículo 13°: Derechos de los representantes de las y los estudiantes · Punto 27",
    "Ser informados/as en forma periódica sobre la evaluación del proceso educativo de sus hijas, hijos o representados/as."
  ],
  [
    "Título IV",
    "Artículo 13°: Derechos de los representantes de las y los estudiantes · Punto 28",
    "Asistir y participar de reuniones de padres y madres, actos escolares, competencias deportivas y actividades sociocomunitarias."
  ],
  [
    "Título IV",
    "Artículo 13°: Derechos de los representantes de las y los estudiantes · Punto 29",
    "Solicitar entrevistas con las autoridades de la Escuela."
  ],
  [
    "Título IV",
    "Artículo 13°: Derechos de los representantes de las y los estudiantes · Punto 30",
    "Asociarse con fines benéficos de apoyo a las actividades de la Escuela."
  ],
  [
    "Título IV",
    "Encabezado: Artículo 14°: Obligaciones de las y los representantes",
    "Artículo 14°: Obligaciones de las y los representantes"
  ],
  [
    "Título IV",
    "Artículo 14°: Obligaciones de las y los representantes · Párrafo 31",
    "Los padres, madres y/o representantes legales tienen las siguientes obligaciones:"
  ],
  [
    "Título IV",
    "Artículo 14°: Obligaciones de las y los representantes · Punto 32",
    "Tomar conocimiento y firmar toda la documentación que requiera la Escuela dentro de los TRES (3) días hábiles."
  ],
  [
    "Título IV",
    "Artículo 14°: Obligaciones de las y los representantes · Punto 33",
    "Comprometerse con el seguimiento socioacadémico de las y los estudiantes, notificándose de sus evaluaciones, inasistencias, sanciones u otras novedades."
  ],
  [
    "Título IV",
    "Artículo 14°: Obligaciones de las y los representantes · Punto 34",
    "Concurrir a la Escuela cada vez que fuese requerido por las autoridades."
  ],
  [
    "Título IV",
    "Artículo 14°: Obligaciones de las y los representantes · Punto 35",
    "Representar a las y los estudiantes menores de edad frente a las autoridades de la Escuela."
  ],
  [
    "Título V",
    "Encabezado: TÍTULO V",
    "TÍTULO V"
  ],
  [
    "Título V",
    "Encabezado: RÉGIMEN DE ASISTENCIA",
    "RÉGIMEN DE ASISTENCIA"
  ],
  [
    "Título V",
    "Encabezado: Artículo 15°: Obligatoriedad de asistencia a la Escuela",
    "Artículo 15°: Obligatoriedad de asistencia a la Escuela"
  ],
  [
    "Título V",
    "Artículo 15°: Obligatoriedad de asistencia a la Escuela · Párrafo 1",
    "La asistencia a la Escuela es obligatoria para las y los estudiantes regulares."
  ],
  [
    "Título V",
    "Artículo 15°: Obligatoriedad de asistencia a la Escuela · Párrafo 2",
    "Para el régimen de regularidad y el control parental se tomará en cuenta la asistencia por jornada y para el régimen de promoción se acreditará la asistencia por espacio curricular."
  ],
  [
    "Título V",
    "Encabezado: Artículo 16°: Horarios de ingreso y egreso a la Escuela",
    "Artículo 16°: Horarios de ingreso y egreso a la Escuela"
  ],
  [
    "Título V",
    "Artículo 16°: Horarios de ingreso y egreso a la Escuela · Párrafo 3",
    "La Escuela tendrá horarios de entrada y salida diarios fijos, y dentro de los mismos habrá una organización de duración diversa entre espacios curriculares y espacios educativos alternativos o electivos."
  ],
  [
    "Título V",
    "Artículo 16°: Horarios de ingreso y egreso a la Escuela · Párrafo 4",
    "Se computará UNA (1) inasistencia cuando el estudiante no concurra a la Escuela durante toda la jornada."
  ],
  [
    "Título V",
    "Artículo 16°: Horarios de ingreso y egreso a la Escuela · Párrafo 5",
    "La falta de puntualidad al inicio del horario escolar, hasta VEINTE (20) minutos después del comienzo de la jornada, se considerará como MEDIA (½) inasistencia. Transcurridos los VEINTE (20) minutos se computará inasistencia completa. En ambos casos es obligatorio el ingreso a clase de las y los estudiantes."
  ],
  [
    "Título V",
    "Encabezado: Artículo 17°: Excepciones",
    "Artículo 17°: Excepciones"
  ],
  [
    "Título V",
    "Artículo 17°: Excepciones · Párrafo 6",
    "La Rectoría podrá autorizar a las y los estudiantes a retirarse de clase, por causas fundadas y para realizar actividades deportivas, culturales u otras en representación de la Escuela, con la autorización expresa de los padres, madres o representantes legales, no computándose inasistencia en tal caso."
  ],
  [
    "Título V",
    "Encabezado: Artículo 18°: Festividades y conmemoraciones religiosas",
    "Artículo 18°: Festividades y conmemoraciones religiosas"
  ],
  [
    "Título V",
    "Artículo 18°: Festividades y conmemoraciones religiosas · Párrafo 7",
    "En caso de conmemoraciones de credos o confesiones religiosas inscriptos en el Registro Nacional de Cultos, no se computarán inasistencias a los/as creyentes."
  ],
  [
    "Título V",
    "Encabezado: Artículo 19°: Ausencia por enfermedad",
    "Artículo 19°: Ausencia por enfermedad"
  ],
  [
    "Título V",
    "Artículo 19°: Ausencia por enfermedad · Párrafo 8",
    "Cuando una o un estudiante padezca una enfermedad de largo tratamiento que le impidiera trasladarse a la Escuela, podrá solicitar el no cómputo de las inasistencias y deberá reintegrarse a clase dentro de los DIEZ (10) días hábiles de la solicitud."
  ],
  [
    "Título V",
    "Artículo 19°: Ausencia por enfermedad · Párrafo 9",
    "Efectuada la solicitud en tiempo y con el certificado médico correspondiente, la Rectoría resolverá los casos de mayor lapso con carácter de excepción. Cuando la enfermedad lo permitiese, se programarán tareas escolares para realizar durante la convalecencia."
  ],
  [
    "Título V",
    "Encabezado: Artículo 20°: Inasistencia por fuerza mayor",
    "Artículo 20°: Inasistencia por fuerza mayor"
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Párrafo 10",
    "Se consideran inasistencias justificadas por motivos de fuerza mayor, siempre que estén debidamente acreditadas:"
  ],
  [
    "Título V",
    "Título V · Punto 11",
    "Fallecimiento de familiares:"
  ],
  [
    "Título V",
    "Título V · Punto 12",
    "Padres, madres, cónyuge o hijas/os: CINCO (5) días."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 13",
    "Hermanos/as y abuelos/as: TRES (3) días."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 14",
    "Tíos/as, suegros/as y cuñados/as: UN (1) día."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 15",
    "Mudanza del grupo familiar: UN (1) día."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 16",
    "Matrimonio: CINCO (5) días."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 17",
    "Razones de salud acreditadas con el correspondiente certificado médico."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Párrafo 18",
    "La Rectoría está facultada a permitir el reintegro a clase del estudiante que, por enfermedad, hubiese inasistido CUATRO (4) días o más consecutivos, siempre que los certificados médicos le otorguen el alta correspondiente."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Párrafo 19",
    "Se consideran certificados válidos de autoridad sanitaria competente los extendidos por:"
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 20",
    "Hospitales nacionales, provinciales o municipales."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 21",
    "Clínicas de obras sociales gremiales, particulares o privadas."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Punto 22",
    "Médicos/as particulares, con firma y sello que acrediten su matriculación y firma certificada por la autoridad sanitaria."
  ],
  [
    "Título V",
    "Artículo 20°: Inasistencia por fuerza mayor · Párrafo 23",
    "Todas las actuaciones relacionadas con la reincorporación, así como las constancias y certificaciones médicas presentadas, serán archivadas en el legajo escolar de la o del estudiante."
  ],
  [
    "Título V",
    "Encabezado: Artículo 21°: Pérdida de regularidad y reincorporación",
    "Artículo 21°: Pérdida de regularidad y reincorporación"
  ],
  [
    "Título V",
    "Artículo 21°: Pérdida de regularidad y reincorporación · Párrafo 24",
    "La o el estudiante que computase QUINCE (15) inasistencias a toda la jornada escolar durante un año lectivo podrá solicitar su reincorporación, la que quedará a consideración de la Rectoría."
  ],
  [
    "Título V",
    "Artículo 21°: Pérdida de regularidad y reincorporación · Párrafo 25",
    "En caso de ser favorable, se otorgará la reincorporación concediéndole DIEZ (10) inasistencias adicionales."
  ],
  [
    "Título V",
    "Artículo 21°: Pérdida de regularidad y reincorporación · Párrafo 26",
    "Cuando la o el estudiante computase VEINTICINCO (25) inasistencias, deberá solicitar nuevamente su reincorporación, que también quedará a consideración de la Rectoría. Al menos DIECISIETE (17) de las VEINTICINCO (25) inasistencias deberán estar debidamente justificadas."
  ],
  [
    "Título V",
    "Artículo 21°: Pérdida de regularidad y reincorporación · Párrafo 27",
    "En caso de ser favorable, se le concederán CINCO (5) inasistencias adicionales. La o el estudiante que supere las TREINTA (30) inasistencias permanecerá en la Escuela por resolución de la Rectoría."
  ],
  [
    "Título V",
    "Encabezado: Artículo 22°: Salida anticipada al horario de egreso",
    "Artículo 22°: Salida anticipada al horario de egreso"
  ],
  [
    "Título V",
    "Artículo 22°: Salida anticipada al horario de egreso · Párrafo 28",
    "En caso de suspensión de clases, ausencia de profesores/as u otros motivos válidos, podrán retirarse de la Escuela las y los estudiantes que dispongan de una autorización firmada al inicio del año lectivo por sus padres, madres o representantes legales."
  ],
  [
    "Título V",
    "Encabezado: Artículo 23°: Abordaje del Equipo de Orientación Tutorial",
    "Artículo 23°: Abordaje del Equipo de Orientación Tutorial"
  ],
  [
    "Título V",
    "Artículo 23°: Abordaje del Equipo de Orientación Tutorial · Párrafo 29",
    "Cuando una o un estudiante acumule tres o más inasistencias consecutivas, los/as preceptores/as y/o el Equipo de Orientación Tutorial llevarán a cabo actividades sistemáticas de comunicación con los padres, madres o representantes legales."
  ],
  [
    "Título V",
    "Artículo 23°: Abordaje del Equipo de Orientación Tutorial · Párrafo 30",
    "Al alcanzar las QUINCE (15) inasistencias se convocará a los adultos responsables para informar la situación y acordar estrategias de acompañamiento de la trayectoria educativa."
  ],
  [
    "Título V",
    "Artículo 23°: Abordaje del Equipo de Orientación Tutorial · Párrafo 31",
    "Cuando alcance las VEINTE (20) inasistencias, se citará nuevamente a los adultos responsables para notificar la nueva situación."
  ],
  [
    "Título V",
    "Artículo 23°: Abordaje del Equipo de Orientación Tutorial · Párrafo 32",
    "Al alcanzar VEINTIOCHO (28) inasistencias, el equipo directivo deberá convocar una reunión que incluya al Equipo de Orientación Tutorial, al DOE, a las autoridades de la Escuela y a los adultos responsables. Esta reunión servirá como instancia de análisis y definición de propuestas para el acompañamiento de la trayectoria educativa del o la estudiante."
  ],
  [
    "Título VI",
    "Encabezado: TÍTULO VI",
    "TÍTULO VI"
  ],
  [
    "Título VI",
    "Encabezado: CONDICIONES DE APROBACIÓN DE LOS ESPACIOS CURRICULARES",
    "CONDICIONES DE APROBACIÓN DE LOS ESPACIOS CURRICULARES"
  ],
  [
    "Título VI",
    "Encabezado: Artículo 24°",
    "Artículo 24°"
  ],
  [
    "Título VI",
    "Artículo 24° · Párrafo 1",
    "Las y los estudiantes serán evaluados al finalizar cada bimestre, alternando instancias nominales y numéricas sucesivamente. De esta forma tendrán cinco calificaciones anuales:"
  ],
  [
    "Título VI",
    "Artículo 24° · Párrafo 2",
    "La calificación final numérica de cada materia se registrará al momento en que haya finalizado la cursada, sea que la materia haya sido aprobada o quede pendiente de aprobación, de acuerdo con los siguientes criterios:"
  ],
  [
    "Título VI",
    "Artículo 24° · Punto 3",
    "Cuando la o el estudiante haya obtenido una calificación de siete (7) a diez (10) en cada cuatrimestre, promocionará la materia. La calificación final será el promedio de ambos cuatrimestres."
  ],
  [
    "Título VI",
    "Artículo 24° · Punto 4",
    "Cuando la calificación sea entre siete (7) y diez (10) en un cuatrimestre y menor a siete (7) en el otro, la calificación final será la obtenida en el último período de recuperación en el que haya aprobado los contenidos pendientes."
  ],
  [
    "Título VI",
    "Artículo 24° · Punto 5",
    "Cuando la calificación sea menor a siete (7) en ambos cuatrimestres, la calificación final será la obtenida en el último período de recuperación en el que haya aprobado los contenidos pendientes."
  ],
  [
    "Título VI",
    "Artículo 24° · Punto 6",
    "Cuando la materia no sea aprobada en los períodos de recuperación ni en las mesas correspondientes a su ciclo lectivo, quedará como materia previa."
  ],
  [
    "Título VI",
    "Artículo 24° · Párrafo 7",
    "Al finalizar la evaluación se enviará un boletín a los padres, madres o representantes legales y se citará a los responsables de estudiantes que se encuentren en riesgo educativo por rendimiento académico o ausencias."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 25°: Categorías nominales",
    "Artículo 25°: Categorías nominales"
  ],
  [
    "Título VI",
    "Artículo 25°: Categorías nominales · Párrafo 8",
    "Las categorías nominales son: APROBADO, EN PROCESO —cuando no alcanza la aprobación— y NO CORRESPONDE CALIFICAR —en caso de ausencias justificadas o adecuación curricular—."
  ],
  [
    "Título VI",
    "Artículo 25°: Categorías nominales · Párrafo 9",
    "La evaluación nominal aporta información adicional respecto a los logros en los aprendizajes, pero no se computa a los efectos de promocionar la materia."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 26°: Categorías numéricas",
    "Artículo 26°: Categorías numéricas"
  ],
  [
    "Título VI",
    "Artículo 26°: Categorías numéricas · Párrafo 10",
    "Del uno (1) al seis (6): desaprobado. Del siete (7) al diez (10): aprobado."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 27°",
    "Artículo 27°"
  ],
  [
    "Título VI",
    "Artículo 27° · Párrafo 11",
    "La materia se considera aprobada cuando la o el estudiante cumple con alguna de estas condiciones:"
  ],
  [
    "Título VI",
    "Artículo 27° · Punto 12",
    "Promoción: obtiene una calificación de siete (7) a diez (10) en ambos cuatrimestres."
  ],
  [
    "Título VI",
    "Artículo 27° · Punto 13",
    "Recuperación: si en el primer o segundo cuatrimestre recibe una calificación menor a siete (7), debe aprobar los temas pendientes y obtener una calificación de siete (7) a diez (10) en el cuatrimestre desaprobado."
  ],
  [
    "Título VI",
    "Artículo 27° · Punto 14",
    "Recuperación en períodos intensivos: durante diciembre y febrero se trabajará de manera intensiva con quienes tengan espacios curriculares pendientes."
  ],
  [
    "Título VI",
    "Artículo 27° · Punto 15",
    "Exámenes: quienes no aprueben la recuperación podrán presentarse en las mesas de exámenes libres en las instancias establecidas por la Escuela."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 28°: Definición de aprobado",
    "Artículo 28°: Definición de aprobado"
  ],
  [
    "Título VI",
    "Artículo 28°: Definición de aprobado · Párrafo 16",
    "Las y los estudiantes aprobarán el espacio curricular cuando tengan una calificación final de SIETE (7) o más en alguna de las condiciones mencionadas en el artículo 27°."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 29°: Período de recuperación de los aprendizajes",
    "Artículo 29°: Período de recuperación de los aprendizajes"
  ],
  [
    "Título VI",
    "Artículo 29°: Período de recuperación de los aprendizajes · Párrafo 17",
    "Durante diciembre y febrero, las y los estudiantes que no hayan alcanzado una calificación final de SIETE (7) deberán concurrir a las instancias de recuperación en los horarios habituales en los que se dictan las materias."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 30°: Mesa de examen",
    "Artículo 30°: Mesa de examen"
  ],
  [
    "Título VI",
    "Artículo 30°: Mesa de examen · Párrafo 18",
    "Habrá mesas de examen para estudiantes regulares y libres con materias previas durante diciembre, febrero/marzo y julio/agosto, conforme al calendario educativo."
  ],
  [
    "Título VI",
    "Artículo 30°: Mesa de examen · Párrafo 19",
    "En todos los casos la o el estudiante será evaluado por una mesa examinadora integrada por tres docentes del espacio curricular y/o autoridades de la Escuela, rindiendo el programa completo de la materia."
  ],
  [
    "Título VI",
    "Encabezado: Artículo 31°: Promoción del año lectivo",
    "Artículo 31°: Promoción del año lectivo"
  ],
  [
    "Título VI",
    "Artículo 31°: Promoción del año lectivo · Párrafo 20",
    "Promocionan al siguiente año las y los estudiantes que aprueben todos los espacios curriculares, pudiendo tener hasta dos materias previas."
  ],
  [
    "Título VII",
    "Encabezado: TÍTULO VII",
    "TÍTULO VII"
  ],
  [
    "Título VII",
    "Encabezado: COMUNICACIÓN DEL LOGRO DE LOS APRENDIZAJES",
    "COMUNICACIÓN DEL LOGRO DE LOS APRENDIZAJES"
  ],
  [
    "Título VII",
    "Encabezado: Artículo 32°",
    "Artículo 32°"
  ],
  [
    "Título VII",
    "Artículo 32° · Párrafo 1",
    "La Escuela comunicará los logros y avances en los aprendizajes de las y los estudiantes mediante dos documentos:"
  ],
  [
    "Título VII",
    "Artículo 32° · Punto 2",
    "Informe de carácter orientador: comunicará los avances en los procesos de aprendizaje. El estado de progreso comunicado a través de este informe no se considera una calificación parcial para la acreditación."
  ],
  [
    "Título VII",
    "Artículo 32° · Punto 3",
    "El informe orientador tiene como función disponer de elementos diagnósticos que permitan a las y los docentes revisar prácticas de enseñanza y planificar acuerdos de trabajo académico o Itinerarios Pedagógicos Personalizados (IPP), según corresponda, en forma temprana para quienes aún no aprueben los espacios curriculares."
  ],
  [
    "Título VII",
    "Artículo 32° · Punto 4",
    "Informe de carácter acreditativo: comunicará las calificaciones parciales que acrediten los logros de aprendizaje de las y los estudiantes."
  ],
  [
    "Título VIII",
    "Encabezado: TÍTULO VIII",
    "TÍTULO VIII"
  ],
  [
    "Título VIII",
    "Encabezado: ACOMPAÑAMIENTO A LAS TRAYECTORIAS EDUCATIVAS",
    "ACOMPAÑAMIENTO A LAS TRAYECTORIAS EDUCATIVAS"
  ],
  [
    "Título VIII",
    "Encabezado: Artículo 33°",
    "Artículo 33°"
  ],
  [
    "Título VIII",
    "Artículo 33° · Párrafo 1",
    "Las y los estudiantes que durante el cursado de los espacios curriculares evidencien o presenten indicios de estar transitando una situación de riesgo educativo serán asistidos/as académicamente por las y los docentes de los espacios curriculares correspondientes y por el equipo de tutoría responsable del seguimiento y acompañamiento."
  ],
  [
    "Título VIII",
    "Artículo 33° · Párrafo 2",
    "El objetivo será que las y los estudiantes puedan avanzar positivamente en sus aprendizajes."
  ],
  [
    "Título VIII",
    "Encabezado: Artículo 34°: Itinerario Pedagógico Personalizado (IPP)",
    "Artículo 34°: Itinerario Pedagógico Personalizado (IPP)"
  ],
  [
    "Título VIII",
    "Artículo 34°: Itinerario Pedagógico Personalizado (IPP) · Párrafo 3",
    "El Itinerario Pedagógico Personalizado constituye una instancia de adecuación pedagógica destinada a estudiantes con discapacidad, estudiantes que por diversas razones no hayan alcanzado los aprendizajes propuestos en los tiempos esperados o se encuentren en un contexto de vulneración de derechos que les impida asistir regularmente a clases o rendir exámenes en las fechas y espacios previstos."
  ],
  [
    "Título VIII",
    "Artículo 34°: Itinerario Pedagógico Personalizado (IPP) · Párrafo 4",
    "A los efectos de formular los IPP, las y los docentes, en acuerdo con el/la jefe/a de departamento y el Departamento de Orientación al Estudiante (DOE), deberán identificar los objetivos de aprendizaje prioritarios al elaborar los programas de enseñanza."
  ],
  [
    "Título VIII",
    "Encabezado: Artículo 35°: Alcance del Itinerario Pedagógico Personalizado",
    "Artículo 35°: Alcance del Itinerario Pedagógico Personalizado"
  ],
  [
    "Título VIII",
    "Artículo 35°: Alcance del Itinerario Pedagógico Personalizado · Párrafo 5",
    "Las acciones de acompañamiento académico de los IPP comprenden la redefinición razonable de los aprendizajes propuestos en los programas de enseñanza, teniendo en cuenta los conocimientos o saberes prioritarios que deberá alcanzar la o el estudiante."
  ],
  [
    "Título VIII",
    "Artículo 35°: Alcance del Itinerario Pedagógico Personalizado · Párrafo 6",
    "Se podrán diseñar actividades educativas alternativas a desarrollar a lo largo del calendario escolar extendido, de marzo a marzo de cada ciclo lectivo."
  ],
  [
    "Título VIII",
    "Encabezado: Artículo 36°: Programa de regularización para estudiantes con materias previas",
    "Artículo 36°: Programa de regularización para estudiantes con materias previas"
  ],
  [
    "Título VIII",
    "Artículo 36°: Programa de regularización para estudiantes con materias previas · Párrafo 7",
    "Este programa está destinado a estudiantes que tienen entre dos y cinco materias previas, permitiéndoles inscribirse para recibir apoyo adicional en su proceso de aprendizaje."
  ],
  [
    "Título VIII",
    "Artículo 36°: Programa de regularización para estudiantes con materias previas · Párrafo 8",
    "Las y los docentes del establecimiento trabajarán de manera focalizada para recuperar los saberes de quienes hayan desaprobado, con el objetivo de facilitar la aprobación de las materias adeudadas."
  ],
  [
    "Título VIII",
    "Artículo 36°: Programa de regularización para estudiantes con materias previas · Párrafo 9",
    "Las clases se dictarán fuera del horario regular. Se solicitará a la madre, padre o representante legal la firma de un acta de compromiso que autorice a extender la jornada escolar para participar de estas actividades."
  ],
  [
    "Título VIII",
    "Artículo 36°: Programa de regularización para estudiantes con materias previas · Párrafo 10",
    "La reglamentación correspondiente al Programa de Regularización de Materias Previas (PREP) se detalla en el Anexo II."
  ],
  [
    "Título VIII",
    "Encabezado: Artículo 37°: Titulación",
    "Artículo 37°: Titulación"
  ],
  [
    "Título VIII",
    "Artículo 37°: Titulación · Párrafo 11",
    "Al aprobar todos los espacios curriculares programados para los SEIS (6) años de estudios, se otorgará a las y los estudiantes el título de técnica o técnico que habilita el ejercicio profesional en la especialidad cursada y se extenderá el certificado analítico que dé cuenta de su trayectoria escolar."
  ],
  [
    "Título VIII",
    "Artículo 37°: Titulación · Párrafo 12",
    "Si una o un estudiante no hubiera alcanzado la totalidad de las capacidades técnico-profesionales definidas en el plan de estudios correspondiente, se acreditará en un certificado analítico la trayectoria recorrida."
  ],
  [
    "Título VIII",
    "Artículo 37°: Titulación · Párrafo 13",
    "Dicha certificación no será habilitante para el ejercicio profesional, según la responsabilidad civil que esa titulación conlleva, aunque sí habilitará la continuidad en otros espacios educativos de acuerdo con su franja etaria y los saberes adquiridos."
  ],
  [
    "Anexo I",
    "Encabezado: ANEXO I",
    "ANEXO I"
  ],
  [
    "Anexo I",
    "Encabezado: CURSO DE INGRESO",
    "CURSO DE INGRESO"
  ],
  [
    "Anexo I",
    "Anexo I · Párrafo 1",
    "La modalidad de ingreso a la ETEC UBA se realizará a través de un único Curso de Ingreso de carácter evaluatorio."
  ],
  [
    "Anexo I",
    "Anexo I · Párrafo 2",
    "Su propósito es generar un espacio de articulación que facilite la transición de la escuela primaria a la secundaria y brindar a las y los futuros estudiantes una base y nivelación que favorezca una trayectoria escolar secundaria significativa."
  ],
  [
    "Anexo I",
    "Encabezado: Características generales",
    "Características generales"
  ],
  [
    "Anexo I",
    "Características generales · Párrafo 3",
    "Podrán postularse las y los aspirantes que estén cursando séptimo grado del nivel primario de la Ciudad de Buenos Aires o su equivalente y hayan sido sorteados por el establecimiento."
  ],
  [
    "Anexo I",
    "Características generales · Párrafo 4",
    "Las y los postulantes ingresarán al curso por medio de un sorteo ante escribano público."
  ],
  [
    "Anexo I",
    "Características generales · Párrafo 5",
    "Quedan excluidos de dicho sorteo los hermanos y hermanas de estudiantes regulares de la ETEC UBA, los hijos e hijas de empleados de la UBA y quienes formen parte del “Programa Alumnos/as Destacados Comuna 8”, teniendo asignación directa al Curso de Ingreso."
  ],
  [
    "Anexo I",
    "Características generales · Párrafo 6",
    "Al momento de ingresar como alumno/a regular de primer año, la o el aspirante debe tener aprobado el ciclo primario completo o su equivalente y no tener quince años o más al 30 de junio del año corriente."
  ],
  [
    "Anexo I",
    "Características generales · Párrafo 7",
    "La cantidad de participantes del Curso de Ingreso será dispuesta por la Rectoría, al igual que el cupo para ingresar a la ETEC UBA. Este dato será informado al momento de la inscripción y podrá ampliarse en función de la disponibilidad."
  ],
  [
    "Anexo I",
    "Encabezado: Organización de la cursada",
    "Organización de la cursada"
  ],
  [
    "Anexo I",
    "Organización de la cursada · Párrafo 8",
    "El Curso de Ingreso se dictará los sábados y tendrá una duración mínima de 104 horas cátedra —cada hora cátedra equivale a 40 minutos—, distribuidas en un mínimo de 16 clases."
  ],
  [
    "Anexo I",
    "Organización de la cursada · Párrafo 9",
    "La modalidad de cursada es presencial."
  ],
  [
    "Anexo I",
    "Organización de la cursada · Párrafo 10",
    "La fecha de inicio se establecerá anualmente una vez determinado el comienzo del ciclo lectivo correspondiente."
  ],
  [
    "Anexo I",
    "Organización de la cursada · Párrafo 11",
    "Materias: Lengua, Matemática y Tecnología, que abarca Educación Digital y Sistemas Tecnológicos. Estas materias podrán modificarse si la institución evalúa que las y los ingresantes deben reforzar saberes en otros campos del conocimiento."
  ],
  [
    "Anexo I",
    "Organización de la cursada · Párrafo 12",
    "Cronograma de cursada: se establecerá anualmente."
  ],
  [
    "Anexo I",
    "Encabezado: Evaluación del Curso de Ingreso",
    "Evaluación del Curso de Ingreso"
  ],
  [
    "Anexo I",
    "Evaluación del Curso de Ingreso · Párrafo 13",
    "Se establecerá un orden de mérito cuyo puntaje surgirá de la sumatoria de todas las instancias de evaluación."
  ],
  [
    "Anexo I",
    "Encabezado: Asignación de la vacante a la Escuela",
    "Asignación de la vacante a la Escuela"
  ],
  [
    "Anexo I",
    "Asignación de la vacante a la Escuela · Párrafo 14",
    "Ingresarán como estudiantes a la Escuela las y los postulantes que cuenten con el mejor puntaje y tengan una asistencia mínima equivalente al 75%."
  ],
  [
    "Anexo I",
    "Asignación de la vacante a la Escuela · Párrafo 15",
    "En caso de empate en el puntaje mínimo alcanzado dentro del orden de mérito, se realizará un sorteo con las mismas características que el sorteo de ingreso al curso."
  ],
  [
    "Anexo II",
    "Encabezado: ANEXO II",
    "ANEXO II"
  ],
  [
    "Anexo II",
    "Encabezado: PROGRAMA DE REGULARIZACIÓN DE MATERIAS PREVIAS (PREP)",
    "PROGRAMA DE REGULARIZACIÓN DE MATERIAS PREVIAS (PREP)"
  ],
  [
    "Anexo II",
    "Encabezado: Fundamentación",
    "Fundamentación"
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 1",
    "Desde la creación de la Escuela, sus pilares son la inclusión efectiva y la calidad educativa, respaldadas por la Universidad de Buenos Aires y por la calidad del equipo docente del establecimiento."
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 2",
    "La Resolución (CS) N.º 47671/08, que aprueba el Reglamento General para los establecimientos de Enseñanza Secundaria de la Universidad de Buenos Aires, establece que deben ser centros de excelencia en relación con la oferta académica, la organización curricular, los laboratorios para la experimentación, las estrategias docentes, las propuestas de evaluación, las ofertas extracurriculares y las condiciones y modalidades de la vida social en sus aulas."
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 3",
    "Se espera que las y los estudiantes egresados puedan desempeñarse como técnicos especializados y dar continuidad a estudios superiores."
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 4",
    "La recuperación de estudiantes con materias previas resulta decisiva. Por ello se plantea la necesidad de implementar modificaciones en el sistema de apoyo escolar."
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 5",
    "El Programa de Regularización para Estudiantes con Materias Previas (PREP) busca que las y los estudiantes regularicen su situación académica mediante una organización pedagógica dirigida a estudiantes de segundo a quinto año que tengan entre dos y cinco materias previas."
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 6",
    "Las y los estudiantes podrán cursar por única vez el PREP durante su trayectoria educativa."
  ],
  [
    "Anexo II",
    "Fundamentación · Párrafo 7",
    "El proyecto incentiva a incrementar el rendimiento durante el ciclo lectivo sin abandonar la regularidad de la cursada, mientras se realizan fuera del horario escolar las actividades necesarias para aprobar las asignaturas adeudadas."
  ],
  [
    "Anexo II",
    "Encabezado: Objetivos del programa",
    "Objetivos del programa"
  ],
  [
    "Anexo II",
    "Objetivos del programa · Punto 8",
    "Acompañar el proceso de aprendizaje de las materias previas para lograr su acreditación en el menor tiempo posible."
  ],
  [
    "Anexo II",
    "Objetivos del programa · Punto 9",
    "Brindar mejores condiciones de cursada a quienes adeudan materias previas."
  ],
  [
    "Anexo II",
    "Objetivos del programa · Punto 10",
    "Lograr un mayor compromiso con la cursada de las y los estudiantes que adeudan materias."
  ],
  [
    "Anexo II",
    "Encabezado: Condiciones de ingreso al programa",
    "Condiciones de ingreso al programa"
  ],
  [
    "Anexo II",
    "Condiciones de ingreso al programa · Punto 11",
    "Las y los estudiantes que reúnan las condiciones para ingresar al programa, junto con una persona adulta responsable del cuidado parental, deberán firmar un acta acuerdo."
  ],
  [
    "Anexo II",
    "Condiciones de ingreso al programa · Punto 12",
    "Adeudar de dos (2) a cinco (5) materias previas al finalizar el período regular de recuperación."
  ],
  [
    "Anexo II",
    "Condiciones de ingreso al programa · Punto 13",
    "Ser estudiante regular de la institución."
  ],
  [
    "Anexo II",
    "Encabezado: Organización del programa",
    "Organización del programa"
  ],
  [
    "Anexo II",
    "Organización del programa · Párrafo 14",
    "El plan de trabajo busca extender la jornada escolar mediante espacios curriculares intensivos a cargo de docentes del establecimiento, que dispondrán de un trimestre para trabajar con grupos reducidos a fin de recuperar materias no aprobadas en años anteriores."
  ],
  [
    "Anexo II",
    "Organización del programa · Párrafo 15",
    "Se podrán recursar hasta tres espacios curriculares por cuatrimestre, mientras se aborda el conjunto de materias correspondientes al año siguiente. Esta situación se denomina regularidad condicionada."
  ],
  [
    "Anexo II",
    "Organización del programa · Párrafo 16",
    "La o el estudiante que apruebe tres de las cinco materias recuperará la regularidad en el año que se encuentra cursando. Si no lo logra, repetirá el año y deberá cursar únicamente los espacios adeudados hasta lograr su reincorporación al sistema."
  ],
  [
    "Anexo II",
    "Organización del programa · Párrafo 17",
    "La ETEC UBA dispondrá docentes que realizarán encuentros tutoriales semanales, asignarán trabajos prácticos y asistirán a las y los estudiantes de manera virtual. También contarán con el apoyo presencial del sistema tutorial."
  ],
  [
    "Anexo II",
    "Organización del programa · Punto 18",
    "Las materias previas se recursarán de forma intensiva, a contraturno, y se acreditarán de forma parcial y progresiva."
  ],
  [
    "Anexo II",
    "Organización del programa · Punto 19",
    "El máximo de cursada simultánea por cuatrimestre será de tres materias."
  ],
  [
    "Anexo II",
    "Organización del programa · Punto 20",
    "La oferta se organizará en dos tramos: uno durante el primer cuatrimestre y otro durante el segundo."
  ],
  [
    "Anexo II",
    "Organización del programa · Punto 21",
    "Cuando la o el estudiante quede con dos materias previas, recuperará su condición de estudiante regular y saldrá del programa."
  ],
  [
    "Anexo II",
    "Organización del programa · Punto 22",
    "Se realizarán clases semanales intensivas durante tres meses —entre 12 y 14 clases— con asistencia obligatoria."
  ],
  [
    "Anexo II",
    "Organización del programa · Punto 23",
    "Los contenidos y la planificación serán definidos por los Departamentos Académicos junto con la Secretaría de Planeamiento."
  ],
  [
    "Anexo II",
    "Encabezado: Condiciones para la aprobación de materias",
    "Condiciones para la aprobación de materias"
  ],
  [
    "Anexo II",
    "Condiciones para la aprobación de materias · Punto 24",
    "Cumplir con una asistencia mínima del 75% de las clases dictadas."
  ],
  [
    "Anexo II",
    "Condiciones para la aprobación de materias · Punto 25",
    "Aprobar las instancias de evaluación con un promedio de siete (7) puntos o más."
  ],
  [
    "Anexo II",
    "Condiciones para la aprobación de materias · Punto 26",
    "En caso de desaprobación, las materias podrán rendirse como previas en las mesas de examen, manteniendo la permanencia en el programa."
  ],
  [
    "Anexo II",
    "Condiciones para la aprobación de materias · Punto 27",
    "Si la o el estudiante del PREP no concurre a los espacios curriculares asignados para recuperar las materias previas, quedará en condición de libre."
  ],
  [
    "Resolución",
    "Condiciones para la aprobación de materias · Párrafo 28",
    "Régimen Académico de la Escuela Técnica aprobado mediante la Resolución RREM-2025-55-E-UBA-ETEC."
  ]
],
  plan: [
  [
    "Título de página",
    "PLAN DE ESTUDIOS",
    ""
  ],
  [
    "Características",
    "Universidad de Buenos Aires",
    "200 años de excelencia pública y gratuita."
  ],
  [
    "Características",
    "Jornada Completa",
    "Lunes a Viernes: 08:00 a 17:00 hs."
  ],
  [
    "Características",
    "Servicio Alimentario",
    "Desayuno y Almuerzo"
  ],
  [
    "Introducción",
    "Trayectoria académica",
    "La trayectoria académica consta de 6 años, divididos en tres ciclos formativos con clases en entornos técnicos diseñados y educación física en nuestro microestadio."
  ],
  [
    "Ciclos",
    "Ciclo Inicial (1° y 2°):",
    "Fundamentos técnicos y formación general."
  ],
  [
    "Ciclos",
    "Ciclo Intermedio (3° y 4°):",
    "Introducción a la especialidad elegida."
  ],
  [
    "Ciclos",
    "Ciclo Superior (5° y 6°):",
    "Profesionalización y Proyectos finales."
  ],
  [
    "Materias por año",
    "Primer Año",
    "Lengua e Inglés\nHistoria y Geografía\nConstrucción de la Ciudadanía\nArtes y Educación Física\nBiología y Matemática\nSistemas Tecnológicos\nTecnologías de la Fabricación\nPensamiento Computacional"
  ],
  [
    "Materias por año",
    "Segundo Año",
    "Lengua e Inglés\nHistoria y Geografía\nConstrucción de la Ciudadanía\nArtes y Educación Física\nBiología y Físico-Química\nMatemática\nSistemas Tecnológicos\nTecnologías de la Fabricación\nPensamiento Computacional"
  ],
  [
    "Materias por año",
    "Tercer Año",
    "Lengua, Inglés e Historia\nGeografía y Ciudadanía\nEducación Física\nBiología, Física y Matemática\nTecnologías de Representación\nTecnología de Control\nAlgoritmos y Programación"
  ],
  [
    "Aviso de orientación",
    "A partir de aquí se elige la orientación.",
    ""
  ],
  [
    "Título especializaciones",
    "CICLO SUPERIOR: ESPECIALIZACIONES (4°, 5° y 6°)",
    ""
  ],
  [
    "Título Mecatrónica",
    "Técnico/a en MECATRÓNICA",
    ""
  ],
  [
    "Mecatrónica",
    "4to Año: Materias Específicas",
    "Automatización\nElectrónica y Circuitos Eléctricos\nElectrónica Digital"
  ],
  [
    "Mecatrónica",
    "5to Año: Materias Específicas",
    "Electrónica de Potencia\nSistemas Mecánicos\nDiseño Tecnológico y Fabricación"
  ],
  [
    "Mecatrónica",
    "6to Año: Materias Específicas",
    "Control de Máquinas y Accionamientos\nAutomatización Hidráulica\nDispositivos Mecatrónicos"
  ],
  [
    "Título TIC",
    "Técnico/a en TIC",
    ""
  ],
  [
    "TIC",
    "4to Año: Materias Específicas",
    "Arquitectura de Computadoras\nRedes de Datos\nLógica Computacional"
  ],
  [
    "TIC",
    "5to Año: Materias Específicas",
    "Gestión de Bases de Datos\nDiseño de Software\nDiseño Multimedial"
  ],
  [
    "TIC",
    "6to Año: Materias Específicas",
    "Programación Web\nDesarrollo de Sistemas\nSistemas Operativos y Redes"
  ],
  [
    "Materias comunes",
    "Ambas especialidades incluyen:",
    "Matemática, Inglés, Lengua, Taller de Proyecto y Prácticas Profesionalizantes."
  ]
],
  'condiciones-de-postulacion': [
  [
    "Preguntas",
    "¿Es obligatorio realizar el Curso de Ingreso?",
    "Sí. Para ingresar a la ETEC es necesario asistir al Curso de Ingreso, rendir sus seis evaluaciones y formar parte del orden de mérito."
  ],
  [
    "Preguntas",
    "¿Cómo se realiza la inscripción?",
    "La inscripción se realiza únicamente mediante el formulario publicado en este sitio web. El período de inscripción es del 1 al 26 de abril de 2026 inclusive. Se debe completar una sola inscripción por postulante."
  ],
  [
    "Preguntas",
    "¿Hay vacantes directas o anticipadas?",
    "Se contemplan las excepciones vigentes para hermanas/os de estudiantes regulares, hijas/os de trabajadoras/es de la UBA, personas con CUD y participantes del Programa Distritos Escolares del sur de la Ciudad de Buenos Aires. Sus números se asignan antes del sorteo.\nEl sorteo se realiza ante autoridades de la Escuela y escribano público. El listado completo se publica en este sitio."
  ],
  [
    "Preguntas",
    "¿Cuáles son los requisitos para postularse?",
    "• Estar cursando séptimo grado de la Ciudad de Buenos Aires o su equivalente.\n• No tener 15 años o más al finalizar el primer año de la Escuela.\n• No postularse simultáneamente a otro colegio preuniversitario de la UBA."
  ],
  [
    "Preguntas",
    "¿Cuándo se dicta el Curso de Ingreso?",
    "Del 16 de mayo al 7 de noviembre de 2026, los sábados de 8:50 a 13:20 h, de acuerdo con el cronograma escolar."
  ],
  [
    "Preguntas",
    "¿Qué materias se cursan y cómo se evalúan?",
    "Matemática, Lengua y Técnica. Se toman seis evaluaciones: dos por cada materia."
  ],
  [
    "Preguntas",
    "¿Cuál es la asistencia requerida?",
    "Es obligatorio cumplir con un mínimo del 75% de asistencia."
  ],
  [
    "Preguntas",
    "¿Cómo se informa el orden de mérito?",
    "Los resultados se publican en este sitio una vez procesadas las evaluaciones del Curso de Ingreso."
  ]
],
  genero: [
    ['Información principal', 'OFICINA DE ASISTENCIA CONTRA LA VIOLENCIA DE GÉNERO, ACOSO SEXUAL Y DISCRIMINACIÓN', 'ETEC UBA (ODVDG)'],
    ['Misión', 'Nuestra misión', 'Garantizar un ambiente libre de discriminación, hostigamiento o violencia por razones de identidad sexual, género u orientación sexual.'],
    ['Responsable', 'RESPONSABLE', 'Dra. Ruiz Alejandra Judith'],
    ['Ubicación', 'UBICACIÓN', 'Av. Coronel Roca 4635, P.B.\nEdificio ETEC UBA'],
    ['Horarios', 'HORARIOS DE ATENCIÓN', 'Lunes y Jueves\nde 9:30 a 14:30 hs.'],
    ['Contacto', 'CONTACTO DIRECTO', 'referentegenero@etec.uba.ar'],
    ['Formación', 'Perspectiva educativa y formativa', 'Capacitamos a toda la comunidad educativa en prevención de violencias y acompañamos a quienes realicen una denuncia. Res. CS 4043/15 y 8548/17.'],
    ['Contacto', '¿Necesitás comunicarte?', 'Cualquier estudiante, docente o no docente del colegio puede escribirnos. Nuestro equipo responderá a la brevedad para coordinar una entrevista.\nMarco de absoluta confidencialidad garantizado.'],
    ['Normativas', 'Normativas y Resoluciones', 'Resolución CS 1918/19 — Protocolo de Acción\nResolución CS 8548/17 — Lineamientos Escuelas Secundarias UBA'],
    ['Medios', 'Póster informativo', 'https://etec.uba.ar/wp-content/uploads/2025/03/Captura-de-pantalla-2025-03-31-120852.png | Información sobre violencia de género, asistencia y denuncias'],
  ],
  'recursos-humanos': [
    ['Introducción', 'Recursos Humanos', 'Gestión administrativa para la Comunidad Educativa'],
    ['Autogestión UBA', 'Autogestión UBA', '¿Cómo obtener mi cuenta UBA.AR?\nProblemas de inicio de sesión'],
    ['Legajo Digital', 'Legajo Digital (TAD)', 'Instructivo TAD\nGuía de trámite\nDDJJ Familiares\nDDJJ Cargos'],
    ['Justificaciones Médicas', 'Justificaciones Médicas', '1. Solicitar pedido | Enviá un correo a pedidosmedicos@etec.uba.ar indicando tu nombre, DNI y síntomas.\n2. Informar licencia | Comunicá el número de pedido a licenciasdocentes@etec.uba.ar y enviá una copia a Regencia.\n3. Justificar | Presentate en el primer subsuelo del Hospital de Clínicas, entre las 8:30 y las 14:30, dentro del plazo de 10 días corridos.'],
    ['Justificaciones Médicas', 'Advertencia', 'Evite descuentos: las licencias de corto tratamiento son presenciales. En largo tratamiento puede asistir un representante.'],
    ['Postulaciones', '¿Querés sumarte?', 'Envíanos tu CV actualizado para formar parte de nuestra comunidad. postulacionesRRHH@etec.uba.ar'],
  ],
  ingreso: [
    ['Presentación', 'Presentación del Curso de Ingreso', 'El Curso de Ingreso de la Escuela Técnica de la UBA promueve una enseñanza colectiva, empática y centrada en los vínculos humanos.'],
    ['Pilares', 'Enseñanza · Investigación · Extensión', 'La educación es un derecho y la universidad pública tiene una responsabilidad social irrenunciable.'],
    ['Calidad Educativa y Diversidad', 'Calidad Educativa y Diversidad', 'La diversidad es una dimensión esencial de toda práctica educativa inclusiva.'],
    ['Propuesta', 'Nuestra propuesta', 'Las relaciones pedagógicas son el eje del aprendizaje y de la producción colectiva de conocimiento.'],
    ['Cierre', 'Continuidad', 'Desde 2024, asumimos el valor irrenunciable de que niñas y niños disfruten de un espacio en el que aprendan, jueguen, interactúen y crezcan en esta etapa de transformaciones.'],
  ],
  'reglamento-convivencial': [
    ['Introducción', 'Introducción', 'Este reglamento tiene como objetivo regular las relaciones entre\\nlos miembros de la Comunidad Educativa.\\nEl óptimo resultado de la labor encarada dependerá del grado de\\ncompromiso con que cada integrante de la Comunidad Educativa asuma\\nla responsabilidad que le corresponda en función del rol que\\ndesempeña, enmarcado en los lineamientos precedentes.\\nSe debe considerar el ámbito de aplicación de este Reglamento el\\nespacio del Establecimiento como así también la cuadra de este sobre\\nambas veredas, incluyendo cualquier actividad curricular\\nadministrada por la Escuela desarrollada fuera del ámbito escolar.\\nEsta consideración no excluye la preocupación permanente de la\\nComunidad Educativa por todo aquello que le concierne, aun fuera\\ndel ámbito mencionado precedentemente.'],
    ['De la Representación Escolar', 'De la Representación Escolar', 'La representación de los/las alumnos/as ante las autoridades\\nescolares será ejercida por los padres, encargado/a/s, tutores o\\nrepresentantes legales y en caso de impedimento transitorio de\\néstos, por quien se designe a tal efecto conforme con las normas\\nlegales y las disposiciones de este Reglamento.\\nSe reconocerá como encargado/a/s de la representación de\\nalumnos/as a toda persona mayor de edad que fuera designada\\nexpresamente por los representantes legales del/la alumno/a,\\nmediante comunicación escrita dirigida al Rector. El/la\\nencargado/a debe registrar su firma dentro de las cuarenta y ocho\\nhoras de ser reconocido/a como tal por las autoridades.\\nLos/las representantes de los/las alumnos/as tienen la obligación\\nde notificarse de las comunicaciones que se les hiciese llegar\\nrelacionadas con sus representados/as dentro de las cuarenta y\\nocho horas de recibidas. Su cumplimentación evitará las sanciones a\\nlas que pudieran hacerse pasibles los/las alumnos/as, de acuerdo\\ncon las disposiciones de este Reglamento.\\nLos/las representantes se abstendrán de efectuar aclaraciones o\\nsalvedades en las notas o documentos recibidos.\\nLos padres, tutores o encargados/as deben tomar las previsiones\\nnecesarias para que sus hijos/as o menores a su cargo, en caso de\\nausencias momentáneas, no queden sin representación autorizada ante\\nlas autoridades del Establecimiento.\\nEn todos los casos, los/las representantes de los/las alumnos/as\\nque deseen informarse sobre cualquier situación de su interés de\\nlos/las alumnos/as a su cargo, lo harán ante la Vicerrectoría y/o\\nRector.\\nLas peticiones o comunicaciones de los/las representantes a las\\nautoridades escolares deben dirigirse a la Rectoría o en su defecto\\na la Vicerrectoría.\\nComenzadas las clases no se permitirá a ningún/a alumno/a retirarse\\nantes de la finalización de la jornada escolar, salvo por\\ndisposición de Servicios Médicos o solicitud de los padres,\\nrepresentantes o personas autorizadas.\\nLos/las alumnos/as que por causas ineludibles deban retirarse de la\\nEscuela antes de la finalización de la jornada escolar, lo harán en\\ncompañía de sus padres, representantes legales o, en su defecto,\\npor personas debidamente autorizadas. Podrán retirarse sin la\\npresencia de un adulto responsable mediante autorización por nota\\ncuya firma debe coincidir con la registrada en la Escuela. En tales\\ncircunstancias se computarán las inasistencias correspondientes.\\nLas inasistencias y la falta de puntualidad incurridas por los/las\\nalumnos/as se comunicarán a los padres o representantes legales,\\nlas cuales son registradas en el Registro en poder de los\\npreceptores.'],
    ['De la Asistencia y Presentación', 'De la Asistencia y Presentación', 'Inasistencia\\n1.\\nLa inasistencia por cualquier causa a 15 días de clase hará perder\\nal/a la alumno/a su condición de regular. Para obtener su\\nreincorporación ésta deberá ser solicitada en forma personal por su\\npadre, madre, tutor o encargado, acompañando nota explicativa respecto\\na los motivos de las inasistencias. Cumplidos estos requisitos, el/la\\nalumno/a será reincorporado sin excepción.\\n2.\\nLa inasistencia por cualquier causa a 25 días de clase durante el\\nperíodo lectivo hará perder al/a la alumno/a su condición de regular.\\nEste tope, a criterio de la Rectoría, podrá ampliarse hasta un máximo de\\n5 faltas más. En este caso la solicitud de reincorporación deberá ser\\nacompañada de certificados que justifiquen las inasistencias.\\n3.\\nEn casos de accidentes, enfermedades de largo tratamiento, maternidad\\ny/o lactancia certificados por profesional competente, la Rectoría\\npodrá otorgar un máximo de 30 días más, presentando los certificados\\nque justifiquen las inasistencias, no perdiéndose en este caso la\\ncondición de alumno/a regular.\\nOtras situaciones excepcionales serán consideradas por la Rectoría.\\nLa solicitud de reincorporación, firmada por el padre, madre o\\nrepresentante legal deberá presentarse personalmente dentro de las 72\\n(setenta y dos) horas de notificada la pérdida de regularidad. Durante\\nese lapso, el/la alumno/a deberá seguir concurriendo a clase hasta que\\nla misma sea aceptada o denegada.\\n4.\\nLa inasistencia a clase se computará como 1 (una) falta. La falta de\\npuntualidad de hasta 15 (quince) minutos de iniciadas las clases se\\ncomputará como media inasistencia, excepto que ésta se encuentre\\ndebidamente justificada.\\nPasado ese tiempo, el/la alumno/a ingresará a clase computándose una\\ninasistencia. Pasada la primera hora podrá ingresar a clase, previa\\nautorización de Vicerrectoría, desde la que se notificará a los padres,\\ntutores y/o encargado/a/s de la situación, computándose una\\ninasistencia por tarde.\\nEn caso contrario permanecerá en el establecimiento hasta ser\\nretirado/a por sus padres, tutores y/o encargado/a/s o hasta la\\nfinalización del turno.\\n5.\\nLa inasistencia a cualquier asignatura dictada a contraturno se\\ncomputará como media falta. No se computará más de una falta por día.\\n6.\\nNo se computará inasistencia durante los 5 días hábiles posteriores al\\nfallecimiento de un familiar directo (padre, madre, hermano/a,\\nabuelo/a), quedando a consideración de la Vicerrectoría otros casos.\\n7.\\nNo se computará inasistencia por trámite de D.N.I.\\n8.\\nNo se computará inasistencia a los/las alumnos/as de 6° año que\\nrealicen el viaje de egresados durante el lapso del mismo y hasta un\\nmáximo de 8 días hábiles. En el supuesto de que la división lleve a\\ncabo el viaje en grupos distintos y en diferentes fechas, se\\nconsiderará “fecha del viaje de la división” aquella en la que concurra\\nla mayor cantidad de alumnos/as. Durante esa fecha, los/las alumnos/as\\nque no lo efectivizaron no concurrirán a clase.\\n9.\\nLa presencia del/de la alumno/a en la Escuela supone la obligación de\\nasistir a clase y permanecer en el aula, salvo autorización expresa del\\nVicerrector y/o Regente. No se admitirá la concurrencia a clases\\naisladas.\\nPresentación\\nLa presentación de los/las alumnos/as y adultos/as debe considerar el\\ncuidado de los aspectos relacionados con la higiene personal. La\\nvestimenta debe adecuarse al espacio, circunstancias y objetivos de la\\nvida escolar.'],
    ['Conductas Transgresoras de los Alumnos a las Reglas de Convivencia', 'Conductas Transgresoras de los Alumnos a las Reglas de Convivencia', 'Se consideran conductas transgresoras a las reglas de convivencia por\\nparte de los alumnos:\\nCausar agresiones físicas, verbales, psicológicas, escritas y/o de\\ncualquier tipo y por cualquier medio, en particular o masivamente, a\\ncualquiera de los integrantes de la Comunidad Educativa.\\nAtacar, ofender o agraviar los símbolos patrios y las instituciones\\ndemocráticas.\\nDestruir y/o deteriorar las instalaciones y material de la Comunidad\\nEducativa: mobiliario, equipos, afiches, paredes y elementos de la\\nEscuela.\\nFumar, ingerir bebidas alcohólicas, consumir drogas ilícitas o lícitas\\ny/o cualquier otro tipo de sustancias tóxicas, exhibirlas, promocionar\\nsu consumo y/o comercializarlas.\\nPortar armas de cualquier tipo, objetos punzantes o cualquiera de otra\\níndole, incluso cuando éstas no estén en condiciones de ser utilizadas\\npara sí o para terceros. Tampoco se permite la portación de réplicas de\\nlas mismas.\\nRealizar apuestas por dinero o de cualquier otra índole.\\nRetirarse de clase y/o del Establecimiento sin autorización.\\nFalsificar cualquier tipo de documentación.\\nPromover desórdenes dentro del Establecimiento.\\nInterferir el normal desarrollo de las clases.\\nNo respetar las normas de presentación.\\nNo presentar la documentación requerida en tiempo y forma.\\nPromover y/o realizar discriminación religiosa, racial, ideológica,\\nsexual o de cualquier otro tipo.\\nAmenazar, calumniar, injuriar o extorsionar a cualquier miembro de la\\nComunidad Educativa.'],
    ['Derechos de los Alumnos', 'Derechos de los Alumnos', 'Son derechos de los alumnos:\\nQue se conozcan y se respeten los derechos establecidos en la\\nConvención sobre los Derechos del Niño, la Declaración de los Derechos\\ndel Niño y la Ley 114 sobre los Derechos de Niñas, Niños y\\nAdolescentes del Gobierno de la Ciudad de Buenos Aires.\\nAsociarse libre y voluntariamente participando en el Centro de\\nEstudiantes y/o agrupaciones similares.\\nPlantear los problemas que surjan de su actividad escolar y peticionar\\nindividual o colectivamente por escrito, efectuando las presentaciones\\nque estimen corresponder a las autoridades pertinentes.\\nNo ser obligados a declarar contra sí mismos/as, contra\\ncondiscípulos/as y/o cualquier integrante de la Comunidad Educativa.\\nConocer los objetivos, contenidos programáticos y criterios de\\nevaluación de cada asignatura explicitados por el profesor, como así\\ntambién la devolución personal e individual de las evaluaciones.\\nPoder desarrollar sin interferencias el proceso de\\nenseñanza-aprendizaje.\\nRendir en turnos de exámenes de acuerdo al calendario escolar, no más\\nde dos materias por día. En el caso de que se superpongan más de dos\\nmesas se arbitrarán los mecanismos para evitar tal situación.\\nRealizar tareas inherentes a las actividades del Centro de Estudiantes\\nen el turno y/o contraturnos con la autorización de la Rectoría y/o\\nVicerrectoría.\\nTener un delegado, vocero o representante y su suplente por curso ante\\nel Consejo de Convivencia escolar y ante el Centro de Estudiantes,\\nquienes podrán concurrir, aun en horarios de clase, a las reuniones de\\ndelegados autorizadas por la Rectoría y/o Vicerrectoría. La presencia\\nen las mismas no los releva de sus obligaciones académicas.'],
    ['De las Sanciones', 'De las Sanciones', 'A cada falta le corresponde una sanción acorde con su gravedad. Se\\nentiende por sanción a la instancia que permita la reflexión conjunta\\nsobre el comportamiento inadecuado, buscando la modificación de la\\nconducta a partir de la toma de conciencia real de la falta cometida y\\nla asunción de un profundo compromiso por parte del o los alumnos\\ninvolucrados en la situación.\\nAnte una situación susceptible de sanción, corresponde:\\nTomar distancia, objetivando la situación.\\nAnalizar la situación conflictiva, lo que supone pensar en el contexto\\ny en las variables que han intervenido.\\nPromover la reflexión en el/la alumno/a y/o grupo:\\nDetallar la situación.\\nDar un espacio de participación.\\nPreguntar.\\nEscuchar.\\nAsegurar que la situación sea explicada por escrito, formulando los\\ndescargos correspondientes.\\nDiscernir si corresponde o no una sanción:\\nDiscernir qué clase de falta es.\\nContextualizar la falta en función de agravantes y atenuantes:\\nantecedentes del año, asunción de la responsabilidad, etc.\\nExplicar la decisión y su fundamento. Es imprescindible comunicar a\\nlas partes involucradas la decisión y sus razones para marcar la\\ntransgresión a la norma y reflexionar sobre el límite que ella implica.\\nGarantizar el derecho de defensa de los estudiantes.\\nTipo de sanciones\\nObservación escrita.\\nAmonestación: se notifica por escrito al alumno y a los responsables\\ndel mismo, constando en el legajo. Luego de tres amonestaciones\\ncorresponderá aplicar suspensión/es.\\nSuspensión:\\nCon obligación de asistir a clases.\\nSin obligación de asistir a clases.\\nEn todos los casos, con excepción de la observación escrita, se\\nnotificará la sanción a las partes involucradas, con constancia en el\\nlegajo y se informará fehacientemente de la misma al padre, madre, tutor\\no encargado al hacerse efectiva, además de la mención en el boletín.\\nExpulsión.\\nResponsables de la aplicación de sanciones\\nObservación escrita\\nEl Regente o Superior.\\nAmonestación\\nEl Vicerrector o Superior.\\nSuspensión\\nEl Rector, quien recabará la opinión del Vicerrector, del profesor\\ntutor y del preceptor del curso del/de la alumno/a a sancionar.\\nExpulsión\\nEl Rector, quien recabará la opinión del Consejo de Convivencia.\\nDurante el período de resolución, el/la alumno/a pasible de expulsión\\ndeberá asistir al Establecimiento, no computándose inasistencias. No\\nobstante, el Rector puede disponer su no concurrencia si su presencia\\npudiera poner en peligro a otro miembro de la Comunidad Educativa. En\\neste caso el Rector fundamentará esta decisión al padre, madre, tutor o\\nencargado.\\nEn toda elevación de pedido de sanción deberá constar la causa que la\\norigina, la opinión fundada del solicitante y el descargo del/de la o de\\nlos/las alumnos/as.\\nA los efectos de considerar situaciones conflictivas especiales se\\nconstituirá un Consejo de Convivencia integrado por:\\nRector – Vicerrectores – Regente – Preceptor/a – Tutor/a –\\nUn integrante del DOE y 2 (dos) alumnos/as.\\nEl Consejo de Convivencia podrá ser convocado por el Rector,\\nVicerrector y/o por la mayoría de sus integrantes cuando lo consideren\\nnecesario.'],
    ['Conductas Transgresoras de los Adultos a las Reglas de Convivencia', 'Conductas Transgresoras de los Adultos a las Reglas de Convivencia', 'Causar agresiones físicas, verbales, escritas y/o de cualquier tipo y\\npor cualquier medio a cualquiera de los integrantes de la Comunidad\\nEducativa.\\nAtacar, ofender o agraviar los símbolos patrios y las instituciones\\ndemocráticas.\\nDestruir o deteriorar las instalaciones y material de la Comunidad\\nEducativa: mobiliario, equipos, afiches, paredes y elementos de la\\nEscuela.\\nFumar, ingerir bebidas alcohólicas, consumir drogas ilícitas o\\ncualquier otro tipo de sustancias tóxicas, exhibirlas, promocionar su\\nconsumo y/o comercializarlas.\\nPortar armas de cualquier tipo, incluso cuando éstas no estén en\\ncondiciones de ser utilizadas. Tampoco se permite la portación de\\nréplicas de las mismas.\\nRealizar apuestas por dinero o de cualquier otra índole.\\nFalsificar cualquier tipo de documentación.\\nRealizar malversación de fondos.\\nPromover y/o realizar discriminación religiosa, racial, ideológica,\\nsexual o de cualquier otro tipo.\\nUtilizar su influencia docente con fines de proselitismo político,\\nreligioso o para conseguir adhesiones para organizaciones, sindicatos\\no entidades de cualquier índole.\\nRealizar acoso sexual.\\nIncumplir las funciones y tareas inherentes al cargo.\\nDesconocer o no acatar las normas vigentes y las emanadas de las\\nautoridades de la Escuela.\\nGenerar alianzas y/o acuerdos con los/las alumnos/as reñidos con la\\nética.\\nPromover estilos vinculares agresivos.\\nEmplear métodos inadecuados, tales como abuso de autoridad o\\ncalificaciones como medio de control disciplinario.\\nFaltar el respeto, impedir el disenso y la expresión plural.\\nDictar clases particulares no institucionales a los alumnos del\\nestablecimiento.\\nAmenazar, calumniar, injuriar o extorsionar a cualquier miembro de la\\nComunidad Educativa.\\nEn estos casos, las sanciones serán las establecidas en las\\ndisposiciones legales y reglamentarias de aplicación, en toda normativa\\nemanada por la Universidad de Buenos Aires referente a los estatutos\\nDocentes y No Docentes en la materia.'],
    ['Publicaciones', 'Publicaciones', 'Las publicaciones periodísticas en cualquier formato, en soporte papel\\no digital, ya sea revistas, semanarios, redes sociales oficiales,\\nboletines, diarios, etc., serán de libre circulación en el ámbito de la\\nEscuela si su editor responsable lo hace como miembro de la Comunidad\\nEducativa —docente, no docente o alumno—.\\nLas mismas deberán mencionar, en forma visible e indubitable, el nombre\\ndel editor, que será el único responsable por las expresiones que\\nafecten el buen nombre, honor y derechos humanos de las personas o que\\ncontengan dibujos, fotografías o relatos de índole pornográfica. En los\\ncasos de notas, secciones o artículos firmados, la responsabilidad será\\nconcurrente del editor y del firmante.\\nToda publicación que no reúna las condiciones anteriormente descriptas\\ndeberá contar con autorización del Rector o de los Vicerrectores para su\\ncirculación en la Escuela.\\nToda publicación que no identifique a su editor responsable será\\nconsiderada no autorizada.\\nLos afiches, carteles y demás comunicaciones deberán exhibirse en los\\nlugares destinados a tales efectos, previa autorización de alguna de las\\nautoridades mencionadas.'],
    ['Centro de Estudiantes', 'Centro de Estudiantes', 'El Centro de Estudiantes constituye la legítima representación de\\nlos/las alumnos/as de la Escuela.\\nEl criterio que regule las actividades del Centro será convenido con las\\nautoridades del Establecimiento, con el fin de no afectar el normal\\ndesarrollo de la vida escolar.'],
  ],
  'reglamento-ingreso': [
    ['Características Generales', 'Características Generales', 'El ingreso a primer año de la Escuela Técnica se realiza mediante\\nun Curso de Ingreso.\\nPodrán inscribirse los y las aspirantes que actualmente estén\\ncursando 7° grado del nivel primario de la CABA o su equivalente\\nsegún su jurisdicción y que hayan aprobado 6to grado del nivel\\nprimario de la CABA o su equivalente. Los postulantes no podrán\\nsuperar los 15 años o más al finalizar el primer año de cursada en\\nla ETEC UBA.\\nLa inscripción se realiza exclusivamente a través del formulario\\nde inscripción que se encontrará disponible durante el período\\ndeterminado para la misma en la página web\\nwww.etec.uba.ar.\\nDebe completarse SOLO UN FORMULARIO por\\npostulante. No se aceptan postulaciones que no sean por esta vía.\\nEl Formulario de inscripción tiene carácter de Declaración Jurada,\\npor lo cual cualquier dato que no sea comunicado en el mismo no\\ntendrá validez luego.\\nNo se aceptarán postulaciones al Curso de Ingreso de personas que\\nse hayan inscripto a otras escuelas preuniversitarias de la\\nUniversidad de Buenos Aires.'],
    ['Acceso al Curso de Ingreso', 'Acceso al Curso de Ingreso', 'La asignación de cada cupo para el Curso de Ingreso a la ETEC UBA\\nse realizará por sorteo.\\nQuedan exceptuados del sorteo: hermanos/as de estudiantes regulares\\nde la ETEC, hijos/as de empleados/as de la UBA, quienes sean parte\\ndel “Programa Distritos Escolares” (zona sur CABA) y quienes cuenten\\ncon C.U.D. El mismo debe ser incluido en la documentación presentada\\ny estar vigente, de manera conjunta con el diagnóstico y el informe\\nmédico correspondiente.\\nEstos postulantes tendrán el acceso al Curso de Ingreso asegurado y\\nanticipado. De igual forma, deberán encontrarse en el Orden de\\nMérito de los ingresantes para obtener su vacante en la escuela, al\\nigual que el resto de los estudiantes.\\nLas y los exceptuados al ingreso por sorteo nunca podrán exceder del\\n50% del total de ingresantes al Curso de Ingreso.\\nA los fines del sorteo se le asignará a cada estudiante un número\\nde orden que surge de la totalidad de inscripciones. Esta asignación\\nse publicará en la página web de la Escuela previo a la realización\\ndel sorteo.\\nEl sorteo se realizará en presencia del Equipo Directivo del\\nestablecimiento y ante Escribano Público. La fecha será comunicada\\na través de las redes sociales de la escuela y la página web de la\\ninstitución:\\nwww.etec.uba.ar.\\nUna vez realizado el sorteo, se informará a través de la página web\\nquiénes son los postulantes que han salido sorteados y que han\\nobtenido así la posibilidad de acceder al Curso de Ingreso.\\nPrevio al comienzo de la cursada se realizará una reunión de\\npadres, madres o tutores que es de carácter obligatorio. En este\\nmomento se deberá entregar la Constancia de Alumno Regular de 7mo\\ngrado o su equivalente, fotocopia de DNI actualizada del postulante\\ny firmar las autorizaciones que requiere la escuela.'],
    ['Sobre el Curso de Ingreso', 'Sobre el Curso de Ingreso', 'El Curso de Ingreso se dictará los sábados de 8:50 a 13:20 h en la\\nEscuela.\\nLas puertas del establecimiento se abrirán a las 8:15 para aquellos\\nestudiantes que deseen desayunar.\\nEl retiro de los/as estudiantes del establecimiento deberá\\nrealizarse exclusivamente en compañía de personas debidamente\\nautorizadas —mayores de edad—, sin excepción, salvo en aquellos\\ncasos en que cuenten con autorización expresa para retirarse por sus\\npropios medios.\\nCuando el retiro tenga lugar durante el horario de clases, será\\nobligatoria la presencia de una persona autorizada a tal efecto.\\nEl Curso de Ingreso tendrá una duración de 6 meses, quedando\\nexcluidos los feriados, fines de semana largos y el receso de\\ninvierno.\\nSe deberá contar con una asistencia mínima del 75% y cumplir con\\ntodas las instancias de evaluación.\\nNo se deberán superar las 3 faltas consecutivas sin estar\\ndebidamente justificadas mediante certificado.\\nSe podrán recuperar algunas de las evaluaciones en caso de ausencia\\npor salud o viaje. La ausencia deberá ser justificada por medio de\\nun certificado que se entregará apenas el/la estudiante concurra al\\nestablecimiento.\\nLas evaluaciones y su corrección serán anónimas y la calificación\\nobtenida por los aspirantes se pondrá en conocimiento de los\\npadres, madres o tutores legales mediante un boletín que se le dará\\nal estudiante según el cronograma que se comunicará.\\nMadres, padres o tutores legales tendrán acceso a sus pruebas en el\\námbito de la escuela dentro del período establecido por el\\ncronograma, previa solicitud de cita enviada por correo a\\ncursoingreso@etec.uba.ar\\n.\\nLa calificación que asigne el coordinador/a del área respectiva será\\nirrecurrible.'],
    ['Asistencia y Disciplina', 'Asistencia y Disciplina', 'Cada aspirante deberá cumplir con un 75% de asistencia.\\nAl momento de comenzar el Curso de Ingreso, el o la estudiante que\\nse ausente durante las 2 primeras clases injustificadamente perderá\\nsu vacante.\\nEl/la estudiante no podrá tener más de 3 faltas consecutivas\\ninjustificadas durante la cursada. Si esto sucediera, quedará\\nautomáticamente fuera del Curso.\\nLos/las aspirantes deberán cumplir las indicaciones de los/las\\ndocentes y preceptores.\\nDurante el desarrollo de las clases no podrán permanecer fuera de\\nlas respectivas aulas, salvo que como excepción se los autorice\\nexpresamente a estar temporalmente en otro sitio.\\nEstá prohibido el uso de celulares o cualquier dispositivo\\nelectrónico por parte de los/las aspirantes dentro de las aulas,\\nexcepto que el docente lo permita expresamente.\\nLa presentación de los/as alumnos/as y adultos/as debe considerar\\nel cuidado de los aspectos relacionados con la higiene personal. La\\nvestimenta debe adecuarse al espacio, circunstancias y objetivos de\\nla vida escolar.\\nLos/las aspirantes serán alcanzados, supletoriamente, por el régimen\\nde convivencia y disciplina del establecimiento mencionado al\\nfinalizar este documento.\\nLa Coordinación General del Curso de Ingreso resolverá toda cuestión\\nno contemplada en este reglamento.'],
    ['Obtención de vacantes para la ETEC', 'Obtención de vacantes para la ETEC', 'Al momento de ingresar como alumno regular de 1er año, el aspirante\\ndebe tener aprobado el ciclo de primaria completo o su equivalente\\ny no tener 15 años o más al finalizar el primer año de cursada en la\\nETEC UBA.\\nLas vacantes previstas para el ingreso al primer año de la ETEC se\\nasignarán a aquellos/as postulantes que cumplan con la asistencia\\nmínima del 75% al Curso de Ingreso y tengan los mejores puntajes,\\nque responden a la sumatoria de los exámenes de las tres asignaturas\\ndictadas: Matemática, Lengua y Técnica.\\nCada una de las áreas tendrá una primera evaluación, siendo la mayor\\npuntuación 40 puntos.\\nLas y los estudiantes tendrán una segunda tanda de evaluaciones en\\nlos tres campos de conocimiento, con un puntaje máximo de 60 puntos\\npara cada uno de los exámenes.'],
    ['Conductas Transgresoras a las Reglas de Convivencia', 'Conductas Transgresoras a las Reglas de Convivencia', 'Se consideran conductas transgresoras a las reglas de convivencia\\npor parte de los/las estudiantes:\\nCausar agresiones físicas, verbales, psicológicas, escritas y/o de\\ncualquier tipo y por cualquier medio, en particular o\\nmasivamente, a cualquiera de los/las integrantes de la Comunidad\\nEducativa.\\nAtacar, ofender o agraviar los símbolos patrios y las\\ninstituciones democráticas.\\nDestruir y/o deteriorar las instalaciones y material de la\\ncomunidad educativa —moblaje, equipos, afiches, paredes y\\nelementos de la Escuela—.\\nFumar, ingerir bebidas alcohólicas, consumir drogas y/o cualquier\\notro tipo de sustancias tóxicas, exhibirlas, promocionar su\\nconsumo y/o comercializarlas.\\nPortar armas de cualquier tipo, objetos punzantes o cualquiera de\\notra índole, incluso cuando no estén en condiciones de ser\\nutilizadas para sí o para terceros. Tampoco se permite la\\nportación de réplicas de estas.\\nRealizar apuestas por dinero o de cualquier otra índole.\\nRetirarse de clase y/o del establecimiento sin autorización.\\nFalsificar cualquier tipo de documentación.\\nPromover desórdenes dentro del establecimiento.\\nInterferir el normal desarrollo de las clases.\\nNo presentar la documentación requerida en tiempo y forma.\\nPromover y/o realizar discriminación religiosa, racial,\\nideológica, sexual o de cualquier otro tipo.\\nAmenazar, calumniar, injuriar o extorsionar a cualquier miembro de\\nla Comunidad Educativa.'],
  ],
  rematriculacion: [
    ['Introducción', 'Información de rematriculación', 'Para solicitar la rematriculación en el ciclo lectivo vigente, los estudiantes de 2do. a 6to. año deben completar y presentar la documentación correspondiente.'],
    ['Documentación', 'Documentación para descargar', 'Ficha individual del Alumno y Alumna | https://etec.uba.ar/wp-content/uploads/2025/11/Ficha-individual-del-ALumno-y-Alumna.pdf\nAutorización de Retiro Alumnos y Alumnas | https://etec.uba.ar/wp-content/uploads/2025/12/Autorizacion-de-Retiro-2026.pdf\nFicha de Salud | https://etec.uba.ar/wp-content/uploads/2025/12/Ficha-de-Salud.pdf\nAutorización de publicación de Imágenes | https://etec.uba.ar/wp-content/uploads/2025/11/Autorizacion-de-publicacion-de-Imagenes-1.pdf\nRégimen de convivencia | https://etec.uba.ar/wp-content/uploads/2025/12/Regimen-de-convivencia.pdf'],
    ['Aviso de presentación', 'Fecha límite y condición', 'La documentación debe presentarse al/a la preceptor/a correspondiente antes del 27 de marzo del ciclo lectivo vigente. Los estudiantes que no presenten dicha documentación no formalizarán su matriculación.'],
  ],
  'beca-ricardo-rojas': [
    ['Presentación', 'Ayuda económica para tu formación secundaria', 'Beca “Rector Ricardo Rojas”\nGarantizamos tu derecho a la educación brindando apoyo a estudiantes en situación de vulnerabilidad socioeconómica.'],
    ['Requisitos', 'Requisitos de Postulación', '🏫 Ser alumno regular de colegios dependientes de la UBA.\n🇦🇷 Tener nacionalidad argentina o residencia permanente.\n🚫 No poseer otra beca de monto similar o superior.\n📄 Acreditar dificultades socioeconómicas ante la Dirección de Becas.'],
    ['Postulación', '¿Cómo postularse?', 'La postulación es anual y se realiza de forma digital.\nhttps://tramitesadistancia.uba.ar/ | Ir a Trámites a Distancia (TAD)'],
    ['Aviso', 'Información importante', '📢 Las fechas se informarán con un mes de anticipación.\n📍 ¿Dudas? Acercate a la oficina de Extensión y Bienestar Estudiantil.'],
  ],
  contrataciones: [
    ['Encabezado', 'Licitaciones Vigentes 2026', 'Por consultas dirigirse a:\ncontrataciones@etec.uba.ar'],
    ['Finalizadas', 'Licitaciones Finalizadas', 'Seleccioná un año para consultar las contrataciones finalizadas.'],
    ['2026', 'CD 12-26 · FINALIZADA', 'Ganador: CONCETTI, GUILLERMO\nExpediente: EX-2026-04651834- -UBA-SEMEA#ETEC\nContratación del servicio de 1 micro de larga distancia para 60 pasajeros – Viaje de egresados a Villa La Angostura (Neuquén)\nApertura: 25 de agosto, 2026\nPDF: https://etec.uba.ar/wp-content/uploads/2026/08/Solicitud-de-cotizacion-CD-12-26.pdf | Ver Pliego'],
    ['2026', 'TS 56-26 · FINALIZADA', 'Ganador: ASCENSORES TECFRA S.R.L. (CUIT 30-71825520-8)\nExpediente: —\nContratación del servicio de mantenimiento básico, conservación e inspección técnica del ascensor\nApertura: 12 de agosto, 2026\nPDF: https://etec.uba.ar/wp-content/uploads/2026/08/Solicitud-de-cotizacion-TS-56-26.pdf | Ver Pliego'],
    ['2026', 'TS 38-26 · FINALIZADA', 'Ganador: FISCHETTI y CIA. S.R.L. (33-54146376-9)\nExpediente: EX-2026-02494322- -UBA-SEMEA#ETEC\nAdquisición de agua en botellones y dispensers en Comodato\nApertura: 29 de Mayo, 2026\nPDF: https://etec.uba.ar/wp-content/uploads/2026/05/Solicitud-de-cotizacion-TS-38-26.pdf | Ver Pliego'],
    ['2026', 'CD 05-26 · FINALIZADA', 'Ganador: MATCH POINT TRAVEL S.R.L. (30-71495876-7)\nExpediente: EX-2026-01856978- -UBA-SEMEA#ETEC\nServicio de Micros para 75 Pasajeros (Ida y Vuelta)\nApertura: 23 de Abril, 2026\nPDF: https://etec.uba.ar/wp-content/uploads/2026/04/Solicitud-de-cotizacion-CD-05-26.pdf | Ver Pliego'],
    ['2026', 'TS 16-26 · FINALIZADA', 'Ganador: AGUADIRECT – PABLO PEREIRA (20-24775583-8)\nExpediente: EX-2026-01682833- -UBA-SEMEA#ETEC\nAlquiler Dispenser en Red (Ocho)\nApertura: 13 de Abril, 2026\nPDF: https://etec.uba.ar/wp-content/uploads/2026/04/Solicitud-de-cotizacion-TS-16-26.pdf | Ver Pliego'],
    ['2026', 'TS 15-26 · FINALIZADA', 'Ganador: ASCENSORES TECFRA S.R.L. (30-71825520-8)\nExpediente: EX-2026-01765969- -UBA-SEMEA#ETEC\nMantenimiento de Ascensor (Mayo-Julio)\nApertura: 15 de Abril, 2026\nPDF: https://etec.uba.ar/wp-content/uploads/2026/04/Solicitud-de-cotizacion-TS-15-26.pdf | Ver Pliego'],
    ['2025', 'TS 20-25 · FINALIZADA', 'Mantenimiento Semestral de Cisterna\nApertura: 22 de abril, 2025\nPDF: https://etec.uba.ar/wp-content/uploads/2025/04/Solicitud-de-cotizacion-GENERAL.pdf | Ver Pliego'],
    ['2025', 'TS 21-25 · FINALIZADA', 'Adquisición de Equipo de Sonido\nApertura: 21 de abril, 2025\nPDF: https://etec.uba.ar/wp-content/uploads/2025/04/Solicitud-de-cotizacion-GENERAL-1.pdf | Ver Pliego'],
  ],
  novedades: [
    ['Comunicado', 'Comunicado institucional', 'Documento institucional publicado por ETEC UBA.\nhttps://etec.uba.ar/wp-content/uploads/2026/04/Comunicado-institucional.pdf'],
  ],
  'odontologia-estudiantes': [
    ['Presentación', 'Asistencia Odontológica Gratuita', 'Brindamos atención a nuestras/os alumnas/os a través del Programa de la Facultad de Odontología – UBA.'],
    ['Atención', 'Días y horarios de atención', 'Lunes y Martes\nTurno Mañana: 9:00 a 12:00 h.\nTurno Tarde: 13:00 a 16:00 h.'],
    ['Información', 'Coordinación del servicio', 'Actividad coordinada por la Secretaría de Extensión y Bienestar Estudiantil.'],
  ],
  home: [
    ['Carrusel principal', 'Imágenes de portada', '/img/home-etec-1.jpg | Vista exterior de la ETEC\n/img/home-etec-2.jpg | Comunidad ETEC\n/img/home-etec-3.jpg | Escuela Técnica de la UBA'],
    ['Presentación', 'Texto de bienvenida', 'BIENVENIDOS A LA ESCUELA TÉCNICA DE LA UNIVERSIDAD DE BUENOS AIRES\nLa Escuela Técnica es el colegio técnico pre-universitario de la Universidad de Buenos Aires. Cuenta con más de 500 alumnos y alumnas que se forman día a día con amplios conocimientos prácticos y teóricos en TIC y Mecatrónica.'],
    ['Actividades', 'Carrusel de actividades extracurriculares', '/img/taller-radio.svg | Taller de Radio y Streaming | Un espacio para aprender a comunicar, producir contenido y crear proyectos de radio y streaming. | 02 septiembre 2024\n/img/taller-musica.svg | Taller de Ensamble Musical | Un espacio para tocar, crear y hacer música junto a tus compañeras y compañeros. | 14 junio 2024\n/img/actividad-estudiantes.jpg | Olimpiadas de Matemática Argentina | Talleres para entrenar y participar de las Olimpiadas de Matemática. | 14 junio 2024\n/img/taller-filosofia.svg | Taller de Filosofía | Un espacio para pensar, debatir y cuestionar. | 14 junio 2024\n/img/taller-voley.svg | Voley Mixto | Un espacio para jugar, aprender y compartir. | 31 mayo 2024\n/img/actividad-deporte.jpg | Fútbol Femenino | Todos los martes de 17:20 a 19 h en la ETEC. | 31 mayo 2024\n/img/actividad-taller.jpg | Taller de chino | Una oportunidad para iniciarte en uno de los idiomas más hablados del mundo. | 29 agosto 2023\n/img/actividad-angostura.jpg | Fútbol Masculino | Todos los sábados de 8:00 a 11:30 h en la ETEC. | 29 agosto 2023'],
  ],
  orientaciones: [
    ['Carrusel principal', 'Imágenes de Orientaciones', 'https://www.etec.uba.ar/wp-content/uploads/2023/08/46458017_2438900756125330_6730074836409778176_n.jpg | Comunidad ETEC\nhttps://www.etec.uba.ar/wp-content/uploads/2023/08/276160257_376095127857736_5573911097965330876_n.jpg | Proyectos y estudiantes\nhttps://www.etec.uba.ar/wp-content/uploads/2023/08/FPlkjSJWUAEJ0JL-scaled.jpeg | Formación técnica'],
    ['Introducción', 'Presentación de las orientaciones', 'La escuela cuenta con dos especialidades orientativas: Tecnologías de la Información y las Comunicaciones (TIC) y Mecatrónica. El enfoque pedagógico de ETEC es teórico – práctico.'],
    ['Especialidades', '¿Cómo se eligen las especialidades?', 'https://www.etec.uba.ar/wp-content/uploads/2023/08/FQ5N9PSWQAAcINY.jpeg | Elección de especialidad | A partir de tercer año todas las alumnas y alumnos de la ETEC pueden elegir alguna de las dos especialidades que ofrece la escuela.\nhttps://www.etec.uba.ar/wp-content/uploads/2023/08/mecatronica_01.jpg | Mecatrónica | Integra la mecánica, la electrónica, la informática y la automatización para crear sistemas y productos inteligentes.\nhttps://www.etec.uba.ar/wp-content/uploads/2023/08/programacion.jpg | Tecnologías de la Información y Comunicación (TIC) | Facilita la manipulación y transmisión de información mediante hardware, software y servicios asociados.'],
  ],
  'informacion-general': [
    ['Presentación', 'Características generales del Curso de Ingreso', 'El ingreso a primer año (1.er año) de la ETEC UBA se realiza exclusivamente a través del Curso de Ingreso, lo que garantiza un proceso transparente que evalúa a las y los aspirantes únicamente en función de sus méritos académicos.'],
    ['Aspectos relevantes', 'OBJETIVO GENERAL', 'Generar un espacio de articulación y transición del nivel primario al secundario, así como conocer y generar una base para una escuela técnica. Brindar a quienes estudiarán en la ETEC los conocimientos que favorezcan un desempeño y un tránsito satisfactorio por la escuela secundaria.'],
    ['Aspectos relevantes', 'DURACIÓN', 'El Curso de Ingreso se desarrollará los sábados desde el 16 de mayo hasta el 7 de noviembre de 2026, de 8:50 a 13:20 h, exceptuando los feriados, fines de semana largos y el receso escolar, que serán debidamente comunicados.'],
    ['Aspectos relevantes', 'QUIÉNES PUEDEN CURSAR', 'Podrán cursar quienes cumplan con los siguientes requisitos:\n• Haber participado de las instancias de inscripción y/o haber salido sorteados, o ser beneficiarios de alguna de las excepciones.\n• Concurrir a la charla de inicio del Curso de Ingreso cuando sean debidamente convocados.\n• Completar la planilla de inscripción y presentar la documentación requerida.'],
    ['Aspectos relevantes', 'DOCUMENTACIÓN REQUERIDA PARA EL CURSO DE INGRESO', '• Fotocopia del DNI actualizado del estudiante.\n• Constancia de alumno regular de séptimo grado o su equivalente.\n• Planilla completa y firmada por padre, madre o tutor, que será entregada en la charla del Curso de Ingreso.'],
    ['Aspectos relevantes', 'MATERIAS', '• Matemática.\n• Lengua.\n• Técnica: Educación Digital y Sistemas Tecnológicos.'],
    ['Aspectos relevantes', 'EVALUACIONES', 'Se toman dos evaluaciones por materia:\n• Lengua: primera evaluación de 0 a 40 puntos y segunda evaluación de 0 a 60 puntos.\n• Matemática: primera evaluación de 0 a 40 puntos y segunda evaluación de 0 a 60 puntos.\n• Técnica: primera evaluación de 0 a 40 puntos y segunda evaluación de 0 a 60 puntos.'],
    ['Aspectos relevantes', 'RECUPERATORIO', 'Solo podrán recuperar alguno de los exámenes quienes cuenten con un certificado por enfermedad —que debe incluir diagnóstico y días de reposo— o por un viaje comunicado previamente por correo a cursoingreso@etec.uba.ar y envíen documentación que lo respalde, como constancia de la escuela o pasaje.'],
    ['Aspectos relevantes', 'ASISTENCIA', 'El requerimiento mínimo es de 75% de asistencia obligatoria. No se pueden superar las tres faltas consecutivas; en ese caso se quedará automáticamente fuera del Curso de Ingreso.'],
    ['Aspectos relevantes', 'ORDEN DE MÉRITO E INGRESO A PRIMER AÑO', 'Se confeccionará una lista con quienes cumplan con la asistencia y hayan rendido los seis exámenes. En la lista figurará la palabra “INGRESANTE” para quienes estén dentro de las vacantes asignadas para el ciclo 2027.'],
    ['Aspectos relevantes', 'CLASES DE APOYO – TUTORÍAS', 'El Curso de Ingreso a la ETEC tiene clases de apoyo opcionales y no obligatorias, con modalidad virtual, dictadas por profesores de la Escuela.'],
  ],
  'actividades-extracurriculares': [
    ['Presentación', 'Actividades extracurriculares', 'La ETEC cuenta con múltiples actividades y talleres extracurriculares para estudiantes y familias. ¡Sumate al que más te guste!'],
    ['Destacados', 'Momentos destacados', '5to año en la Casita de Tucumán, 2022.\n5to año visita a la Universidad de Tucumán, 2022.\n6to año viaje a Villa La Angostura.\n5to año viaje a Tucumán.'],
    ['Actividades', 'Talleres y actividades', '/img/taller-radio.svg | TALLER DE RADIO Y STREAMING | ¡Sumate al Taller de Radio y Streaming! Un espacio para aprender a comunicar y producir contenido. | 02 septiembre 2024\n/img/taller-musica.svg | TALLER DE ENSAMBLE MUSICAL | Un espacio para tocar, crear y hacer música junto a tus compañeros. | 14 junio 2024\n/img/actividad-estudiantes.jpg | TALLER DE OLIMPIADAS DE MATEMÁTICA ARGENTINA | Talleres para entrenar a las alumnas y alumnos que participan de las Olimpiadas. | 14 junio 2024\n/img/taller-filosofia.svg | TALLER DE FILOSOFÍA | Un espacio para pensar, debatir y cuestionar. | 14 junio 2024\n/img/taller-voley.svg | VOLEY MIXTO | Un espacio para jugar y compartir. | 31 mayo 2024\n/img/actividad-deporte.jpg | FÚTBOL FEMENINO | Todos los martes de 17:20 a 19 h en la ETEC. | 31 mayo 2024\n/img/actividad-taller.jpg | TALLER DE CHINO | Un espacio para acercarse a la lengua y cultura china. | 29 agosto 2023\n/img/actividad-angostura.jpg | FÚTBOL MASCULINO | Todos los sábados de 8:00 a 11:30 h en la ETEC. | 29 agosto 2023'],
    ['Viajes de estudio', 'Viajes de estudio', 'En la ETEC cada año se realiza un viaje de estudios distinto, con destinos como Sierra de la Ventana, Tucumán y Villa La Angostura. Son gratuitos y combinan actividades recreativas y formativas.'],
  ],
  'semana-tecnica': [
    ['Presentación', 'Semana Técnica', 'Es la semana donde los alumnos muestran diferentes proyectos que fueron armando durante el año. Tanto los estudiantes de Mecatrónica como los de TICs exponen y explican sus proyectos.'],
    ['Carrusel', 'Galería de la Semana Técnica', '/img/actividad-estudiantes.jpg | Estudiantes presentando sus proyectos | Exposición y aprendizaje compartido\n/img/home-etec-1.jpg | Trabajo en equipo | Proyectos que se construyen durante todo el año\n/img/home-etec-2.jpg | Comunidad ETEC | Ideas, tecnología y creatividad\n/img/actividad-taller.jpg | Experiencias técnicas | Mecatrónica y TICs en acción\n/img/home-etec-3.jpg | Una semana para compartir | Cada proyecto tiene una historia'],
    ['Cierre', 'Una escuela que crea y comparte', 'La Semana Técnica es una oportunidad para mostrar el recorrido de cada curso, intercambiar conocimientos y acercar a las familias y a la comunidad los proyectos que se realizan en la ETEC.'],
  ],
  calendario: [
    ['CURSADA REGULAR', 'Comienzo de ciclo lectivo de 1° año', '9 de Marzo'],
    ['CURSADA REGULAR', 'Comienzo de ciclo lectivo de 2° a 6°', '16 de Marzo'],
    ['CURSADA REGULAR', 'Comienzo de 1° bimestre', '16 de Marzo'],
    ['CURSADA REGULAR', 'Fin de 1° bimestre', '8 de Mayo'],
    ['CURSADA REGULAR', 'Comienzo de 2° bimestre', '11 de Mayo'],
    ['CURSADA REGULAR', 'Carga de notas en Fígaro (nota nominal)', '11 al 13 de Mayo'],
    ['CURSADA REGULAR', 'Entrega de informes 1° bimestre', '15 al 21 de Mayo'],
    ['CURSADA REGULAR', 'Fin de 2° bimestre', '3 de Julio'],
    ['CURSADA REGULAR', 'Carga de notas en el Fígaro (nota numérica)', '6 al 8 de Julio'],
    ['CURSADA REGULAR', 'Inscripción a Mesa de Examen para egresados', '30 de Junio al 3 de Julio'],
    ['CURSADA REGULAR', 'Comienzo de 3° bimestre', '6 de Julio'],
    ['CURSADA REGULAR', 'Entrega de informes del 1° cuatrimestre', '13 al 17 de Julio'],
    ['CURSADA REGULAR', 'Mesa de examen para previas (con suspensión de clases)', '13 al 17 de Julio'],
    ['CURSADA REGULAR', 'RECESO ESCOLAR', '20 DE JULIO AL 31 DE JULIO'],
    ['CURSADA REGULAR', 'Fin de 3° bimestre', '11 de Septiembre'],
    ['CURSADA REGULAR', 'Comienzo de 4° bimestre', '14 de Septiembre'],
    ['CURSADA REGULAR', 'Carga de notas en el Fígaro (nota nominal)', '14 de Septiembre al 16 de Septiembre'],
    ['CURSADA REGULAR', 'Entrega de informes 3° bimestre', '17 al 18 de Septiembre'],
    ['CURSADA REGULAR', 'Semana de la Educación Técnica', '9 al 13 de Noviembre'],
    ['CURSADA REGULAR', 'Fin de 4° bimestre. Cierre de notas', '18 de Noviembre'],
    ['CURSADA REGULAR', 'FIN DE 2° CUATRIMESTRE. ÚLTIMO DÍA DE CLASES PARA LOS ESTUDIANTES QUE NO ADEUDAN MATERIAS', '18 de Noviembre'],
    ['CURSADA REGULAR', 'Carga de notas en el Fígaro (nota numérica)', '19 al 20 de Noviembre'],
    ['CURSADA REGULAR', 'Entrega de informes 4° bimestre', '23 de Noviembre'],
    ['CURSADA REGULAR', 'Inicio de período de recuperación', '24 de Noviembre al 7 de Diciembre'],
    ['CURSADA REGULAR', 'Inscripción para mesas de examen de exalumnos', '30 de Noviembre al 2 de Diciembre'],
    ['CURSADA REGULAR', 'Mesa de examen para todo el alumnado', '9 al 15 de Diciembre'],
    ['CURSADA REGULAR', 'Último día de actividades 2026', '22 de Diciembre'],
    ['PROGRAMA DE RECUPERACIÓN DE MATERIAS (PREP)', 'Cursada 1° cuatrimestre', '30 de Marzo a 10 de Julio'],
    ['PROGRAMA DE RECUPERACIÓN DE MATERIAS (PREP)', 'Mesa de examen para todo el alumnado', '13 al 17 de Julio'],
    ['PROGRAMA DE RECUPERACIÓN DE MATERIAS (PREP)', 'Cursada 2° cuatrimestre', '17 de Agosto al 27 de Noviembre'],
    ['PROGRAMA DE RECUPERACIÓN DE MATERIAS (PREP)', 'Mesa de examen para todo el alumnado', '9 al 15 de Diciembre'],
    ['CURSO DE INGRESO', 'Inscripción para ciclo lectivo 2026', '1 Abril al 26 de Abril'],
    ['CURSO DE INGRESO', 'Sorteo de vacantes para ingreso', '5 de Mayo'],
    ['CURSO DE INGRESO', 'Reunión con familias', '9 de Mayo'],
    ['CURSO DE INGRESO', 'Cursada días sábados', '16 de Mayo al 7 de Noviembre'],
    ['CURSO DE INGRESO', 'Receso de invierno', '18 al 25 de Julio'],
    ['CURSO DE INGRESO', 'Revisión de Exámenes', '27 de Noviembre'],
    ['CURSO DE INGRESO', 'Publicación de orden de mérito', '30 de noviembre'],
    ['CURSO DE INGRESO', 'Reunión con familias de alumnos ingresantes', '9 de Diciembre'],
    ['JORNADAS DE PARTICIPACIÓN OBLIGATORIA', 'Jornada de Educación Ambiental Integral', '2 de Septiembre'],
    ['JORNADAS DE PARTICIPACIÓN OBLIGATORIA', 'Jornada de ESI (Educación Sexual Integral)', '3 de Junio'],
    ['JORNADAS DE PARTICIPACIÓN OBLIGATORIA', 'Torneo Deportivo Interbandos', 'Septiembre – Octubre (a definir)'],
    ['JORNADAS DE PARTICIPACIÓN OBLIGATORIA', 'Semana de la Educación Técnica', '9 al 13 de Noviembre'],
    ['JORNADAS DE PARTICIPACIÓN OBLIGATORIA', 'Jornada de mejora institucional', 'A definir'],
    ['2027', 'Reincorporación del Personal Docente', '10 de Febrero'],
    ['2027', 'Inscripción a mesas de examen para completar estudios', '10 al 14 de Febrero'],
    ['2027', 'Período de recuperación 2027', '15 al 26 de Febrero'],
    ['2027', 'Mesas de Examen para todo el alumnado', '1 al 5 de Marzo'],
    ['2027', 'Comienzo de clases regulares para 1er. año', '8 de Marzo'],
    ['2027', 'Comienzo de clases regulares de 2do. a 6to. año', '15 de Marzo'],
  ],
};

export async function cargarSeccionesAutoridades() {
  return prisma.seccionPagina.findMany({
    where: { paginaClave: 'autoridades', activo: true },
    orderBy: [{ grupo: 'asc' }, { subgrupo: 'asc' }, { orden: 'asc' }, { titulo: 'asc' }],
  });
}

export async function asegurarSeccionesAutoridades() {
  const existentes = await prisma.seccionPagina.findMany({ where: { paginaClave: 'autoridades' }, orderBy: { orden: 'asc' } });
  if (existentes.length > 0) return existentes;
  await prisma.seccionPagina.createMany({
    data: seccionesIniciales.map(([grupo, titulo, contenido], orden) => ({ paginaClave: 'autoridades', grupo, titulo, contenido, orden })),
  });
  return prisma.seccionPagina.findMany({ where: { paginaClave: 'autoridades' }, orderBy: { orden: 'asc' } });
}

export function agruparAutoridades(secciones: Awaited<ReturnType<typeof cargarSeccionesAutoridades>>): GrupoAutoridades[] {
  const grupos = new Map<string, typeof secciones>();
  secciones.forEach((seccion) => grupos.set(seccion.grupo, [...(grupos.get(seccion.grupo) ?? []), seccion]));
  return [...grupos.entries()].map(([nombre, grupo]) => {
    const subgrupos = new Map<string, typeof secciones>();
    grupo.forEach((seccion) => {
      const subgrupo = seccion.subgrupo?.trim();
      if (subgrupo) subgrupos.set(subgrupo, [...(subgrupos.get(subgrupo) ?? []), seccion]);
    });
    return {
      nombre,
      secciones: grupo,
      subgrupos: [...subgrupos.entries()].map(([subgrupo, items]) => ({ nombre: subgrupo, secciones: items })),
    };
  });
}

export async function cargarSeccionesHistoria() {
  return prisma.seccionPagina.findMany({ where: { paginaClave: 'historia', activo: true }, orderBy: [{ orden: 'asc' }, { titulo: 'asc' }] });
}

export async function asegurarSeccionesHistoria() {
  const existentes = await prisma.seccionPagina.findMany({ where: { paginaClave: 'historia' }, orderBy: { orden: 'asc' } });
  if (existentes.length > 0) return existentes;
  await prisma.seccionPagina.createMany({ data: seccionesHistoriaIniciales.map(([grupo, titulo, contenido], orden) => ({ paginaClave: 'historia', grupo, titulo, contenido, orden })) });
  return prisma.seccionPagina.findMany({ where: { paginaClave: 'historia' }, orderBy: { orden: 'asc' } });
}

export async function cargarSeccionesPagina(paginaClave: string) {
  return prisma.seccionPagina.findMany({ where: { paginaClave, activo: true }, orderBy: [{ orden: 'asc' }, { titulo: 'asc' }] });
}

/**
 * Permite mostrar el contenido inicial aun cuando la base local esté temporalmente
 * en modo solo lectura. En una instalación normal, asegurarSeccionesPagina los
 * persiste y estos valores solo funcionan como respaldo de lectura.
 */
export function obtenerSeccionesInicialesPagina(paginaClave: string): SeccionPagina[] {
  const definiciones = seccionesGenericas[paginaClave] ?? [];
  const ahora = new Date(0);
  return definiciones.map(([grupo, titulo, contenido], orden) => ({
    id: `default-${paginaClave}-${orden}`,
    paginaClave,
    grupo,
    subgrupo: null,
    titulo,
    contenido,
    orden,
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  }));
}

export async function asegurarSeccionesPagina(paginaClave: string) {
  const definiciones = seccionesGenericas[paginaClave] ?? [];
  const existentes = await prisma.seccionPagina.findMany({ where: { paginaClave }, orderBy: { orden: 'asc' } });
  if (definiciones.length === 0) return existentes;
 if (paginaClave === 'uba-en-accion' && existentes.length > 0) return existentes;
 if (paginaClave === 'uba-verde' && existentes.length > 0) return existentes;
  if (paginaClave === 'tramites-alumnos' && existentes.length > 0) return existentes;
  if (paginaClave === 'sorteo' && existentes.length > 0) return existentes;
  if (paginaClave === 'semana-tecnica' && existentes.length > 0) return existentes;
 if (paginaClave === 'regimen-academico' && existentes.length > 0) return existentes;
  // Los títulos de Becas son editables: no recrear los originales después de renombrarlos.
  if (['beca-ricardo-rojas', 'plan', 'condiciones-de-postulacion', 'ingreso', 'recursos-humanos', 'reglamento-convivencial', 'reglamento-ingreso', 'rematriculacion'].includes(paginaClave) && existentes.length > 0) return existentes;
  const titulosExistentes = new Set(existentes.map((seccion) => seccion.titulo));
  const faltantes = definiciones.filter(([grupo, titulo]) => paginaClave === 'orientaciones'
    ? !existentes.some((seccion) => seccion.grupo === grupo)
    : !titulosExistentes.has(titulo));
  if (faltantes.length > 0) {
    const ultimoOrden = existentes.reduce((maximo, seccion) => Math.max(maximo, seccion.orden), -1);
    await prisma.seccionPagina.createMany({ data: faltantes.map(([grupo, titulo, contenido], indice) => ({ paginaClave, grupo, titulo, contenido, orden: ultimoOrden + indice + 1 })) });
  }
  const ordenPorTitulo = new Map(definiciones.map(([, titulo], orden) => [titulo, orden]));
  return prisma.seccionPagina.findMany({ where: { paginaClave }, orderBy: { orden: 'asc' } }).then((secciones) =>
    secciones.sort((a, b) => (ordenPorTitulo.get(a.titulo) ?? a.orden) - (ordenPorTitulo.get(b.titulo) ?? b.orden))
  );
}













