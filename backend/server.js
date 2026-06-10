// server.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors()); // Permite que el frontend se conecte sin errores de seguridad
app.use(express.json()); // Permite recibir datos en formato JSON

// Endpoint 1: Healthcheck (Para mostrarle al profe que el server responde)
app.get('/', (req, res) => {
  res.send('✅ API de Librería Digital funcionando correctamente.');
});

// Endpoint 2: Traer todo el catálogo de libros
app.get('/api/libros', async (req, res) => {
  try {
    const libros = await prisma.libro.findMany({
      include: { categoria: true } // Trae el libro y el nombre de su categoría
    });
    res.json(libros);
  } catch (error) {
    res.status(500).json({ error: "Error interno al consultar la base de datos." });
  }
});

// Endpoint 3: Login (Borrador simulado para la entrega)
app.post('/api/login', async (req, res) => {
  const { email, contrasena } = req.body;
  
  if(email && contrasena) {
    // Acá en el futuro buscamos al usuario en la BD y validamos el hash de la contraseña
    res.json({ 
      mensaje: "Login exitoso", 
      usuario: { email: email, rol: "Cliente" } 
    });
  } else {
    res.status(400).json({ error: "Faltan credenciales." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});