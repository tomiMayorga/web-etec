import { enlaceVerdeValido } from './services/uba-verde-content';
import { leerEnlaceTramite } from './services/tramites-content';
import express, { NextFunction, Request, Response } from 'express';
import { readFileSync, statSync } from 'fs';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { sessionMiddleware } from './security/request-protection';
import { preinscripcionRouter } from './routes/preinscripcion.routes';
import { adminRouter } from './routes/admin.routes';
import { eventosRouter } from './routes/eventos.routes';
import { chatbotRouter } from './routes/chatbot.routes';
import { prisma } from './database/prisma';
import {
  agruparAutoridades,
  cargarSeccionesAutoridades,
  cargarSeccionesHistoria,
  cargarSeccionesPagina,
  asegurarSeccionesPagina,
  obtenerSeccionesInicialesPagina,
} from './services/pagina-content.service';
import { cargarOrdenMerito } from './services/orden-merito.service';
import { leerPostulacionBeca } from './services/beca-postulacion';
import { cargarCronogramaIngreso } from './services/cronograma-ingreso.service';
import { cargarEmpresas } from './services/empresas-content.service';
import { cargarSorteoPublico } from './services/sorteo.service';
import { cargarListadoIngresantes } from './services/ingresantes.service';

interface PostulanteSorteo {
  numero: number;
  apellido: string;
  nombre: string;
}

function cargarIngresantes(): PostulanteSorteo[] {
  const rutaDatos = process.env.INGRESANTES_DATA_PATH
    ? path.resolve(process.env.INGRESANTES_DATA_PATH)
    : path.resolve(process.cwd(), 'src/data/ingresantes.json');

  try {
    if (statSync(rutaDatos).size > 1_000_000) {
      throw new Error('el archivo supera el tamaño permitido');
    }

    const contenido: unknown = JSON.parse(readFileSync(rutaDatos, 'utf8'));
    if (!Array.isArray(contenido) || contenido.length > 1_000) {
      throw new Error('el formato del listado no es válido');
    }

    if (!contenido.every((item) =>
      typeof item === 'object' && item !== null &&
      Number.isInteger((item as PostulanteSorteo).numero) &&
      (item as PostulanteSorteo).numero > 0 &&
      typeof (item as PostulanteSorteo).apellido === 'string' &&
      (item as PostulanteSorteo).apellido.length <= 120 &&
      typeof (item as PostulanteSorteo).nombre === 'string' &&
      (item as PostulanteSorteo).nombre.length <= 120
    )) {
      throw new Error('el listado contiene registros inválidos');
    }

    return contenido;
  } catch (error) {
    console.warn(
      'No se cargó el listado local de ingresantes:',
      error instanceof Error ? error.message : 'error desconocido'
    );
    return [];
  }
}

const app = express();

const ingresantes = cargarIngresantes();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.disable('x-powered-by');

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: [
          "'self'",
          'data:',
          'https://cdnjs.cloudflare.com',
          'https://fonts.gstatic.com',
        ],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        frameSrc: [
          "'self'",
          'https://maps.google.com',
          'https://www.google.com',
          'https://etec.uba.ar',
          'https://www.etec.uba.ar',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://etec.uba.ar',
          'https://www.etec.uba.ar',
          'https://cms.fi.uba.ar',
        ],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
          'https://fonts.googleapis.com',
        ],
        upgradeInsecureRequests: null,
      },
    },
  })
);

app.use((_req: Request, res: Response, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), geolocation=(), microphone=()'
  );
  next();
});

app.use(
  express.static(path.join(__dirname, '../public'), {
    dotfiles: 'deny',
    index: false,
    redirect: false,
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: '32kb',
    parameterLimit: 80,
  })
);

app.use(
  express.json({
    limit: '32kb',
  })
);

app.use(sessionMiddleware);

app.use(async (req, res, next) => {
  try {
    const contenidoPagina = await prisma.paginaContenido.findUnique({
      where: { ruta: req.path },
    });
    res.locals.contenidoPagina = contenidoPagina;
    res.locals.seccionesPagina = contenidoPagina
      ? await prisma.seccionPagina.findMany({ where: { paginaClave: contenidoPagina.clave, activo: true }, orderBy: [{ orden: 'asc' }, { titulo: 'asc' }] })
      : [];
  } catch {
    res.locals.contenidoPagina = null;
    res.locals.seccionesPagina = [];
  }
  next();
});

app.use('/api/chatbot', chatbotRouter);


