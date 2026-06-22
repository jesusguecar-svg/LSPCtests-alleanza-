# Panel de Onboarding — Programa de Telemedicina y Pruebas Diagnósticas

App para onboardear al equipo de técnicos de forma simple y clara. Los técnicos
ven su progreso, el tiempo de espera de cada paso, reciben feedback de los
rechazos y siguen instrucciones paso a paso (en español). El manager revisa y
aprueba/rechaza cada envío desde un único panel.

## Stack

- **Next.js 14 (App Router) + React + TypeScript**
- **Prisma ORM** — SQLite en local, PostgreSQL en producción
- **Tailwind CSS**
- **Autenticación** propia con sesión por cookie (JWT, `jose`) y `bcryptjs`
- **Subida de archivos** privada al sistema de archivos (MVP); lista para migrar
  a Cloudinary / S3

## Los 7 pasos del onboarding

1. Firma de contrato (copia impresa → subir foto/escaneo firmado)
2. Completar el JotForm — https://form.jotform.com/261537220764153
3. Identificación (licencia o ID) — subir
4. Fotografía 2×2 — subir
5. Certificación HIPAA — subir
6. Activación de cuenta LSPC Data Health — https://telemed.lspcdata.com/login (paso del manager)
7. Listo para recolectar pruebas — aprobación final del manager

Los pasos se desbloquean en orden: cada uno requiere que el anterior esté
aprobado.

## Puesta en marcha (local)

```bash
npm install
cp .env.example .env        # ya incluido un .env de desarrollo con SQLite
npm run db:push             # crea la base de datos
npm run db:seed             # siembra los 7 pasos + cuentas demo
npm run dev                 # http://localhost:3000
```

### Cuentas de demostración

| Rol     | Correo              | Contraseña  |
| ------- | ------------------- | ----------- |
| Manager | manager@lspc.test   | manager123  |
| Técnico | tecnico@lspc.test   | tecnico123  |

Los técnicos nuevos también pueden registrarse en `/register`.

## Estructura

```
prisma/schema.prisma         Modelo de datos (User, Step, Submission, eventos)
prisma/seed.ts               Siembra de pasos y cuentas demo
src/lib/                     Prisma, auth, subidas, formato (reloj de espera)
src/middleware.ts            Protección de /dashboard y /admin
src/app/login, /register     Autenticación
src/app/dashboard            Panel del técnico (progreso, subidas, feedback)
src/app/admin                Panel del manager (cola de revisión, equipo)
src/app/api/                 Rutas API (auth, submissions, review, archivos)
docs/jotform-instrucciones-video/   Carpeta para el video de cómo llenar el JotForm
uploads/                     Archivos subidos (privados, ignorados por Git)
```

## Subida del video del JotForm

Coloca el video de instrucciones en
`docs/jotform-instrucciones-video/`. Para archivos grandes, sube a un servicio
externo y agrega el enlace en el README de esa carpeta (ver instrucciones ahí).

## Pasar a producción (PostgreSQL + Vercel)

1. En `prisma/schema.prisma`, cambia `provider = "sqlite"` por
   `provider = "postgresql"`.
2. Crea una base PostgreSQL (Railway, Render, Neon o Supabase) y pon su URL en
   `DATABASE_URL`.
3. Genera un `AUTH_SECRET` seguro: `openssl rand -base64 32`.
4. `npx prisma migrate deploy` (o `prisma db push`) y `npm run db:seed`.
5. Despliega en Vercel. Configura las variables de entorno (`DATABASE_URL`,
   `AUTH_SECRET`).

> **Almacenamiento de archivos en producción:** el sistema de archivos de Vercel
> es efímero. Antes de desplegar, migra `src/lib/uploads.ts` y la ruta
> `src/app/api/files/[...path]` a Cloudinary o AWS S3 (guardando la URL/clave en
> `Submission.fileUrl`).

## Privacidad / HIPAA

Los documentos (ID, foto, HIPAA, contrato) se guardan en `uploads/` (fuera de
`public/`) y solo se sirven a su dueño o a un manager autenticado vía
`/api/files/...`. Esto es un punto de partida; un despliegue HIPAA real requiere
almacenamiento cifrado, acuerdos BAA con los proveedores y controles adicionales.

## Roadmap (Fase 2+)

- Notificaciones por correo (Resend/SendGrid) al aprobar/rechazar
- Toggle bilingüe ES/EN
- Acciones en lote para activar cuentas
- Features para el director del programa, reportes y analítica
