require("dotenv").config();
const express = require("express");
const booksRouter = require("./src/routes/books.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/books", booksRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "📚 Bookstore API corriendo" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
