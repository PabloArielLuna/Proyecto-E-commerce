# 📚 Bookstore API — Express + MariaDB

CRUD completo de libros para un e-commerce.

## Instalación

```bash
npm install
cp .env.example .env   # completar con tus credenciales
```

## Base de datos

```bash
mysql -u root -p < database.sql
```

## Correr el servidor

```bash
npm start          # producción
npm run dev        # desarrollo con hot-reload (Node 18+)
```

---

## Endpoints

Base URL: `http://localhost:3000/api/books`

### GET `/api/books`
Lista todos los libros. Soporta filtros por query string.

| Param   | Descripción                                 |
|---------|---------------------------------------------|
| `titulo`| Filtra por título (búsqueda parcial)        |
| `autor` | Filtra por autor (búsqueda parcial)         |
| `genero`| Filtra por género exacto                    |
| `orden` | Ordena por: `titulo`, `precio`, `stock`, `anio_publicacion` |

```
GET /api/books?genero=Fantasía&orden=precio
```

---

### GET `/api/books/:id`
Obtiene un libro por ID.

```
GET /api/books/1
```

---

### POST `/api/books`
Crea un libro nuevo.

**Body (JSON):**
```json
{
  "titulo": "Fundación",
  "autor": "Isaac Asimov",
  "isbn": "978-8497590358",
  "editorial": "Debolsillo",
  "genero": "Ciencia ficción",
  "descripcion": "Primera entrega de la saga Fundación.",
  "precio": 1350.00,
  "stock": 20,
  "anio_publicacion": 1951,
  "imagen_url": "https://ejemplo.com/fundacion.jpg"
}
```
> `titulo`, `autor` y `precio` son **obligatorios**.

---

### PUT `/api/books/:id`
Reemplaza todos los campos de un libro.

```
PUT /api/books/1
```
Body: igual que POST.

---

### PATCH `/api/books/:id`
Actualiza solo los campos enviados.

```json
{ "precio": 999.99, "stock": 5 }
```

---

### DELETE `/api/books/:id`
Elimina un libro.

```
DELETE /api/books/1
```

---

## Estructura del proyecto

```
bookstore/
├── index.js                         # Entry point
├── database.sql                     # Schema + datos de ejemplo
├── .env.example                     # Variables de entorno
└── src/
    ├── db/
    │   └── connection.js            # Pool MariaDB
    ├── controllers/
    │   └── books.controller.js      # Lógica CRUD
    └── routes/
        └── books.routes.js          # Rutas Express
```

## Variables de entorno (.env)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=bookstore
PORT=3000
```
