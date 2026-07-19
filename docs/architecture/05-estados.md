# 05 — Máquinas de estado

Tres estados relevantes del dominio. En los tres casos se documenta también la
diferencia entre **lo que el enum de Prisma permite** y **lo que el backend realmente
ejecuta** — es la parte más honesta (y más útil) de este documento.

## Estado del pedido (`Order.status`)

`schema.prisma` define 8 valores para `OrderStatus`, pero el código de
`apps/backend/src/services/orders.service.ts` y `payments.service.ts` solo produce
tres de ellos.

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> CONFIRMED: POST /orders (ya crea en CONFIRMED)
    CONFIRMED --> CONFIRMED: POST /orders/{id}/items
    CONFIRMED --> PAID: PATCH /orders/{id}/pay
    PAID --> CONFIRMED: DELETE /payments/{id} (revierte)
    CONFIRMED --> DRAFT: se eliminan todos los items del pedido
    CONFIRMED --> [*]: DELETE /orders/{id}
    PAID --> [*]: DELETE /orders/{id}
```

> **No alcanzables por código:** `IN_KITCHEN`, `READY`, `SERVED`, `BILLED`,
> `CANCELLED` existen en el enum `OrderStatus` de `schema.prisma` pero ningún
> endpoint del backend los asigna hoy. El progreso de cocina se rastrea a nivel de
> **ítem** (`OrderItem.kitchenStatus`, ver más abajo), no a nivel de pedido — por eso
> el pedido nunca pasa por `IN_KITCHEN` ni `READY` como tal.

## Estado de la mesa (`Table.status`)

```mermaid
stateDiagram-v2
    [*] --> FREE

    FREE --> OCCUPIED: pedido creado con mesa asignada (POST /orders)
    OCCUPIED --> FREE: pedido pagado (PATCH /orders/{id}/pay) o eliminado (DELETE /orders/{id})

    state "RESERVED / CLEANING / DISABLED" as Manual
    FREE --> Manual: PATCH /tables/{id}/status
    OCCUPIED --> Manual: PATCH /tables/{id}/status
    Manual --> FREE: PATCH /tables/{id}/status
    Manual --> OCCUPIED: PATCH /tables/{id}/status
```

> **Sin validación de transición:** `PATCH /tables/{id}/status` (en
> `tables.controller.ts`) solo valida que el valor enviado pertenezca a la lista
> `[FREE, OCCUPIED, RESERVED, CLEANING, DISABLED]` — no valida el estado *actual* de
> la mesa. Cualquier estado puede pasar a cualquier otro manualmente; el diagrama
> agrupa `RESERVED/CLEANING/DISABLED` porque, en el código, son intercambiables entre
> sí y con `FREE`/`OCCUPIED` sin ninguna regla adicional.

## Estado del ítem en cocina (`OrderItem.kitchenStatus`)

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /orders/{id}/items

    state "PENDING / PREPARING / READY" as Activo
    PENDING --> Activo
    Activo --> Activo: PATCH /kitchen/items/{id}/status

    Activo --> SERVED: boton "Entregado" del frontend
    SERVED --> [*]

    note right of SERVED
        El backend RECHAZA esta transicion con 400
        "Estado de cocina invalido": la lista blanca
        de kitchen.controller.ts solo admite PENDING,
        PREPARING y READY. El boton Entregado del
        frontend queda roto por este motivo (bug
        conocido, preservado tal cual desde el codigo
        legacy previo a esta documentacion).
    end note
```

> **`CANCELLED`** también existe en el enum `KitchenItemStatus` pero, igual que
> `SERVED`, no está en la lista blanca de `updateKitchenItemStatus` — no hay forma de
> cancelar un ítem individual desde la API actual.

## Por qué esto importa para el portfolio

Documentar las transiciones *no alcanzables* no es un defecto de la documentación —
es la diferencia entre un diagrama que describe el `schema.prisma` (lo que se podría
construir) y uno que describe el sistema real (lo que efectivamente corre). Ver
["Limitaciones conocidas"](../../README.md#limitaciones-conocidas) en el README raíz
para el resto de los gaps documentados del mismo modo.
