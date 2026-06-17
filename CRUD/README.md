# 📚 Bookstore API — Express + Prisma + MariaDB

API para un e-commerce de libros, modelada a partir de un diagrama UML con 8 clases: `Usuario`, `Carrito`, `ItemCarrito`, `Pedido`, `DetallePedido`, `Pago`, `Libro` y `Categoria`.

## Instalación

```bash
npm install
cp .env.example .env   # completar DATABASE_URL con tus credenciales
```

## Base de datos

```bash
npm run prisma:generate     # genera el Prisma Client
npm run prisma:migrate      # crea las tablas (y corre el seed automáticamente)
npm run prisma:seed         # vuelve a cargar los datos de ejemplo si hace falta
```

El seed crea: 5 categorías, 5 libros, y un usuario de prueba:
```
email: demo@bookstore.com
contrasena: password123
```
(con su Carrito vacío ya asociado, como indica la relación "posee" del UML).

## Correr el servidor

```bash
npm start          # producción
npm run dev        # desarrollo con hot-reload
```

## Ver los datos visualmente

```bash
npm run prisma:studio   # http://localhost:5555
```

---

## Modelo de datos (UML → Prisma)

| Clase UML       | Relación                                              | Implementación                                  |
|------------------|--------------------------------------------------------|---------------------------------------------------|
| Usuario          | posee 1 Carrito · realiza 0..* Pedido                  | `Usuario.carrito` (1 a 1) · `Usuario.pedidos[]`   |
| Carrito          | contiene 0..* ItemCarrito                              | `Carrito.items[]`                                  |
| ItemCarrito      | referencia 1 Libro                                      | `ItemCarrito.libro`                                |
| Pedido           | compuesto por 1..* DetallePedido · se abona con 1 Pago | `Pedido.detalles[]` (cascade) · `Pedido.pago` (1 a 1) |
| DetallePedido    | incluye 1 Libro                                         | `DetallePedido.libro`                              |
| Pago             | —                                                       | 1 a 1 con `Pedido`                                 |
| Libro            | pertenece 1 Categoria                                   | `Libro.categoria`                                  |
| Categoria        | —                                                       | `Categoria.libros[]`                               |

---

## Endpoints

### 👤 Usuario — `/api/usuarios`

| Método | Ruta | Método UML | Descripción |
|--------|------|------------|--------------|
| `POST` | `/registrarse` | `+registrarse() : void` | Crea el usuario y su Carrito vacío |
| `POST` | `/login` | `+login() : boolean` | Valida credenciales, devuelve `{ login: true/false }` |
| `POST` | `/logout` | `+logout() : void` | Cierra sesión (sin estado server-side en este ejemplo) |
| `GET` | `/` | — | Listar usuarios |
| `GET` | `/:id` | — | Obtener un usuario |
| `PUT` | `/:id` | — | Actualizar nombre/email/rol |
| `DELETE` | `/:id` | — | Eliminar usuario |

**Registrarse:**
```json
POST /api/usuarios/registrarse
{ "nombre": "Ana Pérez", "email": "ana@mail.com", "contrasena": "secreta123" }
```

**Login:**
```json
POST /api/usuarios/login
{ "email": "ana@mail.com", "contrasena": "secreta123" }
```

> Las contraseñas se guardan con `bcrypt` y nunca se devuelven en las respuestas.

---

### 🛒 Carrito — `/api/carritos`

| Método | Ruta | Método UML | Descripción |
|--------|------|------------|--------------|
| `GET` | `/usuario/:idUsuario` | — | Obtener el carrito de un usuario con sus items |
| `POST` | `/:idCarrito/items` | `+agregarItem(Libro, cantidad) : void` | Agrega o suma cantidad de un libro |
| `DELETE` | `/:idCarrito/items/:idLibro` | `+eliminarItem(idLibro) : void` | Quita un libro del carrito |
| `POST` | `/:idCarrito/convertir` | `+convertirAPedido() : Pedido` | Genera el Pedido, descuenta stock y vacía el carrito |

**Agregar item:**
```json
POST /api/carritos/1/items
{ "idLibro": 3, "cantidad": 2 }
```

**Convertir a pedido:** valida stock, crea `Pedido` + sus `DetallePedido` dentro de una transacción, descuenta el stock de cada `Libro` y deja el carrito en cero.

---

