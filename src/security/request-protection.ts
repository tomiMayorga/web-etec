import session from 'express-session';
import { csrfSync } from 'csrf-sync';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';
import { prisma } from '../database/prisma';

const DURACION_SESION_MS = 30 * 60 * 1000;

class PrismaSessionStore extends session.Store {
  get(
    sessionId: string,
    callback: (error: unknown, sessionData?: session.SessionData | null) => void
  ): void {
    void prisma.sesionAplicacion.findUnique({ where: { id: sessionId } })
      .then(async (registro) => {
        if (!registro || registro.venceEn <= new Date()) {
          if (registro) {
            await prisma.sesionAplicacion.delete({ where: { id: sessionId } });
          }
          callback(null, null);
          return;
        }

        callback(null, JSON.parse(registro.datos) as session.SessionData);
      })
      .catch((error: unknown) => callback(error));
  }

  set(
    sessionId: string,
    sessionData: session.SessionData,
    callback?: (error?: unknown) => void
  ): void {
    const venceEn = sessionData.cookie.expires instanceof Date
      ? sessionData.cookie.expires
      : new Date(Date.now() + DURACION_SESION_MS);

    void prisma.sesionAplicacion.upsert({
      where: { id: sessionId },
      create: { id: sessionId, datos: JSON.stringify(sessionData), venceEn },
      update: { datos: JSON.stringify(sessionData), venceEn },
    })
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  destroy(
    sessionId: string,
    callback?: (error?: unknown) => void
  ): void {
    void prisma.sesionAplicacion.deleteMany({ where: { id: sessionId } })
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  touch(
    sessionId: string,
    sessionData: session.SessionData,
    callback?: (error?: unknown) => void
  ): void {
    this.set(sessionId, sessionData, callback);
  }
}

export const sessionMiddleware = session({
  name: 'etec.sid',
  secret: env.SESSION_SECRET,
  store: new PrismaSessionStore(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURACION_SESION_MS,
  },
});

const {
  generateToken,
  csrfSynchronisedProtection,
  revokeToken,
} = csrfSync({
  getTokenFromRequest: (req) => {
    const bodyToken =
      typeof req.body?._csrf === 'string'
        ? req.body._csrf
        : undefined;

    const headerToken = req.headers['x-csrf-token'];

    if (bodyToken) {
      return bodyToken;
    }

    return typeof headerToken === 'string'
      ? headerToken
      : undefined;
  },

  errorConfig: {
    statusCode: 403,
    code: 'CSRF_TOKEN_INVALIDO',
    message: 'La solicitud no pudo ser verificada.',
  },
});

export const generarTokenCsrf = generateToken;
export const protegerConCsrf = csrfSynchronisedProtection;
export const revocarTokenCsrf = revokeToken;

export const limitePreinscripcion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error:
      'Se realizaron demasiados intentos. Esperá unos minutos antes de volver a intentar.',
  },
});

export const limiteInicioSesion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error:
      'Se realizaron demasiados intentos de acceso. Intentá nuevamente más tarde.',
  },
});

export const limiteExportacion = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error:
      'Se alcanzó temporalmente el límite de exportaciones.',
  },
});

export const limiteOrdenMerito = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Se alcanzó temporalmente el límite de importaciones.',
});

export const limiteCargaImagenes = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Se alcanzó temporalmente el límite de cargas de imágenes.' },
});

export const limiteCargaPliegos = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Se alcanzó temporalmente el límite de cargas de pliegos.' },
});

export const limiteChatbot = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Se realizaron demasiadas consultas. Intentá nuevamente en unos minutos.',
  },
});
