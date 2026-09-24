# CodePair — Monorepo

Plataforma de **Pair Programming colaborativo** entre pares.

## Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Backend     | NestJS · TypeScript · Prisma ORM · MySQL 8       |
| Frontend    | Next.js 15 (App Router) · TypeScript · Tailwind  |
| Auth        | JWT · HttpOnly Cookies · Argon2                  |
| Real-time   | Socket.IO                                        |
| Validación  | class-validator (BE) · Zod + React Hook Form (FE)|

## Estructura del Monorepo

```
codepair/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Esquema MySQL
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/         # Configuraciones tipadas
│   │       ├── database/       # DatabaseService + Health
│   │       ├── common/
│   │       │   ├── filters/    # HttpExceptionFilter
│   │       │   ├── interceptors/
│   │       │   ├── guards/
│   │       │   └── logger/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── sessions/
│   │       │   ├── invitations/
│   │       │   ├── messages/
│   │       │   ├── notifications/
│   │       │   └── health/
│   │       └── gateway/        # Socket.IO WebSocket
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/            # App Router (páginas)
│           ├── components/     # Componentes reutilizables
│           ├── features/       # Módulos de features
│           ├── hooks/          # Custom hooks
│           ├── lib/            # Utilidades (api-client, validations)
│           ├── services/       # Llamadas a la API
│           ├── store/          # Estado global
│           └── types/          # TypeScript types compartidos
└── packages/
    └── shared-types/           # Tipos compartidos API ↔ Web
```

## Quick Start

### 1. Pre-requisitos
- Node.js >= 20
- MySQL 8.x corriendo localmente (o Docker)
- npm >= 10

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tus credenciales MySQL

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

### 4. Base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas
npm run db:migrate

# Datos de prueba (admin + usuarios demo)
npm run db:seed
```

### 5. Iniciar en desarrollo

```bash
npm run dev
# API:  http://localhost:3001/api/v1
# Web:  http://localhost:3000
# Docs: http://localhost:3001/api/docs
```

## Scripts disponibles

| Comando           | Descripción                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Inicia API + Web en paralelo         |
| `npm run build`   | Build de producción (API + Web)      |
| `npm run lint`    | Lint de todo el monorepo             |
| `npm run typecheck` | TypeScript check                  |
| `npm run db:generate` | Genera el cliente Prisma         |
| `npm run db:migrate`  | Ejecuta migraciones              |
| `npm run db:seed`     | Inserta datos de prueba          |
| `npm run db:studio`   | Abre Prisma Studio               |

## Usuarios de prueba (después del seed)

| Email                | Password              | Rol     |
|---------------------|-----------------------|---------|
| admin@codepair.dev   | Admin@codepair2024!   | ADMIN   |
| alice@demo.com       | Demo@codepair2024!    | MENTOR  |
| bob@demo.com         | Demo@codepair2024!    | STUDENT |
