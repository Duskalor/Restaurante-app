# 03 — Modelo de datos

`apps/backend/prisma/schema.prisma` define ~30 modelos. Este documento cubre el
**dominio core** (13 entidades con API expuesta y uso real) y deja registro del resto
como roadmap del dominio.

## Dominio core

```mermaid
erDiagram
    RESTAURANT |o--o{ BRANCH : tiene
    RESTAURANT |o--o{ USER : tiene
    RESTAURANT ||--o{ SUBSCRIPTION : tiene
    BRANCH ||--o{ USER : emplea
    BRANCH ||--o{ TABLE_ : tiene
    BRANCH ||--o{ CATEGORY : tiene
    BRANCH ||--o{ PRODUCT : tiene
    BRANCH ||--o{ ORDER_ : tiene
    BRANCH ||--o{ KITCHEN_TICKET : tiene
    ROLE ||--o{ USER : asigna
    CATEGORY |o--o{ PRODUCT : clasifica
    TABLE_ |o--o{ ORDER_ : aloja
    CUSTOMER |o--o{ ORDER_ : realiza
    CUSTOMER |o--o{ PAYMENT : paga
    PRODUCT |o--o{ ORDER_ITEM : referencia
    ORDER_ ||--o{ ORDER_ITEM : contiene
    ORDER_ ||--o{ PAYMENT : recibe
    ORDER_ ||--o{ KITCHEN_TICKET : genera

    RESTAURANT {
        string id PK
        string name
        string slug UK
        string subdomain UK
        string status "ACTIVE por defecto"
        string planType
        datetime expiresAt
    }
    BRANCH {
        string id PK
        string restaurantId FK "nullable"
        string name
        string code UK
        boolean isActive
    }
    USER {
        string id PK
        string branchId FK
        string roleId FK
        string restaurantId FK "nullable, null si es superadmin"
        string email UK
        string passwordHash
        boolean isSuperAdmin
        boolean isActive
    }
    ROLE {
        string id PK
        string name UK "ADMIN, SUPERVISOR, MOZO, CAJA, COCINA..."
    }
    TABLE_ {
        string id PK
        string branchId FK
        int number
        int capacity
        string status "FREE, OCCUPIED, RESERVED, CLEANING, DISABLED"
    }
    CATEGORY {
        string id PK
        string branchId FK
        string name
        int sortOrder
    }
    PRODUCT {
        string id PK
        string branchId FK
        string categoryId FK "nullable"
        string name
        decimal price
        decimal taxRate "default 0.18"
        boolean availableForSale
    }
    ORDER_ {
        string id PK
        string branchId FK
        string tableId FK "nullable"
        string customerId FK "nullable"
        string orderNumber UK "por sucursal: ORD-0001..."
        string orderType "DINE_IN, TAKEOUT, DELIVERY"
        string channel "SALON, DELIVERY, WHATSAPP..."
        string status "DRAFT, CONFIRMED, PAID... (ver 05-estados.md)"
        decimal total
    }
    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK "nullable"
        string productNameSnapshot "copia del nombre al momento del pedido"
        decimal qty
        decimal unitPrice
        string kitchenStatus "PENDING, PREPARING, READY, SERVED, CANCELLED"
    }
    PAYMENT {
        string id PK
        string orderId FK
        string customerId FK "nullable"
        string method "CASH, CARD, YAPE, PLIN, TRANSFER"
        decimal amount
        string currency "default PEN"
    }
    CUSTOMER {
        string id PK
        string fullName
        string phone
        string documentNumber
    }
    KITCHEN_TICKET {
        string id PK
        string branchId FK
        string orderId FK
        string station
        string status "PENDING, PREPARING, READY, DELIVERED, CANCELLED"
        string priority "LOW, MEDIUM, HIGH, URGENT"
    }
    SUBSCRIPTION {
        string id PK
        string restaurantId FK
        string planType
        decimal amount
        datetime endsAt
        string status "ACTIVE por defecto"
    }
```

> `TABLE_` y `ORDER_` llevan guión bajo porque `TABLE` y `ORDER` son palabras
> reservadas en SQL/Mermaid; en el schema real los modelos se llaman `Table` y `Order`.

## Nota sobre `KitchenTicket`

`KitchenTicket` está en el dominio core del schema (tiene estación, prioridad y
estado propio), pero **ningún endpoint del backend lo crea ni lo consulta hoy**: la
vista de cocina (`GET /kitchen/orders`) arma su respuesta directamente desde
`Order` + `OrderItem.kitchenStatus`, sin tocar esta tabla. Está modelada pero inerte.

## Roadmap del dominio

Modelos presentes en `schema.prisma` sin ninguna ruta ni controlador que los exponga
(`apps/backend/src/routes` no tiene archivo para ninguno de estos):

| Modelo | Para qué serviría | Estado |
|---|---|---|
| `Reservation` | Reservas de mesa por cliente | Modelado, sin API |
| `DiningArea` | Agrupar mesas en zonas (terraza, salón...) | Modelado, sin API — sí referenciado por `Table.diningAreaId` |
| `Modifier` / `ModifierOption` / `ProductModifier` | Variantes de producto (extras, tamaños) | Modelado, sin API |
| `CashRegister` / `CashSession` / `CashMovement` | Apertura/cierre de caja, arqueo | Modelado, sin API |
| `InventoryItem` / `InventoryMovement` / `Recipe` | Control de stock e insumos por receta | Modelado, sin API |
| `Supplier` / `Purchase` / `PurchaseItem` | Compras a proveedores | Modelado, sin API |
| `AuditLog` | Trazabilidad de cambios por usuario | Modelado, sin API |
| `Permission` / `RolePermission` | Permisos finos por rol | Modelado, sin API — ver limitación de autorización en el README raíz |
| `BusinessSetting` | Datos del negocio (nombre, RUC, logo) | **Sí tiene API** (`business-settings.routes.ts`) — no forma parte del dominio core transaccional pero está activo |
