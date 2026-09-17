import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { generarTokenCsrf } from '../security/request-protection';
import { crearHuellaIp } from '../security/personal-data';
import { normalizarConsulta } from '../services/chatbot.service';
import { randomUUID } from 'crypto';

const textoCorto = z.string().trim().min(2).max(120);
const textoRespuesta = z.string().trim().min(5).max(600);

function crearSlug(texto: string): string {
  return normalizarConsulta(texto).replace(/\s+/g, '-').slice(0, 60);
}

function extraerFrases(texto: string): string[] | null {
  const frases = [...new Set(
    texto.split(/\r?\n/).map((frase) => frase.trim()).filter(Boolean)
  )].slice(0, 30);

  return frases.length > 0 && frases.every((frase) => frase.length <= 100)
    ? frases
    : null;
}

function usuarioId(req: Request): string {
  const id = req.session.usuarioAdministrativo?.id;
  if (!id) throw new Error('Sesión administrativa inválida.');
  return id;
}

export async function mostrarAdministracionChatbot(req: Request, res: Response): Promise<void> {
  try {
    const [configuracion, areas, intenciones] = await Promise.all([
      prisma.configuracionChatbot.findUnique({ where: { id: 1 } }),
      prisma.areaContacto.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] }),
      prisma.intencionChatbot.findMany({
        include: { frases: { orderBy: { texto: 'asc' } }, areaContacto: true },
        orderBy: [{ orden: 'asc' }, { titulo: 'asc' }],
      }),
    ]);

    if (!configuracion) {
      res.status(503).render('error', {
        title: 'Chatbot sin configurar - ETEC UBA',
        page: 'server-error',
        message: 'Primero debe cargarse la configuración inicial del chatbot.',
      });
      return;
    }

    const guardado = typeof req.query.guardado === 'string' ? req.query.guardado : null;
    res.render('admin/chatbot', {
      title: 'Administrar chatbot - ETEC UBA',
      page: 'admin-chatbot',
      configuracion,
      areas,
      intenciones,
      guardado,
      csrfToken: generarTokenCsrf(req),
    });
  } catch {
    res.status(500).render('error', {
      title: 'Error administrativo - ETEC UBA',
      page: 'server-error',
      message: 'No fue posible cargar la configuración del chatbot.',
    });
  }
}

export async function actualizarConfiguracionChatbot(req: Request, res: Response): Promise<void> {
  const validacion = z.object({
    mensajeBienvenida: textoRespuesta,
    mensajeNoEntendido: textoRespuesta,
  }).safeParse(req.body);

  if (!validacion.success) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.configuracionChatbot.update({
        where: { id: 1 },
        data: {
          activo: req.body.activo === 'on',
          modoPrueba: req.body.modoPrueba === 'on',
          ...validacion.data,
        },
      });
      await tx.eventoAuditoria.create({
        data: {
          usuarioId: usuarioId(req),
          tipo: 'MODIFICACION_CHATBOT',
          entidad: 'ConfiguracionChatbot',
          entidadId: '1',
          detalles: JSON.stringify({ accion: 'ACTUALIZAR_CONFIGURACION' }),
          ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
        },
      });
    });
    res.redirect(303, '/admin/chatbot?guardado=configuracion');
  } catch {
    res.redirect(303, '/admin/chatbot?guardado=error');
  }
}

export async function actualizarAreaChatbot(req: Request, res: Response): Promise<void> {
  const validacion = z.object({
    id: z.string().min(1).max(40),
    nombre: textoCorto,
    telefonoWhatsapp: z.union([
      z.literal(''),
      z.string().regex(/^\d{8,15}$/),
    ]),
    mensajeInicial: textoRespuesta,
  }).safeParse(req.body);

  if (!validacion.success) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.areaContacto.update({
        where: { id: validacion.data.id },
        data: {
          nombre: validacion.data.nombre,
          telefonoWhatsapp: validacion.data.telefonoWhatsapp || null,
          mensajeInicial: validacion.data.mensajeInicial,
          activo: req.body.activo === 'on',
        },
      });
      await tx.eventoAuditoria.create({
        data: {
          usuarioId: usuarioId(req),
          tipo: 'MODIFICACION_CHATBOT',
          entidad: 'AreaContacto',
          entidadId: validacion.data.id,
          detalles: JSON.stringify({ accion: 'ACTUALIZAR_AREA' }),
          ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
        },
      });
    });
    res.redirect(303, '/admin/chatbot?guardado=area');
  } catch {
    res.redirect(303, '/admin/chatbot?guardado=error');
  }
}

