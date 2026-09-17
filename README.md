# web-etec

Réplica local del sitio de la Escuela Técnica de la Universidad de Buenos
Aires, desarrollada con TypeScript, Express y EJS.

## Requisitos

- Node.js 20 o superior.
- npm.

## Instalación y ejecución local

```powershell
npm install
npm run dev
```

El servidor escucha por defecto únicamente en:

```text
http://127.0.0.1:3000
```

Se puede cambiar el puerto mediante la variable de entorno `PORT`. El host
solo debería modificarse cuando exista una necesidad explícita de acceso
desde otra máquina.

## Verificaciones

```powershell
npm run typecheck
npm test
npm run security:audit
```

Para ejecutar todas las verificaciones:

```powershell
npm run check
```

Ninguno de estos comandos genera la carpeta `dist`.

## Listado local de postulantes

`src/data/postulantes-sorteo.json` contiene datos personales y está excluido
de Git. Para regenerarlo desde la fuente oficial:

```powershell
npm run import:sorteo
```

El importador valida el tipo de respuesta, tamaño, columnas, contenido,
cantidad de registros y números duplicados antes de reemplazar el archivo
local.

Si el archivo no existe o no supera la validación del servidor, la aplicación
continúa funcionando y muestra la tabla sin registros.

## Seguridad

- Express no publica la cabecera `X-Powered-By`.
- Las respuestas incluyen CSP y cabeceras defensivas mediante Helmet.
- Los archivos ocultos no se sirven desde la carpeta pública.
- Las rutas inexistentes responden con estado HTTP 404.
- Los errores internos no exponen trazas al navegador.
- Los datos dinámicos se imprimen con escape HTML de EJS.

Las imágenes y tipografías que aún provienen de servicios externos están
limitadas por la política CSP. Antes de publicar el proyecto conviene migrar
los recursos esenciales a `public/` para que el sitio sea completamente
autónomo.