app.get('/', async (_req: Request, res: Response) => {
  const rematriculacion = await prisma.configuracionRematriculacion.findUnique({ where: { id: 1 } }).catch(() => null);
  const seccionesInicio = await asegurarSeccionesPagina('home').catch(() => []);
  const ahora = new Date();
  const rematriculacionActiva = Boolean(
    rematriculacion?.activo &&
    (!rematriculacion.fechaInicio || ahora >= rematriculacion.fechaInicio) &&
    (!rematriculacion.fechaFin || ahora <= rematriculacion.fechaFin)
  );
  res.render('index', {
    title: 'ETEC UBA - ETEC UBA',
    page: 'home',
    rematriculacion,
    rematriculacionActiva,
    seccionesInicio,
  });
});

app.get('/historia', async (_req: Request, res: Response) => {
  const seccionesHistoria = await cargarSeccionesHistoria().catch(() => []);
  res.render('historia', {
    title: 'Historia - ETEC UBA',
    page: 'historia',
    seccionesHistoria,
  });
});

app.get('/autoridades', async (_req: Request, res: Response) => {
  const secciones = await cargarSeccionesAutoridades().catch(() => []);
  res.render('autoridades', {
    title: 'Autoridades - ETEC UBA',
    page: 'autoridades',
    gruposAutoridades: agruparAutoridades(secciones),
  });
});

app.get('/plan_de_estudio', async (_req: Request, res: Response, next: NextFunction) => {
  try {
  const seccionesPlan = await asegurarSeccionesPagina('plan');
  res.render('plan_de_estudio', {
    title: 'Plan de Estudio - ETEC UBA',
    page: 'plan',
    seccionesPlan,
  });
  } catch (error) { next(error); }
});

app.get('/orientaciones', async (_req: Request, res: Response) => {
  const seccionesOrientaciones = await asegurarSeccionesPagina('orientaciones').catch(() => []);
  res.render('orientaciones', {
    title: 'Orientaciones - ETEC UBA',
    page: 'orientaciones',
    seccionesOrientaciones,
  });
});

app.get('/calendario-escolar', (_req: Request, res: Response) => {
  asegurarSeccionesPagina('calendario').then((seccionesCalendario) => {
    res.render('calendario', {
      title: 'Calendario Académico - ETEC UBA',
      page: 'calendario',
      seccionesCalendario,
    });
  }).catch(() => {
    res.render('calendario', {
      title: 'Calendario Académico - ETEC UBA',
      page: 'calendario',
      seccionesCalendario: [],
    });
  });
});

app.get('/presentacion', async (_req: Request, res: Response) => {
  const seccionesIngreso = await cargarSeccionesPagina('ingreso').catch(() => []);
  res.render('presentacion', {
    title: 'Presentación Curso de Ingreso - ETEC UBA',
    page: 'ingreso',
    seccionesIngreso,
  });
});

app.get('/novedades-institucionales', async (_req: Request, res: Response) => {
  const seccionesNovedades = await cargarSeccionesPagina('novedades').catch(() => []);
  res.render('novedades', {
    title: 'Novedades Institucionales - ETEC UBA',
    page: 'novedades',
    seccionesNovedades,
  });
});

app.get('/oficina-de-genero', async (_req: Request, res: Response) => {
  const seccionesGenero = await asegurarSeccionesPagina('genero').catch(async () => {
    const existentes = await cargarSeccionesPagina('genero').catch(() => []);
    return existentes.length ? existentes : obtenerSeccionesInicialesPagina('genero');
  });
  res.render('genero', {
    title: 'Oficina de Género - ETEC UBA',
    page: 'genero',
    seccionesGenero,
  });
});

app.get('/contrataciones', async (_req: Request, res: Response) => {
  const seccionesCompras = await asegurarSeccionesPagina('contrataciones').catch(() => []);
  res.render('contrataciones', {
    title: 'Compras - ETEC UBA',
    page: 'contrataciones',
    seccionesCompras,
  });
});

