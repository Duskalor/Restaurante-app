# SmartMesa — Plan de Escalabilidad

> Documento generado para el proyecto Restaurante-App (SmartMesa).
> Stack actual: React 19 + Vite 8 + Zustand + React Query | Express 5 + Prisma + PostgreSQL | Monorepo pnpm

---

## Tabla de Contenidos

- [Matriz Resumen](#matriz-resumen)
- [Prioridad ALTA](#prioridad-alta)
  - [1. WebSocket/SSE para Cocina en Tiempo Real](#1-sse-para-cocina-en-tiempo-real)
  - [2. React Error Boundaries](#2-react-error-boundaries)
  - [3. Token Refresh / Refresh Tokens](#3-token-refresh--refresh-tokens)
  - [4. Refactorizar SaaSPanel](#4-refactorizar-saaspanel)
- [Prioridad MEDIA](#prioridad-media)
  - [5. Frontend Testing](#5-frontend-testing)
  - [6. Paginación y Virtualización](#6-paginación-y-virtualización)
  - [7. API Response Caching y Optimistic Updates](#7-api-response-caching-y-optimistic-updates)
  - [8. Rate Limiting y Request Validation](#8-rate-limiting-y-request-validation)
- [Prioridad BAJA](#prioridad-baja)
  - [9. PWA / Offline Support](#9-pwa--offline-support)
  - [10. Observabilidad y Logging](#10-observabilidad-y-logging)
  - [11. CI/CD Pipeline](#11-cicd-pipeline)
  - [12. Database Optimization](#12-database-optimization)

---

## Matriz Resumen

| # | Área | Impacto | Esfuerzo | Prioridad |
|---|------|---------|----------|-----------|
| 1 | SSE Cocina en Tiempo Real | Alto | Medio | ALTA |
| 2 | React Error Boundaries | Alto | Bajo | ALTA |
| 3 | Token Refresh | Alto | Medio | ALTA |
| 4 | Refactorizar SaaSPanel | Alto | Alto | ALTA |
| 5 | Frontend Testing | Alto | Alto | MEDIA |
| 6 | Paginación y Virtualización | Alto | Medio | MEDIA |
| 7 | Optimistic Updates | Medio | Medio | MEDIA |
| 8 | Rate Limiting | Medio | Bajo | MEDIA |
| 9 | PWA / Offline | Alto | Alto | BAJA |
| 10 | Observabilidad | Medio | Medio | BAJA |
| 11 | CI/CD Pipeline | Medio | Bajo | BAJA |
| 12 | Database Optimization | Alto | Medio | BAJA |

---

## Prioridad ALTA

---

### 1. SSE para Cocina en Tiempo Real

> **Impacto: Alto | Esfuerzo: Medio | Archivos afectados: 5**

#### Problema Actual

El hook `useKitchenOrders()` en `apps/frontend/src/features/kitchen/hooks.ts` usa **polling cada 5 segundos**:

```typescript
// apps/frontend/src/features/kitchen/hooks.ts — Línea 16
refetchInterval: 5000,
```

Esto significa que **cada 5 segundos**, cada tablet/cómputo conectado a cocina hace:

1. Un `GET /kitchen/orders` al backend
2. El backend ejecuta una query Prisma que trae **TODAS** las órdenes con `include: { table, customer, branch, items }`
3. Filtra items por status (`PENDING | PREPARING | READY`)
4. Filtra órdenes que tengan al menos un item activo
5. Transforma y devuelve la respuesta completa

**Problemas concretos:**

| Problema | Detalle |
|----------|---------|
| **Escalabilidad lineal** | 1 sucursal × 1 tablet = 12 req/min. 10 sucursales × 3 tablets = 360 req/min. 50 sucursales = problemático. |
| **Latencia de 5s** | Cuando un mozo crea una orden, la cocina tarda hasta 5 segundos en verla. En restaurante confluente, 5s es mucho. |
| **Data redundante** | Cada poll trae el dataset completo. Si nada cambió, gastaste bandwidth y CPU al pedo. |
| **Sin distinción de branch** | El endpoint usa `restaurantWhere(user)` pero no filtra por branch explícitamente. |
| **Thundering herd** | Si 10 tablets refetchean al mismo tiempo, el backend recibe 10 queries pesadas simultáneas. |

#### Solución: Server-Sent Events (SSE)

SSE es el patrón estándar en 2026 para comunicación unidireccional server→client. Es superior al polling porque:

| Criterio | Polling (actual) | SSE (propuesto) |
|----------|-----------------|-----------------|
| Latencia percebida | 0–5 segundos | Instantáneo (<100ms) |
| Requests innecesarios | Cada 5s fijos | Solo cuando hay cambios |
| Ancho de banda | Alto (headers HTTP repetidos) | Bajo (1 conexión persistente) |
| Auto-reconexión | No (manual) | Sí (nativa del browser) |
| Complejidad | Baja | Media |
| Soporte browser | Todos | Todos modernos |

**¿Por qué SSE y no WebSockets?**

Tu caso de uso es **server→client solamente**. La cocina solo recibe órdenes, no las crea. WebSockets son para comunicación bidireccional (chat, juegos multijugador, collaborative editing). SSE es más simple, usa HTTP plain, y tiene auto-reconexión built-in.

#### Arquitectura 2026: Dos Estrategias con React Query

Los desarrolladores en 2026 usan dos patrones para integrar SSE con React Query:

**Estrategia A — Invalidación (`invalidateQueries`):**

```
SSE event → queryClient.invalidateQueries({ queryKey }) → React Query re-fetch via queryFn
```

- **Cuándo usarla**: Query compleja (filtros, sorts, joins), más fácil que el backend recalcule
- **Ventaja**: Simple, segura, zero cache drift
- **Desventaja**: Un round-trip extra al servidor por cada evento

**Estrategia B — Mutación Directa (`setQueryData`):**

```
SSE event → queryClient.setQueryData(queryKey, updater) → UI instantánea
```

- **Cuándo usarla**: Data simple, necesitás actualización instantánea
- **Ventaja**: Cero latencia percebida, sin refetch
- **Desventaja**: Riesgo de cache drift si se pierde un evento

**Recomendación para SmartMesa**: Usar **Estrategia A (Invalidación)** como patrón principal. Es más simple, más segura, y evita desync entre el estado local del frontend y el servidor. Podés agregar optimización con `setQueryData` después para casos puntuales.

#### Código de Ejemplo Adaptado al Proyecto

##### Backend — Connection Manager

**Nuevo archivo**: `apps/backend/src/sse/kitchen.channel.ts`

```typescript
/**
 * SSE Connection Manager para el canal de cocina.
 * Mantene un registro de todas las conexiones activas por restaurante/sucursal.
 * Cuando el backend emite un evento, solo se envía a los clientes del restaurante correcto.
 */
import type { ReadableStreamDefaultController } from 'node:stream';

type Connection = {
  controller: ReadableStreamDefaultController;
  restaurantId: string;
  branchId?: string;
  connectedAt: Date;
};

// Map de conexiones activas: connectionId → Connection
const connections = new Map<string, Connection>();

export function registerConnection(
  id: string,
  controller: ReadableStreamDefaultController,
  restaurantId: string,
  branchId?: string,
): void {
  connections.set(id, {
    controller,
    restaurantId,
    branchId,
    connectedAt: new Date(),
  });
  console.log(
    `[SSE] Cliente conectado a cocina: ${id} (restaurant: ${restaurantId})`,
  );
}

export function unregisterConnection(id: string): void {
  connections.delete(id);
  console.log(`[SSE] Cliente desconectado de cocina: ${id}`);
}

/**
 * Emite un evento SSE a todos los clientes de cocina de un restaurante.
 * Opcionalmente filtra por branchId.
 */
export function broadcastToKitchen(
  restaurantId: string,
  payload: unknown,
  options?: { branchId?: string; eventName?: string },
): void {
  const eventLine = options?.eventName ? `event: ${options.eventName}\n` : '';
  const message = `${eventLine}data: ${JSON.stringify(payload)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  let sent = 0;
  for (const [id, conn] of connections.entries()) {
    // Solo enviar a clientes del mismo restaurante
    if (conn.restaurantId !== restaurantId) continue;
    // Si se especifica branch, filtrar por branch
    if (options?.branchId && conn.branchId !== options.branchId) continue;

    try {
      conn.controller.enqueue(encoded);
      sent++;
    } catch {
      // Stream cerrado (cliente se desconectó sin cleanup)
      connections.delete(id);
    }
  }

  if (sent > 0) {
    console.log(
      `[SSE] Broadcast a cocina: ${sent} clientes (restaurant: ${restaurantId})`,
    );
  }
}

/** Devuelve el número de clientes conectados a cocina para un restaurante */
export function getConnectionCount(restaurantId: string): number {
  let count = 0;
  for (const conn of connections.values()) {
    if (conn.restaurantId === restaurantId) count++;
  }
  return count;
}
```

##### Backend — SSE Endpoint

**Nuevo archivo**: `apps/backend/src/routes/kitchen-sse.routes.ts`

```typescript
import { Router } from 'express';
import { Readable } from 'node:stream';
import { authMiddleware } from '../middlewares/auth';
import {
  registerConnection,
  unregisterConnection,
} from '../sse/kitchen.channel';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /kitchen/sse — Endpoint SSE para cocina en tiempo real.
 *
 * El cliente abre una conexión persistiente. Cuando el backend detecta
 * un cambio (nueva orden, cambio de estado), emite un evento via broadcastToKitchen().
 *
 * Headers requeridos para SSE:
 * - Content-Type: text/event-stream
 * - Cache-Control: no-cache (evitar caching de proxies)
 * - Connection: keep-alive
 * - X-Accel-Buffering: no (deshabilitar buffering de nginx)
 */
router.get('/kitchen/sse', authMiddleware, (req: Request, res: Response) => {
  const connectionId = crypto.randomUUID();
  const user = req.user;

  // Crear ReadableStream — el client lee desde aquí
  const stream = new ReadableStream({
    start(controller) {
      // Registrar esta conexión en el canal de cocina
      registerConnection(
        connectionId,
        controller,
        user?.restaurantId ?? '',
        user?.branchId,
      );

      // Keepalive ping cada 30s para evitar que proxies/CDNs cierren la conexión
      const keepalive = setInterval(() => {
        try {
          // Comentarios SSE (líneas que empiezan con ':') se ignoran por el browser
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30_000);

      // Cleanup cuando el cliente cierra la conexión
      req.on('close', () => {
        clearInterval(keepalive);
        unregisterConnection(connectionId);
      });
    },
  });

  // Configurar headers SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Flushear headers inmediatamente (no esperar al primer chunk)
  res.flushHeaders();

  // Pipe del ReadableStream web al Response de Express
  // (Express usa Node.js streams, no web streams)
  const readableNode = new Readable({
    read() {
      const reader = stream.getReader();
      reader.read().then(function process({ done, value }) {
        if (done) return;
        if (value) res.write(Buffer.from(value));
        reader.read().then(process);
      });
    },
  });

  readableNode.pipe(res);
});

export default router;
```

##### Backend — Emitir Eventos desde el Service

**Modificar**: `apps/backend/src/services/kitchen.service.ts`

```typescript
import type { KitchenItemStatus } from '@prisma/client';
import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { HttpError } from '../utils/errors';
import { restaurantWhere } from '../utils/scopes';
import { broadcastToKitchen } from '../sse/kitchen.channel'; // ← NUEVO

export async function listKitchenOrders(user?: AuthUser) {
  // ... (sin cambios)
}

export async function updateKitchenItemStatus(
  itemId: string,
  kitchenStatus: KitchenItemStatus,
  user?: AuthUser,
) {
  const existingItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      order: {
        include: {
          branch: true,
        },
      },
    },
  });

  if (!existingItem) {
    throw new HttpError('Item no encontrado.', 404);
  }

  if (
    !user?.isSuperAdmin &&
    existingItem.order?.branch?.restaurantId !== user?.restaurantId
  ) {
    throw new HttpError(
      'No tienes permiso para modificar items de otro restaurante.',
      403,
    );
  }

  const updatedItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: { kitchenStatus },
  });

  // ─── Emitir evento SSE a todos los clientes de cocina ───
  broadcastToKitchen(
    user?.restaurantId ?? '',
    {
      type: 'KITCHEN_ITEM_STATUS_CHANGED',
      itemId,
      orderNumber: existingItem.order.orderNumber,
      newStatus: kitchenStatus,
      timestamp: new Date().toISOString(),
    },
    {
      eventName: 'kitchen:update',
      branchId: user?.branchId,
    },
  );
  // ──────────────────────────────────────────────────────────

  return updatedItem;
}
```

##### Backend — Registrar la Ruta SSE

**Modificar**: `apps/backend/src/index.ts`

```typescript
import kitchenSseRoutes from './routes/kitchen-sse.routes'; // ← NUEVO

// ... (imports existentes)

app.use(kitchenRoutes);
app.use(kitchenSseRoutes); // ← NUEVO — después de kitchenRoutes
```

##### Frontend — Custom Hook con SSE

**Reemplazar**: `apps/frontend/src/features/kitchen/hooks.ts`

```typescript
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KitchenItemStatus, KitchenOrder } from '@restaurante/shared';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

export const kitchenOrdersQueryKey = ['kitchen', 'orders'] as const;

/**
 * Hook principal de cocina.
 *
 * ANTES: Polling cada 5s con refetchInterval (12 requests/min por cliente)
 * DESPUÉS: Fetch inicial + SSE para actualizaciones (1 request + conexión persistente)
 *
 * La estrategia es INVALIDACIÓN: cuando llega un evento SSE,
 * le decimos a React Query que los datos están stale y él re-fetchea automáticamente.
 */
export function useKitchenOrders() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  // Query inicial — se ejecuta UNA vez al montar
  const query = useQuery({
    queryKey: kitchenOrdersQueryKey,
    queryFn: () => apiFetch<KitchenOrder[]>('/kitchen/orders'),
    enabled: Boolean(token),
    staleTime: 30_000, // 30s — SSE se encarga de invalidar cuando hay cambios
    placeholderData: (previous) => previous, // Mantener data previa mientras re-fetchea
  });

  // Conexión SSE — se abre UNA vez, no cada 5 segundos
  useEffect(() => {
    if (!token) return;

    const apiBase =
      import.meta.env.VITE_API_URL || 'http://46.183.112.122:3001';
    const eventSource = new EventSource(`${apiBase}/kitchen/sse`);

    // Escuchar eventos de actualización de cocina
    eventSource.addEventListener('kitchen:update', () => {
      // Invalidar el cache → React Query re-fetchea automáticamente
      queryClient.invalidateQueries({ queryKey: kitchenOrdersQueryKey });
    });

    // Log de conexión
    eventSource.onopen = () => {
      console.log('[SSE] Conectado a canal de cocina');
    };

    // Error handler — EventSource se reconecta automáticamente
    eventSource.onerror = () => {
      console.warn('[SSE] Conexión perdida, reconectando...');
    };

    // Cleanup al desmontar el componente
    return () => {
      eventSource.close();
      console.log('[SSE] Desconectado del canal de cocina');
    };
  }, [token, queryClient]);

  return query;
}

// useUpdateKitchenItemStatus se mantiene SIN CAMBIOS
// La mutación ya es correcta — solo necesita invalidar el cache
interface UpdateKitchenItemStatusInput {
  itemId: string;
  kitchenStatus: KitchenItemStatus;
}

export function useUpdateKitchenItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, kitchenStatus }: UpdateKitchenItemStatusInput) =>
      apiFetch(`/kitchen/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ kitchenStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenOrdersQueryKey });
    },
  });
}
```

#### Flujo Completo: Antes vs Después

```
ANTES (Polling — actual):
═══════════════════════════════════════════════════════════════
KitchenView montado
  → useKitchenOrders() inicia refetchInterval: 5000
  → Cada 5s: GET /kitchen/orders → Prisma query → Response
  → Cada 5s × N tablets = N requests cada 5 segundos
  → POST /kitchen/items/:id/status → invalida → re-fetch completo
  → Total: ~12 requests/min por tablet (incluso si NADA cambió)

DESPUÉS (SSE — propuesto):
═══════════════════════════════════════════════════════════════
KitchenView montado
  → useKitchenOrders() hace GET /kitchen/orders UNA vez
  → Se abre conexión SSE a /kitchen/sse (1 conexión persistente)
  → Cuando un mozo crea orden:
    → Backend emite evento via broadcastToKitchen()
    → React Query invalida → re-fetch automático
  → Cuando cocina cambia estado:
    → Backend emite evento via broadcastToKitchen()
    → React Query invalida → re-fetch automático
  → Zero requests innecesarios
  → Total: 1 request inicial + eventos solo cuando hay cambios
```

#### Archivos a Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `apps/backend/src/sse/kitchen.channel.ts` | **CREAR** | Connection manager para SSE |
| `apps/backend/src/routes/kitchen-sse.routes.ts` | **CREAR** | Endpoint SSE `/kitchen/sse` |
| `apps/backend/src/services/kitchen.service.ts` | **MODIFICAR** | Agregar `broadcastToKitchen()` después de mutaciones |
| `apps/backend/src/index.ts` | **MODIFICAR** | Registrar nueva ruta SSE |
| `apps/frontend/src/features/kitchen/hooks.ts` | **REEMPLAZAR** | Reemplazar polling por SSE + invalidación |

---

### 2. React Error Boundaries

> **Impacto: Alto | Esfuerzo: Bajo | Archivos afectados: ~10**

#### Problema Actual

No existe ningún React Error Boundary en la aplicación. Si un componente crashea (por datos malformados, error de rendering, etc.), se tumba **toda la aplicación**.

El componente más riesgoso es `SaaSPanel.tsx` (1000+ líneas) — un error ahí destruye la experiencia de usuario completa.

#### Solución

Implementar Error Boundaries por feature/ruta usando `react-error-boundary` o un wrapper custom:

```typescript
// apps/frontend/src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-lg font-semibold text-rose-700">
              Algo salió mal
            </p>
            <p className="mt-2 text-sm text-rose-600">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700"
            >
              Intentar de nuevo
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

Uso en el router:

```typescript
// apps/frontend/src/main.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

// Envolver cada ruta
{
  path: '/kitchen',
  element: (
    <ErrorBoundary>
      <KitchenView />
    </ErrorBoundary>
  ),
}
```

---

### 3. Token Refresh / Refresh Tokens

> **Impacto: Alto | Esfuerzo: Medio | Archivos afectados: ~5**

#### Problema Actual

- Los JWT expiran en **9 horas** (configuración backend)
- No hay mecanismo de refresh — cuando expira, todas las llamadas API fallan silenciosamente
- El usuario sigue trabajando y de repente todo deja de funcionar
- No hay interceptor que detecte 401 y renueve el token automáticamente

#### Solución

Implementar refresh tokens con dos tokens:

| Token | Duración | Uso |
|-------|----------|-----|
| Access Token | 15 minutos | Cada request API |
| Refresh Token | 7 días | Renovar el access token |

**Backend:**
- Nuevo endpoint `POST /auth/refresh` que valida el refresh token y devuelve un nuevo access token
- Tabla `RefreshToken` en Prisma con `userId`, `expiresAt`, `revokedAt`

**Frontend:**
- Interceptor en `apiFetch` que detecte 401 → llama a `/auth/refresh` → re-intenta el request original
- Si el refresh token también expiró → logout forzado

---

### 4. Refactorizar SaaSPanel

> **Impacto: Alto | Esfuerzo: Alto | Archivos afectados: ~8**

#### Problema Actual

`apps/frontend/src/features/saas/SaaSPanel.tsx` es un monolito de **1000+ líneas** que:
- Usa estado local en vez de React Query (tiene un comentario que lo dice explícitamente)
- Maneja CRUD de restaurantes, suscripciones, y configuración de SaaS todo en un solo archivo
- Es imposible de testear, mantener o escalar

#### Solución

Separar en sub-componentes y migrar a React Query:

```
features/saas/
  SaaSPanel.tsx              → Shell/layout (200 líneas max)
  RestaurantList.tsx          → Tabla de restaurantes
  RestaurantForm.tsx          → Formulario de creación/edición
  SubscriptionCard.tsx        → Info de suscripción
  hooks.ts                    → React Query hooks (queries + mutations)
  types.ts                    → Tipos específicos de SaaS
```

---

## Prioridad MEDIA

---

### 5. Frontend Testing

> **Impacto: Alto | Esfuerzo: Alto | Archivos afectados: Config + tests**

#### Problema Actual

- **Cero tests en el frontend** — ni siquiera hay configuración de testing
- No hay `vitest.config.ts` ni `@testing-library/react`
- El backend solo tiene smoke tests (`tests/smoke.test.js`)

#### Solución

**Testing Library:**
- Vitest + React Testing Library + jsdom para unit/integration tests
- Playwright para E2E tests en flujos críticos

**Estrategia de testing:**

| Nivel | Qué testear | Herramienta |
|-------|-------------|-------------|
| Unit | Hooks de React Query, utilidades (`api.ts`, `ui.ts`) | Vitest |
| Integration | Guards de auth, formularios, interacciones | Vitest + RTL |
| E2E | Login → POS → Cocina → Caja (flujo completo) | Playwright |

**Cobertura mínima recomendada:**
- Auth guards: 100%
- Hooks de React Query: 80%
- Componentes de presentación: 50%
- Flujos E2E críticos: 100%

---

### 6. Paginación y Virtualización

> **Impacto: Alto | Esfuerzo: Medio | Archivos afectados: Backend routes + Frontend hooks**

#### Problema Actual

Los endpoints GET devuelven **todos los registros** sin paginación:

```typescript
// apps/backend/src/services/kitchen.service.ts
const orders = await prisma.order.findMany({
  where: restaurantWhere(user),
  include: { table: true, customer: true, branch: true, items: true },
  orderBy: { createdAt: 'asc' },
});
```

Con miles de productos/clientes/órdenes, el frontend se trabará al renderizar listas enormes.

#### Solución

**Backend — Paginación cursor-based:**

```typescript
// Ejemplo de implementación
async function listProducts(user?: AuthUser, params?: { cursor?: string; limit?: number }) {
  const limit = params?.limit ?? 20;
  const products = await prisma.product.findMany({
    where: restaurantWhere(user),
    take: limit + 1, // +1 para detectar si hay más
    cursor: params?.cursor ? { id: params.cursor } : undefined,
    orderBy: { name: 'asc' },
  });

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, -1) : products;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
```

**Frontend — `useInfiniteQuery`:**

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['products'],
  queryFn: ({ pageParam }) => apiFetch(`/products?cursor=${pageParam}`),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: undefined as string | undefined,
});
```

**Virtualización** para listas largas (>100 items): `@tanstack/react-virtual`

---

### 7. API Response Caching y Optimistic Updates

> **Impacto: Medio | Esfuerzo: Medio | Archivos afectados: Frontend hooks**

#### Problema Actual

Todas las mutaciones invalidan y re-fetchean completo:

```typescript
// apps/frontend/src/features/kitchen/hooks.ts — Línea 43-45
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: kitchenOrdersQueryKey });
},
```

Con datos grandes, esto causa un flash de "loading" innecesario.

#### Solución

**Optimistic Updates** para mutaciones críticas:

```typescript
useMutation({
  mutationFn: updateKitchenItemStatus,
  onMutate: async ({ itemId, kitchenStatus }) => {
    // Cancelar re-fetches en curso
    await queryClient.cancelQueries({ queryKey: kitchenOrdersQueryKey });

    // Guardar estado previo para rollback
    const previous = queryClient.getQueryData(kitchenOrdersQueryKey);

    // Actualizar cache optimísticamente
    queryClient.setQueryData<KitchenOrder[]>(
      kitchenOrdersQueryKey,
      (old) =>
        old?.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, kitchenStatus } : item,
          ),
        })) ?? [],
    );

    return { previous };
  },
  onError: (_err, _vars, context) => {
    // Rollback en caso de error
    queryClient.setQueryData(kitchenOrdersQueryKey, context?.previous);
  },
  onSettled: () => {
    // Siempre re-fetch para asegurar consistencia
    queryClient.invalidateQueries({ queryKey: kitchenOrdersQueryKey });
  },
});
```

---

### 8. Rate Limiting y Request Validation

> **Impacto: Medio | Esfuerzo: Bajo | Archivos afectados: Middlewares**

#### Problema Actual

- No hay rate limiting en ningún endpoint
- No hay validación de request bodies (solo se valida `env.ts` con Valibot)
- Cualquiera puede hacer spam de requests al backend

#### Solución

```bash
pnpm add express-rate-limit
```

```typescript
// apps/backend/src/middlewares/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas requests. Intentá más tarde.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // máximo 10 intentos de login por 15 min
  message: { error: 'Demasiados intentos de login.' },
});
```

Aplicar en `index.ts`:

```typescript
app.use('/auth', authLimiter);
app.use(apiLimiter);
```

---

## Prioridad BAJA

---

### 9. PWA / Offline Support

> **Impacto: Alto | Esfuerzo: Alto | Archivos afectados: Config + Service Worker**

#### Problema Actual

Si se cae internet, el restaurante **no puede operar**. No hay soporte offline.

#### Solución

- **Service Worker** para cachear assets estáticos (HTML, CSS, JS, icons)
- **IndexedDB** (via Dexie.js) para cachear datos críticos (menú, mesas, configuración)
- **Background Sync** para enviar órdenes cuando vuelva la conexión
- **Manifest.json** para instalación como PWA

Esto es **crítico** para restaurantes en zonas con internet inestable.

---

### 10. Observabilidad y Logging

> **Impacto: Medio | Esfuerzo: Medio | Archivos afectados: Backend**

#### Problema Actual

Solo hay `console.error` en el error handler. No hay métricas, tracing, ni structured logging.

#### Solución

- **Structured logging**: `pino` o `winston` (reemplazar `console.log`)
- **Request tracing**: correlation IDs para seguir requests across services
- **Health check detallado**: endpoints que reporten estado de DB, memoria, uptime
- **Error tracking**: Sentry o similar para capturar errores en frontend y backend

---

### 11. CI/CD Pipeline

> **Impacto: Medio | Esfuerzo: Bajo | Archivos afectados: `.github/workflows/`**

#### Problema Actual

No hay ningún pipeline de CI/CD configurado.

#### Solución

GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: restaurante_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/restaurante_test
          JWT_SECRET: test-secret
```

---

### 12. Database Optimization

> **Impacto: Alto | Esfuerzo: Medio | Archivos afectados: Prisma schema + migrations**

#### Problema Actual

El schema tiene 25+ modelos pero no hay:
- Índices compuestos optimizados
- Connection pooling
- Estrategia de archivado de datos antiguos

#### Solución

**Índices compuestos** para las queries más frecuentes:

```prisma
// apps/backend/prisma/schema.prisma
model Order {
  // ... campos existentes ...

  @@index([restaurantId, status, createdAt])
  @@index([branchId, status])
}

model OrderItem {
  // ... campos existentes ...

  @@index([orderId, kitchenStatus])
  @@index([kitchenStatus])
}

model Product {
  // ... campos existentes ...

  @@index([restaurantId, categoryId])
  @@index([restaurantId, name])
}
```

**Connection pooling**: PgBouncer o Prisma Accelerate

**Archivado**: Mover órdenes antiguas (>6 meses) a una tabla `OrderArchive`

---

## Referencias

- [TanStack Query — SSE Integration Guide (2026)](https://ollioddi.dev/blog/tanstack-sse-guide)
- [TkDodo — Using WebSockets with React Query](https://tkdodo.eu/blog/using-web-sockets-with-react-query)
- [MDN — Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [MDN — EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [react-use-sse — React hook for SSE](https://github.com/StyleShit/react-use-sse)

---

*Documento generado como parte del análisis de escalabilidad de SmartMesa.*
