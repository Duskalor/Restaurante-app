# 04 — Flujos principales

Tres flujos de punta a punta, con los endpoints reales tal como están definidos en
`apps/backend/src/routes` y consumidos desde `apps/frontend/src/features/*/hooks.ts`.

## 1. Ciclo de pedido completo (POS → cocina → caja)

Mozo crea el pedido, cocina lo prepara viendo la pantalla actualizarse sola (polling,
no websockets), y el cajero lo cobra — lo que libera la mesa automáticamente.

```mermaid
sequenceDiagram
    actor Mozo
    participant POS as Frontend (POS)
    actor Cocina
    participant KitchenUI as Frontend (Cocina)
    actor Cajero
    participant CashierUI as Frontend (Caja)
    participant API
    participant DB as PostgreSQL

    Mozo->>POS: Selecciona mesa, click "Nuevo pedido"
    POS->>API: POST /orders {branchId, tableId, waiterId, orderType, channel}
    API->>DB: crea Order (status=CONFIRMED)
    API->>DB: Table.status = OCCUPIED
    API-->>POS: 201 CreatedOrder

    Mozo->>POS: Agrega productos al carrito
    POS->>API: POST /orders/{id}/items {productId, qty}
    API->>DB: crea OrderItem (kitchenStatus=PENDING)
    API->>DB: recalcula subtotal/tax/total del Order
    API-->>POS: 201 OrderItemWithProduct

    loop cada 5s (TanStack Query refetchInterval)
        KitchenUI->>API: GET /kitchen/orders
        API->>DB: Order + items con kitchenStatus in (PENDING,PREPARING,READY)
        API-->>KitchenUI: lista de pedidos con items pendientes
    end

    Cocina->>KitchenUI: Avanza item a "En preparación"
    KitchenUI->>API: PATCH /kitchen/items/{id}/status {kitchenStatus: PREPARING}
    API->>DB: OrderItem.kitchenStatus = PREPARING
    API-->>KitchenUI: 200 OK

    Cocina->>KitchenUI: Marca item como "Listo"
    KitchenUI->>API: PATCH /kitchen/items/{id}/status {kitchenStatus: READY}
    API->>DB: OrderItem.kitchenStatus = READY
    API-->>KitchenUI: 200 OK

    Cajero->>CashierUI: Abre pedido para cobrar
    CashierUI->>API: GET /orders
    API-->>CashierUI: lista de pedidos activos

    Cajero->>CashierUI: Confirma cobro
    CashierUI->>API: PATCH /orders/{id}/pay {method, amount}
    API->>DB: crea Payment
    API->>DB: Order.status = PAID
    API->>DB: Table.status = FREE
    API-->>CashierUI: 200 {payment, order}

    CashierUI->>CashierUI: invalida cache de orders, tables y payments
```

Notas:
- El "tiempo real" de cocina es **polling cada 5 segundos**, no WebSockets/SSE.
- Cobrar un pedido (`PATCH /orders/{id}/pay`) y eliminarlo (`DELETE /orders/{id}`) son
  los únicos dos caminos que liberan la mesa automáticamente.

## 2. Login y autenticación

```mermaid
sequenceDiagram
    actor Usuario
    participant LoginView as Frontend (LoginView)
    participant Store as zustand (persist)
    participant API
    participant DB as PostgreSQL

    Usuario->>LoginView: Envía email + password
    LoginView->>API: POST /auth/login {email, password}
    API->>DB: User.findUnique({email}) incluye branch, role, restaurant
    API->>API: bcrypt.compare(password, passwordHash)
    API->>API: valida isActive, restaurant.status ACTIVE, expiresAt

    alt credenciales inválidas o cuenta inactiva/vencida
        API-->>LoginView: 401 / 403 {error}
        LoginView->>Usuario: muestra mensaje de error
    else login correcto
        API->>DB: User.update({lastLoginAt: now})
        API->>API: jwt.sign({userId, role, branchId, restaurantId, isSuperAdmin}, exp 9h)
        API-->>LoginView: 200 {token, user}
        LoginView->>Store: storeLogin(token, user)
        Store->>Store: persiste en localStorage (clave mesa_pro_auth)
        LoginView->>Usuario: redirige a /dashboard
    end

    Note over Store,API: En cada request posterior, apiFetch lee<br/>Store.token e inyecta "Authorization: Bearer token"
```

Notas:
- El token expira a las 9 horas; no hay refresh token — al expirar, cualquier request
  autenticado devuelve 401 y el usuario debe loguearse de nuevo.
- Si `user.isSuperAdmin` es `true`, el layout (`App.tsx`) renderiza directamente el
  panel SaaS en vez del panel operativo, con el mismo token.

## 3. Pedido por WhatsApp

El mensaje llega ya como texto a un endpoint HTTP — este repositorio no incluye la
integración con la API de WhatsApp en sí, solo el parser y la creación del pedido.

```mermaid
sequenceDiagram
    actor Cliente as Cliente (WhatsApp)
    participant Gateway as Integración externa
    participant Controller as whatsapp.controller
    participant Parser as whatsapp.parser
    participant Service as whatsapp.service
    participant DB as PostgreSQL

    Cliente->>Gateway: "2 ceviche clasico y una inka kola"
    Gateway->>Controller: POST /api/whatsapp/process-order<br/>{branchId, customerName, customerPhone, deliveryAddress, message}
    Controller->>Service: processWhatsappOrder(input)
    Service->>Parser: parseOrderMessage(message)
    Parser-->>Service: ParsedItem[] (nombre, cantidad detectados)

    alt no se identificaron productos
        Service-->>Controller: {ok: false, reply: "No pude identificar productos..."}
        Controller-->>Gateway: 200 {ok: false, reply}
    else productos identificados
        Service->>Service: resuelve cada item contra Product real (match por nombre normalizado)
        alt ningún nombre coincide con productos reales
            Service-->>Controller: throw Error
            Controller-->>Gateway: 400 {error}
        else coinciden productos
            Service->>DB: Order.create (orderType=DELIVERY, channel=WHATSAPP, status=CONFIRMED, tableId=null)<br/>con OrderItem anidados
            DB-->>Service: Order creado
            Service-->>Controller: {ok: true, order, reply: "Tu pedido ORD-0004 fue registrado..."}
            Controller-->>Gateway: 201 {ok, order, reply}
        end
    end

    Gateway-->>Cliente: responde con el texto de "reply"
```

Notas:
- El pedido de WhatsApp nunca pasa por cocina vía polling automático de la misma forma
  que un pedido de salón: entra directo con `status=CONFIRMED`, así que ya aparece en
  `GET /kitchen/orders` en el siguiente ciclo de polling — el flujo converge con el
  ciclo de pedido normal a partir de ahí.
- Existe también `POST /api/whatsapp/test-message`, que corre el parser sin crear
  ningún pedido (`simulateWhatsappOrder`) — útil para probar el reconocimiento de texto
  de forma aislada.