app.get('/recursos-humanos', async (_req: Request, res: Response) => {
  const seccionesRRHH = await cargarSeccionesPagina('recursos-humanos').catch(() => []);
  res.render('recursos-humanos', {
    title: 'Recursos Humanos - ETEC UBA',
    page: 'recursos-humanos',
    seccionesRRHH,
  });
});
app.get('/reglamento_convivencial', async (_req: Request, res: Response) => {
  const seccionesConvivencial = await cargarSeccionesPagina('reglamento-convivencial').catch(() => []);
  res.render('reglamento-convivencial', { title: 'Reglamento Convivencial - ETEC UBA', page: 'reglamento-convivencial', seccionesConvivencial });
});
app.get('/tramites-para-alumnos-as', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const seccionesTramites = await asegurarSeccionesPagina('tramites-alumnos');
    res.render('tramites-alumnos', { title: 'Trámites para alumnos/as - ETEC UBA', page: 'tramites-alumnos', seccionesTramites, leerEnlaceTramite });
  } catch (error) { next(error); }
});
app.get('/rematriculacion', async (_req: Request, res: Response) => {
  const seccionesRematriculacion = await cargarSeccionesPagina('rematriculacion');
  const rematriculacion = await prisma.configuracionRematriculacion.findUnique({ where: { id: 1 } }).catch(() => null);
  res.render('rematriculacion', {
    title: 'Rematriculación - ETEC UBA',
    page: 'rematriculacion',
    seccionesRematriculacion,
    rematriculacion,
  });
});
app.get('/regimen-academico', async (_req: Request, res: Response, next: NextFunction) => {
 try { const seccionesAcademico = await asegurarSeccionesPagina('regimen-academico');
 res.render('regimen-academico', {title: 'Régimen Académico - ETEC UBA', page: 'regimen-academico', seccionesAcademico});
 } catch(error) { next(error); }
});
app.get('/ega-imagen', (_req: Request, res: Response) => {
  res.render('ega-imagen', {
    title: 'EGA IMAGEN - ETEC UBA',
    page: 'ega-imagen',
  });
});
app.get('/tesacom', (_req: Request, res: Response) => {
  res.render('tesacom', {
    title: 'TESACOM - ETEC UBA',
    page: 'tesacom',
  });
});
app.get('/iadev', (_req: Request, res: Response) => {
  res.render('iadev', {
    title: 'IADEV - ETEC UBA',
    page: 'iadev',
  });
});
app.get('/laser', (_req: Request, res: Response) => {
  res.render('laser', {
    title: 'LASER - ETEC UBA',
    page: 'laser',
  });
});
app.get('/doit', (_req: Request, res: Response) => {
  res.render('doit', {
    title: 'DOIT+ - ETEC UBA',
    page: 'doit',
  });
});
app.get('/green4t', (_req: Request, res: Response) => {
  res.render('green4t', {
    title: 'GREEN4T - ETEC UBA',
    page: 'green4t',
  });
});
app.get('/informaciongeneral', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const seccionesInformacionGeneral = await asegurarSeccionesPagina('informacion-general').catch(() => cargarSeccionesPagina('informacion-general').catch(() => []));
    res.render('informacion-general', {
      title: 'Información General - ETEC UBA',
      page: 'informacion-general',
      seccionesInformacionGeneral,
    });
  } catch (error) { next(error); }
});

app.get('/reglamento', async (_req: Request, res: Response) => {
  const seccionesReglamentoIngreso = await cargarSeccionesPagina('reglamento-ingreso');
  res.render('reglamento-ingreso', {
    title: 'Reglamento Curso de Ingreso Evaluatorio - ETEC UBA',
    page: 'reglamento-ingreso',
    seccionesReglamentoIngreso,
  });
});

app.get('/cronograma-curso-ingreso', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const seccionesCronograma = await cargarCronogramaIngreso();
    res.render('cronograma-curso-ingreso', {
      title: 'Cronograma - ETEC UBA',
      page: 'cronograma-curso-ingreso',
      seccionesCronograma,
    });
  } catch (error) { next(error); }
});

app.use(
  '/formulario-de-inscripcion',
  preinscripcionRouter
);

app.use(
  '/admin',
  adminRouter
);


app.get('/sorteo', async (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const seccionesSorteo = await asegurarSeccionesPagina('sorteo');
    const listadoSorteo = await cargarSorteoPublico();
    res.render('sorteo', { title: 'Sorteo - ETEC UBA', page: 'sorteo', seccionesSorteo, listadoSorteo });
  } catch (error) { next(error); }
});

app.get('/ingresantes', async (_req: Request, res: Response) => {
  const listado = await cargarListadoIngresantes().catch(() => null);
  res.render('ingresantes', {
    title: 'Ingresantes - ETEC UBA',
    page: 'ingresantes',
    ingresantes: listado?.filas ?? ingresantes,
    cicloLectivoIngresantes: listado?.cicloLectivo,
  });
});

