# SmartMesa

Sistema de gestión de restaurantes multi-tenant: pedidos de salón, cocina, caja,
inventario y clientes para múltiples restaurantes y sucursales desde una misma
instalación, más un panel SaaS para administrar los restaurantes dados de alta.

Monorepo pnpm con un backend Express + Prisma + PostgreSQL, un frontend React SPA y un
paquete de tipos compartido que actúa como contrato de API entre ambos.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express 5, Prisma 6, PostgreSQL, TypeScript estricto |
| Frontend | React 19, Vite 8, Tailwind CSS 4, TanStack Query, zustand, react-router v7, TypeScript estricto |
| Contrato de API | `@restaurante/shared` — paquete de solo tipos, cero dependencias |
| Auth | JWT (9h de expiración) + autorización por rol |
| Gestor de paquetes | pnpm (workspaces), Node ≥ 22 |

## Estructura del monorepo

```
Restaurante-app/
├── apps/
│   ├── backend/              # API Express + Prisma
│   │   ├── prisma/            # schema.prisma (~30 modelos) + migraciones
│   │   └── src/
│   │       ├── routes/         # definición de endpoints por módulo
│   │       ├── controllers/    # parseo de request/response
│   │       ├── services/       # reglas de negocio + acceso a Prisma
│   │       ├── middlewares/    # auth (JWT), authorize (rol), error-handler
│   │       ├── whatsapp/       # parser de texto libre → pedido de delivery
│   │       └── utils/          # wire.ts (guarda de contrato), scopes.ts (multi-tenant)
│   └── frontend/             # SPA React
│       └── src/
│           ├── features/       # auth, dashboard, pos, tables, kitchen, cashier,
│           │                   # inventory, customers, reports, settings, saas
│           ├── lib/            # apiFetch, navegación, utilidades de UI
│           └── stores/         # zustand: sesión (auth), estado de POS
├── packages/
│   └── shared/                # @restaurante/shared — contrato de tipos wire
├── docs/
│   └── architecture/          # documentación C4 (ver más abajo)
├── pnpm-workspace.yaml
└── package.json
```

## Arquitectura, en breve

- **Backend en capas**: `routes → controllers → services`, sin lógica de negocio en
  los controllers. Autorización por rol vía middleware (`authorize('ADMIN', 'CAJA', ...)`)
  sobre cada ruta que lo necesita.
- **Frontend por features**: cada área de negocio (`pos`, `kitchen`, `cashier`...) es
  una carpeta autocontenida con su vista, sus hooks de datos y sus componentes. El
  shell (`App.tsx`, ~300 líneas) solo monta sidebar, header y el `<Outlet/>` ruteado —
  no contiene lógica de dominio.
- **Cache de servidor con TanStack Query**: las mutaciones invalidan las query keys
  relacionadas (por ejemplo, cobrar un pedido invalida `orders`, `tables` y
  `payments` a la vez) en vez de mantener estado duplicado a mano.
- **Contrato de tipos compartido**: `packages/shared` es la única fuente de verdad de
  lo que viaja por HTTP. Se consume con `import type` (se borra al compilar) en ambas
  apps, y el backend usa `assertWire<T>()` para que un cambio de `include` de Prisma
  que rompa el contrato falle en `tsc`, no en producción.
- **Multi-tenant por sucursal**: `Restaurant → Branch` scoping en cada query relevante
  (`restaurantWhere(user)` en `apps/backend/src/utils/scopes.ts`); un superadmin
  (`isSuperAdmin: true`) atraviesa ese scoping y accede a un panel SaaS aparte para
  administrar restaurantes y suscripciones.

Documentación completa, con diagramas C4 y de flujos: **[`docs/architecture/`](./docs/architecture/README.md)**.

## Quickstart

Requisitos: Node ≥ 22, pnpm, una instancia de PostgreSQL.

```bash
# 1. Instalar dependencias del monorepo (incluye packages/shared y ambas apps)
pnpm install

# 2. Configurar variables de entorno
#    apps/backend/.env
DATABASE_URL="postgresql://usuario:password@localhost:5432/smartmesa"
JWT_SECRET="una-clave-larga-y-aleatoria"
PORT=3001                # opcional, default 3001
APIPERU_TOKEN=           # opcional

#    apps/frontend/.env
VITE_API_URL="http://localhost:3001"   # sin esto, el frontend cae en un fallback hardcodeado — definila siempre

# 3. Aplicar el schema a la base de datos
pnpm --filter backend exec prisma migrate dev

# 4. Levantar backend y frontend (dos terminales)
pnpm dev:backend     # tsx src/index.ts — http://localhost:3001
pnpm dev:frontend    # vite dev server — http://localhost:5173

# Alternativa con recarga automática del backend ante cambios:
pnpm --filter backend dev   # tsx watch
```

Otros scripts de raíz: `pnpm build` (build de todos los workspaces), `pnpm test`
(vitest en backend), `pnpm lint`.

## Estado del proyecto / Roadmap

SmartMesa cubre el ciclo operativo diario de un restaurante (pedidos, cocina, caja,
catálogo, mesas) más la capa SaaS para dar de alta restaurantes. Hay funcionalidad
modelada en la base de datos que todavía no tiene API ni UI — se documenta como
roadmap, no se oculta:

- Reservas de mesa, zonas de salón (`DiningArea`), variantes de producto (`Modifier`).
- Control de caja: apertura/cierre de sesión, movimientos de efectivo.
- Inventario: stock por insumo, recetas, movimientos, compras a proveedores.
- Auditoría de cambios (`AuditLog`) y permisos finos por rol (`Permission`/`RolePermission`).

Detalle completo, con qué modelo de Prisma corresponde a cada uno: [roadmap del
dominio en `03-modelo-datos.md`](./docs/architecture/03-modelo-datos.md#roadmap-del-dominio).

### Limitaciones conocidas

Documentadas para que quien lea el código no las descubra por sorpresa:

- **El botón "Entregado" de cocina está roto**: el frontend puede enviar
  `kitchenStatus: SERVED`, pero el backend solo acepta `PENDING`, `PREPARING` y
  `READY` — responde 400. Ver [`05-estados.md`](./docs/architecture/05-estados.md).
- **`receiptType` nunca llega al backend**: la elección de tipo de comprobante en el
  panel de caja no viaja en `PATCH /orders/{id}/pay` ni vuelve en la respuesta —
  ni `Order` ni `Payment` tienen ese campo en el contrato.
- **Autorización por nombre de rol, no por permisos**: `authorize('ADMIN', 'CAJA')`
  compara el nombre del rol como string en cada ruta. Los modelos `Permission` y
  `RolePermission` existen en el schema pero no se usan — no hay RBAC granular todavía.
- **`Order.status` tiene estados inalcanzables**: el enum define 8 valores pero el
  código solo produce `DRAFT`, `CONFIRMED` y `PAID`. Detalle en
  [`05-estados.md`](./docs/architecture/05-estados.md).
- **`POST /saas/restaurants` devuelve el usuario admin con `passwordHash` incluido**:
  es el único endpoint que no filtra ese campo antes de responder (documentado en
  [`packages/shared/README.md`](./packages/shared/README.md)).
- **Sin variable de entorno, el frontend apunta a una IP hardcodeada** en vez de
  `localhost` (`apps/frontend/src/lib/api.ts`) — definir `VITE_API_URL` siempre en
  desarrollo.