### 📦 Pedido — `/api/pedidos`

| Método | Ruta | Método UML | Descripción |
|--------|------|------------|--------------|
| `GET` | `/` | — | Listar pedidos (filtros `?idUsuario=` `?estado=`) |
| `GET` | `/:id` | — | Obtener un pedido con detalles, pago y usuario |
| `PATCH` | `/:id/estado` | `+cambiarEstado(nuevoEstado) : void` | Cambia el estado del pedido |
| `DELETE` | `/:id` | — | Elimina un pedido (solo si está `pendiente`) |

**Cambiar estado:**
```json
PATCH /api/pedidos/1/estado
{ "nuevoEstado": "enviado" }
```
Estados válidos: `pendiente`, `pagado`, `enviado`, `entregado`, `cancelado`.

---

### 💳 Pago — `/api/pagos`

| Método | Ruta | Método UML | Descripción |
|--------|------|------------|--------------|
| `POST` | `/` | `+procesarPago() : boolean` | Crea el pago de un pedido y lo marca `pagado` |
| `GET` | `/:id` | — | Obtener un pago |

```json
POST /api/pagos
{ "idPedido": 1, "metodo": "tarjeta" }
```
Métodos válidos: `tarjeta`, `transferencia`, `efectivo`, `mercadopago`. Si se aprueba, el `Pedido` asociado pasa a estado `pagado`.

---

### 📖 Libro — `/api/libros`

| Método | Ruta | Descripción |
|--------|------|--------------|
| `GET` | `/` | Listar (filtros `?titulo=` `?categoria=` `?orden=titulo\|precio\|stock`) |
| `GET` | `/:id` | Obtener un libro con su categoría |
| `POST` | `/` | Crear libro |
| `PUT` | `/:id` | Reemplazar libro completo |
| `PATCH` | `/:id` | Actualización parcial (incluye `actualizarStock`) |
| `DELETE` | `/:id` | Eliminar libro |

```json
POST /api/libros
{
  "titulo": "Dune",
  "sinopsis": "Un joven hereda el control de un planeta desértico clave para el imperio.",
  "precio": 1900.00,
  "stock": 12,
  "isbn": "978-0441013593",
  "idCategoria": 5
}
```

---

### 🏷️ Categoría — `/api/categorias`

| Método | Ruta | Descripción |
|--------|------|--------------|
| `GET` | `/` | Listar categorías (con cantidad de libros) |
| `GET` | `/:id` | Obtener una categoría con sus libros |
| `POST` | `/` | Crear categoría |
| `PUT` | `/:id` | Renombrar categoría |
| `DELETE` | `/:id` | Eliminar (falla si tiene libros asociados) |

```json
POST /api/categorias
{ "nombre": "Terror" }
```

---

## Estructura del proyecto

```
bookstore/
├── index.js                         # Entry point, monta todas las rutas
├── prisma/
│   ├── schema.prisma                # 8 modelos: Usuario, Carrito, ItemCarrito,
│   │                                 #   Pedido, DetallePedido, Pago, Libro, Categoria
│   └── seed.js                      # Datos de ejemplo
├── .env.example
└── src/
    ├── db/
    │   └── prisma.js                # Prisma Client (singleton)
    ├── controllers/
    │   ├── usuarios.controller.js   # registrarse, login, logout + CRUD
    │   ├── carritos.controller.js   # agregarItem, eliminarItem, convertirAPedido
    │   ├── pedidos.controller.js    # cambiarEstado + CRUD
    │   ├── pagos.controller.js      # procesarPago
    │   ├── libros.controller.js     # CRUD + actualizarStock
    │   └── categorias.controller.js # CRUD
    └── routes/
        ├── usuarios.routes.js
        ├── carritos.routes.js
        ├── pedidos.routes.js
        ├── pagos.routes.js
        ├── libros.routes.js
        └── categorias.routes.js
```

## Variables de entorno (.env)

```
DATABASE_URL="mysql://root:tu_password@localhost:3306/bookstore"
PORT=3000
```

## Códigos de error de Prisma usados

| Código  | Significado                                   | HTTP status |
|---------|-------------------------------------------------|-------------|
| `P2002` | Violación de constraint único (email/ISBN/etc.) | 409         |
| `P2025` | Registro no encontrado (update/delete)          | 404         |
| `P2003` | Violación de clave foránea                      | 400 / 409   |
