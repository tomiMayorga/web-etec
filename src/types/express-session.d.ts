import { RolUsuario } from '@prisma/client';

declare module 'express-session' {
  interface SessionData {
    confirmacionPreinscripcion?: {
      numeroSorteo: number;
      cicloLectivo: number;
    };

    usuarioAdministrativo?: {
      id: string;
      nombreMostrado: string;
      rol: RolUsuario;
    };
  }
}