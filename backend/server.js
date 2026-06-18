// server.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors()); // Permite que el frontend se conecte sin errores de seguridad
app.use(express.json()); // Permite recibir datos en formato JSON

// Endpoint 1: Healthcheck (Para mostrar que el server responde)
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

// Endpoint 4: El Checkout (La caja registradora)
app.post('/api/checkout', async (req, res) => {
  // El frontend nos manda los items del carrito, el ID del cliente y cómo paga
  const { items, idUsuario, metodoPago } = req.body;

  try {
    console.log("🛒 Recibiendo changuito en la caja...");

    let subtotal = 0;
    const detalles = [];

    // 1. "Pasar los productos por el escáner" (Buscar precios y stock real en la BD)
    for (const item of items) {
      const libro = await prisma.libro.findUnique({ where: { idLibro: item.idLibro } });
      
      if (!libro) {
        return res.status(400).json({ error: `El producto ID ${item.idLibro} no existe.` });
      }
      if (libro.stock < item.cantidad) {
        return res.status(400).json({ error: `No hay stock suficiente para ${libro.titulo}.` });
      }

      // Sumamos al subtotal usando el precio real que dice el sistema
      subtotal += libro.precio * item.cantidad;

      // Preparamos los renglones del ticket
      detalles.push({
        idLibro: libro.idLibro,
        cantidad: item.cantidad,
        precioUnitario: libro.precio
      });
    }

    // 2. Aplicar descuento (Si es un cliente registrado, le hacemos el 5% off)
    let descuento = 0;
    if (idUsuario) {
      descuento = subtotal * 0.05;
    }
    const totalFinal = subtotal - descuento;

    // 3. Emitir el ticket y cobrar (Magia de Prisma: crea el Pedido, los Detalles y el Pago al mismo tiempo)
    const nuevoPedido = await prisma.pedido.create({
      data: {
        idUsuario: idUsuario || 1, // Si no mandan ID, se lo asignamos al usuario genérico 1
        estado: 'Completado',
        total: totalFinal,
        detalles: {
          create: detalles 
        },
        pago: {
          create: {
            metodo: metodoPago || 'Tarjeta',
            estado: 'Aprobado'
          }
        }
      },
      include: {
        detalles: true,
        pago: true
      }
    });

    // 4. "Descontar del depósito" (Actualizar el stock en la base de datos)
    for (const detalle of detalles) {
      await prisma.libro.update({
        where: { idLibro: detalle.idLibro },
        data: { stock: { decrement: detalle.cantidad } }
      });
    }

    res.json({
      mensaje: "✅ ¡Compra exitosa! Ticket emitido.",
      pedido: nuevoPedido
    });

  } catch (error) {
    console.error("❌ Error en la caja:", error);
    res.status(500).json({ error: "Error interno al procesar el pago." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});