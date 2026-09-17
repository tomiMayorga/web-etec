import { Router } from 'express';
import {
  cerrarSesion,
  mostrarLogin,
  procesarLogin,
} from '../controllers/admin-auth.controller';
import { exigirAutenticacion } from '../middleware/admin-auth';
import {
  actualizarAreaChatbot,
  actualizarConfiguracionChatbot,
  actualizarIntencionChatbot,
  crearAreaChatbot,
  crearIntencionChatbot,
  mostrarAdministracionChatbot,
} from '../controllers/admin-chatbot.controller';
import { exigirRol } from '../middleware/admin-auth';
import {
  actualizarAdministracionRematriculacion,
  mostrarAdministracionRematriculacion,
} from '../controllers/admin-rematriculacion.controller';
import {
  importarOrdenMeritoCsv,
  mostrarOrdenMerito,
} from '../controllers/admin-orden-merito.controller';
import {
  actualizarEstadoCiclo,
  cambiarEstadoUsuario,
  crearCiclo,
  crearUsuario,
  exportarInscripciones,
  mostrarAuditoria,
  mostrarConservacion,
  mostrarContenidos,
  mostrarCiclos,
  mostrarExportaciones,
  mostrarInscripciones,
  mostrarUsuarios,
  actualizarContenido,
  actualizarSeccionPagina,
  crearSeccionPagina,
  subirImagenActividad,
  subirPliego,
} from '../controllers/admin-management.controller';
import {
  generarTokenCsrf,
  limiteInicioSesion,
  limiteCargaImagenes,
  limiteCargaPliegos,
  limiteOrdenMerito,
  protegerConCsrf,
} from '../security/request-protection';
import { recibirCsv } from '../security/multipart-csv';
import { recibirImagen } from '../security/multipart-image';
import { guardarCronogramaIngreso } from '../controllers/admin-cronograma.controller';
import { guardarEmpresas } from '../controllers/admin-empresas.controller';
import { mostrarAdminEventos, guardarAdminEvento, confirmarEliminacionEvento, eliminarAdminEvento } from '../controllers/admin-eventos.controller';
import { mostrarAdminIngresantes, importarIngresantesCsv } from '../controllers/admin-ingresantes.controller';

export const adminRouter = Router();

const soloSuperAdmin = exigirRol('SUPER_ADMIN');

adminRouter.get(
  '/login',
  mostrarLogin
);

adminRouter.post(
  '/login',
  limiteInicioSesion,
  protegerConCsrf,
  procesarLogin
);

adminRouter.post(
  '/logout',
  exigirAutenticacion,
  protegerConCsrf,
  cerrarSesion
);

adminRouter.get(
  '/',
  exigirAutenticacion,
  (req, res) => {
    const usuario = req.session.usuarioAdministrativo;

    /*
     * El middleware anterior garantiza que el usuario existe.
     * Esta comprobación mantiene el tipado estricto.
     */
    if (!usuario) {
      res.redirect(303, '/admin/login');
      return;
    }

    res.render('admin/dashboard', {
      title: 'Panel administrativo - ETEC UBA',
      page: 'admin-dashboard',
      usuario,
      csrfToken: generarTokenCsrf(req),
    });
  }
);

adminRouter.get('/chatbot', soloSuperAdmin, mostrarAdministracionChatbot);
adminRouter.get('/rematriculacion', soloSuperAdmin, mostrarAdministracionRematriculacion);
adminRouter.post('/rematriculacion', soloSuperAdmin, protegerConCsrf, actualizarAdministracionRematriculacion);
adminRouter.get('/inscripciones', exigirAutenticacion, mostrarInscripciones);
adminRouter.get('/exportaciones', exigirAutenticacion, mostrarExportaciones);
adminRouter.post('/exportaciones', exigirAutenticacion, protegerConCsrf, exportarInscripciones);
adminRouter.get('/orden-de-merito', soloSuperAdmin, mostrarOrdenMerito);
adminRouter.post('/orden-de-merito', soloSuperAdmin, limiteOrdenMerito, recibirCsv, protegerConCsrf, importarOrdenMeritoCsv);
adminRouter.get('/ciclos', soloSuperAdmin, mostrarCiclos);
adminRouter.post('/ciclos', soloSuperAdmin, protegerConCsrf, crearCiclo);
adminRouter.post('/ciclos/estado', soloSuperAdmin, protegerConCsrf, actualizarEstadoCiclo);
adminRouter.get('/usuarios', soloSuperAdmin, mostrarUsuarios);
adminRouter.post('/usuarios', soloSuperAdmin, protegerConCsrf, crearUsuario);
adminRouter.post('/usuarios/estado', soloSuperAdmin, protegerConCsrf, cambiarEstadoUsuario);
adminRouter.get('/auditoria', soloSuperAdmin, mostrarAuditoria);
adminRouter.get('/conservacion', soloSuperAdmin, mostrarConservacion);
adminRouter.get('/contenidos', soloSuperAdmin, mostrarContenidos);
adminRouter.get('/eventos', soloSuperAdmin, mostrarAdminEventos);
adminRouter.post('/eventos', soloSuperAdmin, protegerConCsrf, guardarAdminEvento);
adminRouter.get('/eventos/eliminar', soloSuperAdmin, confirmarEliminacionEvento);
adminRouter.post('/eventos/eliminar', soloSuperAdmin, protegerConCsrf, eliminarAdminEvento);
adminRouter.get('/ingresantes', soloSuperAdmin, mostrarAdminIngresantes);
adminRouter.post('/ingresantes', soloSuperAdmin, recibirCsv, protegerConCsrf, importarIngresantesCsv);
adminRouter.post('/contenidos/cronograma-ingreso', soloSuperAdmin, protegerConCsrf, guardarCronogramaIngreso);
adminRouter.post('/contenidos/empresas', soloSuperAdmin, protegerConCsrf, guardarEmpresas);
adminRouter.post('/contenidos', soloSuperAdmin, protegerConCsrf, actualizarContenido);
adminRouter.post('/contenidos/secciones', soloSuperAdmin, protegerConCsrf, actualizarSeccionPagina);
adminRouter.post('/contenidos/secciones/nueva', soloSuperAdmin, protegerConCsrf, crearSeccionPagina);
adminRouter.post('/contenidos/imagenes', soloSuperAdmin, limiteCargaImagenes, recibirImagen, protegerConCsrf, subirImagenActividad);
adminRouter.post('/contenidos/pliegos', soloSuperAdmin, limiteCargaPliegos, recibirImagen, protegerConCsrf, subirPliego);
adminRouter.post('/chatbot/configuracion', soloSuperAdmin, protegerConCsrf, actualizarConfiguracionChatbot);
adminRouter.post('/chatbot/areas', soloSuperAdmin, protegerConCsrf, actualizarAreaChatbot);
adminRouter.post('/chatbot/areas/nueva', soloSuperAdmin, protegerConCsrf, crearAreaChatbot);
adminRouter.post('/chatbot/intenciones', soloSuperAdmin, protegerConCsrf, actualizarIntencionChatbot);
adminRouter.post('/chatbot/intenciones/nueva', soloSuperAdmin, protegerConCsrf, crearIntencionChatbot);
