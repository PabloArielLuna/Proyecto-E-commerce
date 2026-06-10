const { Router } = require("express");
const {
  getAll,
  getOne,
  create,
  update,
  patch,
  remove,
} = require("../controllers/books.controller");

const router = Router();

// Listar todos los libros (soporta ?titulo=&autor=&genero=&orden=)
router.get("/", getAll);

// Obtener un libro por ID
router.get("/:id", getOne);

// Crear un libro
router.post("/", create);

// Reemplazar un libro completo
router.put("/:id", update);

// Actualizar campos específicos
router.patch("/:id", patch);

// Eliminar un libro
router.delete("/:id", remove);

module.exports = router;