export async function crearAreaChatbot(req: Request, res: Response): Promise<void> {
  const validacion = z.object({
    nombre: textoCorto,
    telefonoWhatsapp: z.union([z.literal(''), z.string().regex(/^\d{8,15}$/)]),
    mensajeInicial: textoRespuesta,
  }).safeParse(req.body);

  if (!validacion.success) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const ultima = await tx.areaContacto.aggregate({ _max: { orden: true } });
      const area = await tx.areaContacto.create({
        data: {
          nombre: validacion.data.nombre,
          slug: crearSlug(validacion.data.nombre),
          telefonoWhatsapp: validacion.data.telefonoWhatsapp || null,
          mensajeInicial: validacion.data.mensajeInicial,
          activo: req.body.activo === 'on',
          orden: (ultima._max.orden ?? 0) + 1,
        },
      });
      await tx.eventoAuditoria.create({
        data: {
          usuarioId: usuarioId(req),
          tipo: 'MODIFICACION_CHATBOT',
          entidad: 'AreaContacto',
          entidadId: area.id,
          detalles: JSON.stringify({ accion: 'CREAR_AREA' }),
          ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
        },
      });
    });
    res.redirect(303, '/admin/chatbot?guardado=area-creada');
  } catch {
    res.redirect(303, '/admin/chatbot?guardado=error');
  }
}

export async function actualizarIntencionChatbot(req: Request, res: Response): Promise<void> {
  const validacion = z.object({
    id: z.string().min(1).max(40),
    titulo: textoCorto,
    respuesta: textoRespuesta,
    frases: z.string().max(3000),
  }).safeParse(req.body);

  if (!validacion.success) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  const frases = extraerFrases(validacion.data.frases);
  if (!frases) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.intencionChatbot.update({
        where: { id: validacion.data.id },
        data: {
          titulo: validacion.data.titulo,
          respuesta: validacion.data.respuesta,
          activo: req.body.activo === 'on',
        },
      });
      await tx.fraseChatbot.deleteMany({ where: { intencionId: validacion.data.id } });
      await tx.fraseChatbot.createMany({
        data: frases.map((texto) => ({
          intencionId: validacion.data.id,
          texto,
          textoNormalizado: normalizarConsulta(texto),
        })),
      });
      await tx.eventoAuditoria.create({
        data: {
          usuarioId: usuarioId(req),
          tipo: 'MODIFICACION_CHATBOT',
          entidad: 'IntencionChatbot',
          entidadId: validacion.data.id,
          detalles: JSON.stringify({ accion: 'ACTUALIZAR_INTENCION' }),
          ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
        },
      });
    });
    res.redirect(303, '/admin/chatbot?guardado=respuesta');
  } catch {
    res.redirect(303, '/admin/chatbot?guardado=error');
  }
}

export async function crearIntencionChatbot(req: Request, res: Response): Promise<void> {
  const validacion = z.object({
    titulo: textoCorto,
    respuesta: textoRespuesta,
    tipoDestino: z.enum(['PAGINA_INTERNA', 'WHATSAPP']),
    rutaInterna: z.string().trim().max(200).optional().default(''),
    areaContactoId: z.string().trim().max(40).optional().default(''),
    frases: z.string().max(3000),
  }).safeParse(req.body);

  if (!validacion.success) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  const datos = validacion.data;
  const frases = extraerFrases(datos.frases);
  const rutaValida = /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(datos.rutaInterna);

  if (
    !frases ||
    (datos.tipoDestino === 'PAGINA_INTERNA' && !rutaValida) ||
    (datos.tipoDestino === 'WHATSAPP' && !datos.areaContactoId)
  ) {
    res.redirect(303, '/admin/chatbot?guardado=error');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (datos.tipoDestino === 'WHATSAPP') {
        const area = await tx.areaContacto.findUnique({
          where: { id: datos.areaContactoId },
          select: { id: true },
        });
        if (!area) throw new Error('Área inexistente.');
      }

      const ultima = await tx.intencionChatbot.aggregate({ _max: { orden: true } });
      const intencion = await tx.intencionChatbot.create({
        data: {
          clave: `PERSONALIZADA_${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`,
          titulo: datos.titulo,
          respuesta: datos.respuesta,
          tipoDestino: datos.tipoDestino,
          rutaInterna: datos.tipoDestino === 'PAGINA_INTERNA' ? datos.rutaInterna : null,
          areaContactoId: datos.tipoDestino === 'WHATSAPP' ? datos.areaContactoId : null,
          activo: req.body.activo === 'on',
          orden: (ultima._max.orden ?? 0) + 1,
          frases: {
            create: frases.map((texto) => ({ texto, textoNormalizado: normalizarConsulta(texto) })),
          },
        },
      });
      await tx.eventoAuditoria.create({
        data: {
          usuarioId: usuarioId(req),
          tipo: 'MODIFICACION_CHATBOT',
          entidad: 'IntencionChatbot',
          entidadId: intencion.id,
          detalles: JSON.stringify({ accion: 'CREAR_INTENCION' }),
          ipHuella: crearHuellaIp(req.ip || req.socket.remoteAddress || 'desconocida'),
        },
      });
    });
    res.redirect(303, '/admin/chatbot?guardado=respuesta-creada');
  } catch {
    res.redirect(303, '/admin/chatbot?guardado=error');
  }
}
