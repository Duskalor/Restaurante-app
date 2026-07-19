# Arquitectura de SmartMesa

Documentación C4 del monorepo: de afuera hacia adentro, del sistema completo al detalle
de cada flujo. Todo lo que describen estos documentos está verificado contra el código
en la rama `develop` — no hay funcionalidad inventada.

## Cómo leer esta carpeta

| Documento | Qué encontrás |
|---|---|
| [`01-contexto.md`](./01-contexto.md) | Nivel 1 (C4): quién usa el sistema y con qué otros sistemas habla. El mapa de 30 segundos. |
| [`02-contenedores.md`](./02-contenedores.md) | Nivel 2 (C4): las piezas desplegables — frontend, API, base de datos — y los protocolos entre ellas. |
| [`03-modelo-datos.md`](./03-modelo-datos.md) | Modelo de datos del dominio core (13 entidades) + el resto del esquema que existe pero todavía no tiene API. |
| [`04-flujos.md`](./04-flujos.md) | Tres flujos reales de punta a punta, con endpoints exactos: pedido completo, login, pedido por WhatsApp. |
| [`05-estados.md`](./05-estados.md) | Máquinas de estado de Pedido, Mesa e Ítem de cocina — incluye qué transiciones realmente ejecuta el backend y cuáles son solo valores del enum sin uso. |

## Convención de los diagramas

Todos los diagramas son Mermaid, renderizados nativamente por GitHub. Los elementos
**punteados** representan algo planeado o que existe en el código pero sin efecto en
runtime (por ejemplo, `packages/shared` no corre en producción — se borra al compilar).

## Para el resto del proyecto

Ver el [`README.md`](../../README.md) raíz para instalación, variables de entorno y
scripts de desarrollo.
