# @restaurante/shared

Fuente única de verdad del **contrato de la API**: los tipos de request/response que
viajan por HTTP entre `apps/backend` y `apps/frontend`. Si un tipo de aquí no coincide
con lo que el backend realmente devuelve, es un bug — no una preferencia de estilo.

## Camino rápido

1. Necesitás el tipo de una respuesta o de un body → buscalo en `src/<módulo>.ts`
   (un archivo por módulo de backend: `orders.ts`, `products.ts`, etc.).
2. Importalo con `import type`, nunca `import` a secas (el paquete no existe en
   runtime, se borra en build):
   ```ts
   import type { ProductWithRelations, CreateProductRequest } from '@restaurante/shared';
   ```
3. Si el tipo no existe todavía o quedó desactualizado, seguí la sección
   [Cómo agregar o cambiar un tipo](#cómo-agregar-o-cambiar-un-tipo) antes de tocar código.

## Por qué existe

Antes de esto, `apps/frontend/src/features/saas/SaaSPanel.tsx` definía a mano
`SaasUser`, `SaasBranch`, `SaasSubscription`, `SaasRestaurant` — interfaces
"defensivas" (todo opcional) que nadie garantizaba que coincidieran con lo que el
backend mandaba. Con dos copias del mismo contrato, una se desactualiza tarde o
temprano. Este paquete es la única copia.

## Qué NO es este paquete

| No es... | Es... |
|---|---|
| Un espejo de `schema.prisma` | Una descripción de lo que sale por HTTP después de `res.json()` |
| Un paquete con lógica o runtime | Solo `interface`/`type`, se borra al compilar (`import type`) |
| Dependiente de `@prisma/client` | Cero dependencias — lo importan frontend (bundler) y backend (nodenext) por igual |

## Estructura

```
src/
  common.ts             # IsoDateString, DecimalString, ApiErrorResponse, ApiMessageResponse, Customer
  branches.ts           # roles.ts, business-settings.ts, categories.ts, tables.ts...  (uno por módulo)
  auth.ts, users.ts, saas.ts, orders.ts, payments.ts, kitchen.ts, products.ts, whatsapp.ts
  index.ts              # barrel: re-exporta todo con `export * from './modulo.js'`
```

- Un archivo por módulo del backend (mismo nombre que su carpeta en
  `apps/backend/src/services|controllers`).
- `common.ts` solo tiene lo que usan dos o más módulos (fechas, decimales, el
  envelope de error, `Customer` porque aparece anidado en `Order` y `Payment` aunque
  `/customers` todavía no tiene tipos propios).
- Los imports **entre** archivos de este paquete llevan extensión `.js` explícita
  (`import type { Branch } from './branches.js'`) aunque el archivo sea `.ts` — lo
  exige la resolución `nodenext` que usa el backend al leer este paquete, y
  `moduleResolution: bundler` del frontend también la acepta. No la saques.

## Cómo cada app lo consume

Ambas apps lo agregan como dependencia de workspace:

```json
"@restaurante/shared": "workspace:*"
```

y siempre con `import type` — el paquete no emite JS, así que un `import` normal
rompería en build:

```ts
// backend (apps/backend/src/services/products.service.ts)
import type { ProductWithRelations } from '@restaurante/shared';

// frontend (apps/frontend/src/features/saas/SaaSPanel.tsx)
import type { SaasRestaurant } from '@restaurante/shared';
```

No hace falta build step: `exports` en `package.json` apunta directo a `src/index.ts`,
y tanto `tsc --noEmit` como Vite resuelven `.ts` sin compilar el paquete aparte.

## Convenciones para agregar o cambiar un tipo

| Regla | Motivo |
|---|---|
| El tipo describe el **wire**, no la DB | `Date` de Prisma → `IsoDateString` (`string`); `Decimal` de Prisma → `DecimalString` (`string \| number`, porque algunos endpoints devuelven un `number` calculado a mano en vez de pasar por Prisma) |
| Solo `string` para status/plan que en `schema.prisma` son `String` (no `enum`) | `Restaurant.status` y `Restaurant.planType`/`Subscription.planType` son columnas `String` libres — forzar una unión ahí mentiría sobre lo que la DB realmente acepta |
| Para los que sí son `enum` en Prisma, usá el patrón const-object | `const ORDER_STATUS = { DRAFT: 'DRAFT', ... } as const; type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];` — fuente única, autocomplete, y el valor sigue existiendo en runtime si algún día hace falta |
| Objetos anidados van en su propia `interface`, nunca inline | Mismo patrón en todo el paquete: `Order` referencia `Table \| null`, no lo repite inline |
| Marcá opcional (`?`) solo lo que el backend realmente puede omitir | Nada de "todo opcional por las dudas" — si el campo siempre viene (aunque sea `null`), el tipo es `T \| null`, no `T?` |
| Cero dependencias, cero `@prisma/client` | Si necesitás algo de Prisma, el tipo va mal ubicado — pertenece a `apps/backend`, no acá |
| **El backend es el dueño del contrato** | Si backend y frontend no coinciden, se corrige el tipo compartido para reflejar lo que el backend *realmente* manda — y si eso está mal, se arregla el backend, no se lo disfraza en el tipo |

### El backend se audita solo (drift guard)

`apps/backend/src/utils/wire.ts` expone `Wire<T>` y `assertWire()`. Los resultados de
Prisma tienen `Date`/`Decimal` reales en memoria; los tipos de este paquete describen
la versión ya serializada (`string`). `assertWire()` no hace nada en runtime — solo
traduce el tipo para que un `service` anotado como `Promise<ProductWithRelations[]>`
falle en `tsc` si el `include`/`select` de Prisma deja de coincidir con el contrato:

```ts
export async function listProducts(user?: AuthUser): Promise<ProductWithRelations[]> {
  const products = await prisma.product.findMany({ include: { category: true, branch: true } });
  return assertWire(products); // si el include cambia y ya no matchea, esto no compila
}
```

Ya está aplicado en `auth` (login), `products`, `orders`, `tables` y `saas`. Si tocás
esos endpoints, mantené el patrón; si agregás cobertura a otro módulo, seguí el mismo.

### Regla de PR

**Un cambio de backend que modifica una respuesta (agrega/quita/renombra un campo,
cambia un `include`) actualiza el tipo correspondiente acá en el mismo PR.** Si el
tipo compartido queda desactualizado, `tsc --noEmit` del lado que lo consume no lo
va a detectar solo — el chequeo automático (`assertWire`) únicamente cubre los
módulos donde el backend ya lo adoptó.

## Gaps conocidos (documentados, no arreglados en esta fase)

- `saas.ts` → `SaasCreatedUser`: `POST /saas/restaurants` hoy devuelve el usuario
  admin **con `passwordHash` incluido** (el único endpoint que no lo filtra). El tipo
  lo refleja tal cual porque así responde el backend ahora mismo — no es el contrato
  ideal, es el real. Si se corrige el backend para que deje de mandar `passwordHash`,
  achicar este tipo en el mismo PR.
- `SaasRestaurant` (extiende `Restaurant`) no tiene campo `amount` — nunca lo tuvo en
  `schema.prisma`, solo `Subscription.amount` lo tiene. El frontend viejo asumía un
  fallback `restaurant.amount` que en la práctica siempre era `undefined`.
