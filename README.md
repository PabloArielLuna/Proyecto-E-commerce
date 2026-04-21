# E-Commerce para Escritor - Proyecto de Cátedra

## 📖 Descripción del Proyecto
Este proyecto consiste en el diseño y desarrollo de una plataforma de comercio electrónico (E-commerce) orientada a la venta directa de obras literarias por parte de un autor. El sistema permite a los usuarios registrarse, explorar el catálogo de libros, armar un carrito de compras y concretar pedidos de manera autogestionada.

El diagrama de clases actual (Fase 1) representa el núcleo lógico del negocio y servirá como base directa para el Modelado de Datos (DER) y la posterior implementación de la base de datos relacional.

## 🛠️ Tecnologías y Stack (Proyectado)
En base a los requerimientos de la cátedra, la arquitectura del sistema se orienta al siguiente stack:
* **Frontend:** HTML5, CSS3 (Grids, Tailwind/Bootstrap) y React.
* **Backend:** Ecosistema JavaScript utilizando Node.js y Express.
* **Base de Datos:** MariaDB / MySQL (mapeo directo de las clases UML a tablas relacionales).
* **Integraciones (Fase 2):** Bases de datos vectoriales e implementación de APIs de IA (OpenRouter, Claude, etc.) para el motor de recomendaciones.

## 🏗️ Desglose del Modelo de Clases (UML)

El diseño orientado a objetos se estructuró para mantener un bajo acoplamiento y una alta cohesión. A continuación, se detallan las clases principales:

### Entidades Core
* **Usuario:** Gestiona la autenticación y los datos del cliente. Un usuario puede tener rol de 'Cliente' o 'Admin' y está vinculado directamente a sus carritos activos y su historial de pedidos.
* **Libro:** Representa el producto a comercializar. Contiene atributos específicos del dominio literario (ISBN, Sinopsis, Formato) y maneja su propio stock.
* **Categoria:** Permite la clasificación del catálogo para facilitar la navegación y futuros filtros de búsqueda.

### Gestión de Compras
* **Carrito e ItemCarrito:** Clases temporales que manejan la intención de compra del usuario. `ItemCarrito` encapsula la cantidad deseada de un libro y su precio en el momento de agregarlo, protegiendo la lógica de negocio ante futuros cambios de precio.
* **Pedido y DetallePedido:** Persisten la compra una vez confirmada. Dejan un registro inmutable en el historial del sistema sobre qué se vendió, a quién y a qué precio exacto.
* **Pago:** Aislada de `Pedido` para manejar el estado transaccional, los métodos de pago elegidos y las fechas de acreditación de manera independiente.

## 🚀 Próximos Pasos (Roadmap)
1. **Modelado de Datos:** Traducción de este modelo de clases a un Modelo Entidad-Relación y creación del script DDL en MariaDB.
2. **Desarrollo de API Rest:** Creación de los endpoints CRUD en Node.js/Express basados en estas entidades.
3. **Módulo de IA:** Extensión del modelo actual para almacenar preferencias de usuario e historial y alimentar el recomendador utilizando procesamiento de lenguaje natural.
