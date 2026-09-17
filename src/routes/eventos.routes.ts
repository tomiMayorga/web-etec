import { Router } from 'express';
import { mostrarCalendarioEventos } from '../controllers/eventos.controller';

export const eventosRouter = Router();

eventosRouter.get(
  '/',
  mostrarCalendarioEventos
);