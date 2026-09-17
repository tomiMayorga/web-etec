import { Request, Response } from 'express';
import { z } from 'zod';
import {
  obtenerConfiguracionPublicaChatbot,
  responderConsultaChatbot,
} from '../services/chatbot.service';

const consultaSchema = z.object({
  mensaje: z.string().trim().min(2).max(300),
});

export async function obtenerChatbot(_req: Request, res: Response): Promise<void> {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await obtenerConfiguracionPublicaChatbot());
  } catch {
    res.status(503).json({ error: 'El asistente no está disponible temporalmente.' });
  }
}

export async function consultarChatbot(req: Request, res: Response): Promise<void> {
  const validacion = consultaSchema.safeParse(req.body);
  if (!validacion.success) {
    res.status(400).json({ error: 'Escribí una consulta válida de hasta 300 caracteres.' });
    return;
  }

  try {
    const respuesta = await responderConsultaChatbot(validacion.data.mensaje);
    if (!respuesta) {
      res.status(404).json({ error: 'El asistente no está habilitado.' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json(respuesta);
  } catch {
    res.status(503).json({ error: 'No pudimos responder en este momento.' });
  }
}
