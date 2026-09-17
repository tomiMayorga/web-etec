import { Router } from 'express';
import {
  mostrarConfirmacion,
  mostrarFormulario,
  procesarFormulario,
} from '../controllers/preinscripcion.controller';
import {
  limitePreinscripcion,
  protegerConCsrf,
} from '../security/request-protection';

export const preinscripcionRouter = Router();

preinscripcionRouter.get(
  '/',
  mostrarFormulario
);

preinscripcionRouter.post(
  '/',
  limitePreinscripcion,
  protegerConCsrf,
  procesarFormulario
);

preinscripcionRouter.get(
  '/confirmacion',
  mostrarConfirmacion
);