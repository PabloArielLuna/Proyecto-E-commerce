require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const { MercadoPagoConfig, Preference } = require('mercadopago');
// Configuramos MP con la clave de prueba de mi .env
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

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

// Endpoint 5: Mandar a pagar a MercadoPago
app.post('/api/pagar', async (req, res) => {
  const { items } = req.body;

  try {
    const itemsParaMP = [];
    console.log("🛒 Items recibidos del front:", items);

    // 1. Pasamos los productos por el escáner de la base de datos
    for (const item of items) {
      const libro = await prisma.libro.findUnique({ where: { idLibro: item.idLibro } });
      
      // PARCHE DE SEGURIDAD: Si no lo encuentra en la BD, te avisa en la consola
      if (!libro) {
        console.log(`⚠️ Alerta: El frontend pidió el ID ${item.idLibro} pero no existe en MariaDB. ¡Revisá los IDs en Heidi!`);
        return res.status(400).json({ error: `El producto ID ${item.idLibro} no existe en la base de datos.` });
      }

      // 2. Armamos el objeto con AMBOS formatos para blindar el precio y la moneda
      itemsParaMP.push({
        title: libro.titulo,
        quantity: item.cantidad,
        
        // Formato viejo (snake_case)
        unit_price: Number(libro.precio),
        currency_id: "ARS",
        
        // Formato nuevo (camelCase) - Obligatorio en V2
        unitPrice: Number(libro.precio),
        currencyId: "ARS"
      });
    }

    // 3. Le armamos la Preferencia a Mercado Pago
    const preference = new Preference(mpClient);
    
    const result = await preference.create({
      body: {
        items: itemsParaMP,
        backUrls: {
          success: "https://www.google.com", 
          failure: "https://www.google.com",
          pending: "https://www.google.com"
        },
        autoReturn: "approved"
      }
    });

    console.log("🔗 URL generada por Mercado Pago con éxito:", result.init_point);
    res.json({ url: result.init_point });

  } catch (error) {
    console.error("❌ Error al conectar con MercadoPago:", error);
    res.status(500).json({ error: "Fallo al crear la preferencia de pago." });
  }
});

// Endpoint 6: El Asistente Virtual con IA (Conexión vía Groq)
app.post('/api/chat', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: "No enviaste ningún mensaje." });
  }

  try {
    console.log("⚡ Consultando a Groq (Modelo Llama 3)...");

    // 1. LEEMOS TU BASE DE DATOS REAL
    const librosDisponibles = await prisma.libro.findMany();
    const inventarioTexto = librosDisponibles.map(l => 
      `- "${l.titulo}" | Precio: $${l.precio} | Stock: ${l.stock} u.`
    ).join("\n");

    const contextoSistema = `
      Sos el asistente virtual buena onda de "Librería Digital".
      Tu objetivo es responder de forma amable, corta y concisa.
      
      REGLAS DE ORO:
      1. SÓLO podés recomendar libros de esta lista oficial:
      ${inventarioTexto}
      2. Si te preguntan por un libro que NO está, decí que no lo tenés en catálogo.
      3. Si el stock es 0, avisá que está agotado.
      4. Respondé siempre de forma breve (máximo 2 o 3 oraciones).
    `;

    // 2. CONEXIÓN DIRECTA A GROQ
    const urlGroq = "https://api.groq.com/openai/v1/chat/completions";
    
    const response = await fetch(urlGroq, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // Usamos la nueva variable del .env
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
      },
      body: JSON.stringify({
        // Usamos la versión instantánea de Llama 3.1 que está activa y vuela
        model: "llama-3.1-8b-instant", 
        messages: [
          { role: "system", content: contextoSistema },
          { role: "user", content: mensaje }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Groq rebotó la conexión:", data.error || data);
      return res.status(500).json({ error: `Error de Groq: ${data.error?.message || 'Desconocido'}` });
    }

    // 3. Extraemos el texto y lo devolvemos al frontend
    const respuestaIA = data.choices[0].message.content;
    res.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error("❌ Error en el motor de IA:", error.message || error);
    res.status(500).json({ error: "El backend se colgó internamente." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});