app.get('/orden-de-merito', async (_req: Request, res: Response) => {
  const ordenMerito = await cargarOrdenMerito().catch(() => null);
  res.render('orden-de-merito', {
    title: 'Orden de Mérito - ETEC UBA',
    page: 'orden-de-merito',
    ordenMerito,
  });
});

app.get('/condiciones-de-postulacion', async (_req: Request, res: Response, next: NextFunction) => {
  try {
  const preguntasFrecuentes = await asegurarSeccionesPagina('condiciones-de-postulacion');
  res.render('condiciones-de-postulacion', {
    title: 'Preguntas Frecuentes - ETEC UBA',
    page: 'condiciones-de-postulacion',
    preguntasFrecuentes,
  });
  } catch (error) { next(error); }
});

app.get('/uba-verde', async (_req: Request, res: Response, next: NextFunction) => {
 try { const seccionesVerde = await asegurarSeccionesPagina('uba-verde');
 res.render('uba-verde', { title: 'UBA Verde - ETEC UBA', page: 'uba-verde', seccionesVerde, enlaceVerdeValido });
 } catch(error) { next(error); }
});

app.get('/empresas', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contenidoEmpresas = await cargarEmpresas();
    res.render('empresas', { title: 'Empresas - ETEC UBA', page: 'empresas', contenidoEmpresas });
  } catch (error) { next(error); }
});

app.get('/uba-en-accion', async (_req: Request, res: Response, next: NextFunction) => {
 try { const seccionesAccion = await asegurarSeccionesPagina('uba-en-accion');
 res.render('uba-en-accion', { title: 'UBA en Acción - ETEC UBA', page: 'uba-en-accion', seccionesAccion });
 } catch(error) { next(error); }
});

app.get('/servicio-de-odontologia-para-estudiantes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const seccionesOdontologia = await asegurarSeccionesPagina('odontologia-estudiantes').catch(async () => {
      const existentes = await cargarSeccionesPagina('odontologia-estudiantes').catch(() => []);
      return existentes.length ? existentes : obtenerSeccionesInicialesPagina('odontologia-estudiantes');
    });
    res.render('odontologia-estudiantes', {
      title: 'Servicio de Odontología para Estudiantes - ETEC UBA',
      page: 'odontologia-estudiantes',
      seccionesOdontologia,
    });
  } catch (error) { next(error); }
});

app.get('/beca-rector-ricardo-rojas', (_req: Request, res: Response) => {
  asegurarSeccionesPagina('beca-ricardo-rojas').then((seccionesBecas) => {
    res.render('beca-ricardo-rojas', {
      title: 'Beca “Rector Ricardo Rojas” - ETEC UBA',
      page: 'beca-ricardo-rojas',
      seccionesBecas,
      leerPostulacionBeca,
    });
  }).catch(() => {
    res.render('beca-ricardo-rojas', {
      title: 'Beca “Rector Ricardo Rojas” - ETEC UBA',
      page: 'beca-ricardo-rojas',
      seccionesBecas: [],
      leerPostulacionBeca,
    });
  });
});

app.get('/actividades-extracurriculares', async (_req: Request, res: Response) => {
  const seccionesActividades = await asegurarSeccionesPagina('actividades-extracurriculares').catch(() => []);
  res.render('actividades-extracurriculares', {
    title: 'Actividades Extracurriculares - ETEC UBA',
    page: 'actividades-extracurriculares',
    seccionesActividades,
  });
});

app.get('/semana-tecnica', async (_req: Request, res: Response) => {
  const seccionesSemana = await asegurarSeccionesPagina('semana-tecnica').catch(() => []);
  res.render('semana-tecnica', {
    title: 'Semana Técnica - ETEC UBA',
    page: 'semana-tecnica',
    seccionesSemana,
  });
});

app.use(
  '/eventos',
  eventosRouter
);
app.use((_req: Request, res: Response) => {
  res.status(404).render('404', {
    title: 'Página no encontrada - ETEC UBA',
    page: 'not-found',
  });
});

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error('Error no controlado:', error);

    if (res.headersSent) {
      next(error);
      return;
    }

    res.status(500).render('error', {
      title: 'Error interno - ETEC UBA',
      page: 'server-error',
    });
  }
);

if (require.main === module) {
  app.listen(env.PORT, env.HOST, () => {
    console.log(
      `ETEC UBA server running: http://${env.HOST}:${env.PORT}`
    );
  });
}

export default app;











