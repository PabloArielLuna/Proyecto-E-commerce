const db = require("../db/connection");

// GET /api/books  —  listar todos (con filtros opcionales por query string)
const getAll = async (req, res) => {
  try {
    const { genero, autor, titulo, orden = "titulo" } = req.query;
    const columnas_validas = ["titulo", "precio", "stock", "anio_publicacion"];
    const orderBy = columnas_validas.includes(orden) ? orden : "titulo";

    let sql = "SELECT * FROM libros WHERE 1=1";
    const params = [];

    if (titulo) {
      sql += " AND titulo LIKE ?";
      params.push(`%${titulo}%`);
    }
    if (autor) {
      sql += " AND autor LIKE ?";
      params.push(`%${autor}%`);
    }
    if (genero) {
      sql += " AND genero = ?";
      params.push(genero);
    }

    sql += ` ORDER BY ${orderBy} ASC`;

    const [rows] = await db.execute(sql, params);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET /api/books/:id  —  obtener uno por ID
const getOne = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM libros WHERE id = ?", [
      req.params.id,
    ]);

    if (!rows.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Libro no encontrado" });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /api/books  —  crear un libro
const create = async (req, res) => {
  try {
    const {
      titulo,
      autor,
      isbn,
      editorial,
      genero,
      descripcion,
      precio,
      stock,
      anio_publicacion,
      imagen_url,
    } = req.body;

    // Validaciones básicas
    if (!titulo || !autor || !precio) {
      return res.status(400).json({
        ok: false,
        error: "Los campos titulo, autor y precio son obligatorios",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO libros
        (titulo, autor, isbn, editorial, genero, descripcion, precio, stock, anio_publicacion, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        autor,
        isbn || null,
        editorial || null,
        genero || null,
        descripcion || null,
        precio,
        stock ?? 0,
        anio_publicacion || null,
        imagen_url || null,
      ]
    );

    res.status(201).json({
      ok: true,
      message: "Libro creado",
      data: { id: result.insertId, titulo, autor, precio },
    });
  } catch (err) {
    // ISBN duplicado
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ ok: false, error: "El ISBN ya existe en la base de datos" });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PUT /api/books/:id  —  actualizar un libro completo
const update = async (req, res) => {
  try {
    const {
      titulo,
      autor,
      isbn,
      editorial,
      genero,
      descripcion,
      precio,
      stock,
      anio_publicacion,
      imagen_url,
    } = req.body;

    const [existing] = await db.execute(
      "SELECT id FROM libros WHERE id = ?",
      [req.params.id]
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Libro no encontrado" });
    }

    await db.execute(
      `UPDATE libros SET
        titulo = ?, autor = ?, isbn = ?, editorial = ?, genero = ?,
        descripcion = ?, precio = ?, stock = ?, anio_publicacion = ?, imagen_url = ?
       WHERE id = ?`,
      [
        titulo,
        autor,
        isbn || null,
        editorial || null,
        genero || null,
        descripcion || null,
        precio,
        stock ?? 0,
        anio_publicacion || null,
        imagen_url || null,
        req.params.id,
      ]
    );

    res.json({ ok: true, message: "Libro actualizado" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PATCH /api/books/:id  —  actualización parcial
const patch = async (req, res) => {
  try {
    const campos_permitidos = [
      "titulo", "autor", "isbn", "editorial", "genero",
      "descripcion", "precio", "stock", "anio_publicacion", "imagen_url",
    ];

    const updates = Object.keys(req.body)
      .filter((k) => campos_permitidos.includes(k))
      .map((k) => `${k} = ?`);

    if (!updates.length) {
      return res
        .status(400)
        .json({ ok: false, error: "No se enviaron campos válidos para actualizar" });
    }

    const valores = updates.map((u) => req.body[u.split(" ")[0]]);
    valores.push(req.params.id);

    await db.execute(
      `UPDATE libros SET ${updates.join(", ")} WHERE id = ?`,
      valores
    );

    res.json({ ok: true, message: "Libro actualizado parcialmente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// DELETE /api/books/:id  —  eliminar un libro
const remove = async (req, res) => {
  try {
    const [existing] = await db.execute(
      "SELECT id, titulo FROM libros WHERE id = ?",
      [req.params.id]
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Libro no encontrado" });
    }

    await db.execute("DELETE FROM libros WHERE id = ?", [req.params.id]);

    res.json({
      ok: true,
      message: `Libro "${existing[0].titulo}" eliminado`,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { getAll, getOne, create, update, patch, remove };
