require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configuramos MP con la clave de prueba de tu .env
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// Endpoint 1: Healthcheck 
app.get('/', (req, res) => {
  res.send('✅ API de Librería Digital funcionando correctamente.');
});

// Endpoint 2: Traer todo el catálogo de libros
app.get('/api/libros', async (req, res) => {
  try {
    const libros = await prisma.libro.findMany({
      include: { categoria: true } 
    });
    res.json(libros);
  } catch (error) {
    res.status(500).json({ error: "Error interno al consultar la base de datos." });
  }
});

// Endpoint 3: Login 
app.post('/api/login', async (req, res) => {
  const { email, contrasena } = req.body;
  
  if(email && contrasena) {
    res.json({ 
      mensaje: "Login exitoso", 
      usuario: { email: email, rol: "Cliente" } 
    });
  } else {
    res.status(400).json({ error: "Faltan credenciales." });
  }
});

// Endpoint 4: El Checkout (La caja registradora interna)
app.post('/api/checkout', async (req, res) => {
  const { items, idUsuario, metodoPago } = req.body;

  try {
    console.log("🛒 Recibiendo changuito en la caja...");

    let subtotal = 0;
    const detalles = [];

    // 1. Escaneamos productos
    for (const item of items) {
      const libro = await prisma.libro.findUnique({ where: { idLibro: item.idLibro } });
      
      if (!libro) return res.status(400).json({ error: `El producto ID ${item.idLibro} no existe.` });
      if (libro.stock < item.cantidad) return res.status(400).json({ error: `No hay stock suficiente para ${libro.titulo}.` });

      subtotal += libro.precio * item.cantidad;
      
      detalles.push({
        idLibro: libro.idLibro,
        cantidad: item.cantidad,
        precioUnitario: libro.precio
      });
    }

    // 2. Aplicar descuento 
    let descuento = idUsuario ? (subtotal * 0.05) : 0;
    const totalFinal = subtotal - descuento;

    // 3. Emitir el ticket
    const nuevoPedido = await prisma.pedido.create({
      data: {
        idUsuario: idUsuario || 1, 
        estado: 'Completado',
        total: totalFinal,
        detalles: { create: detalles },
        pago: {
          create: { metodo: metodoPago || 'Tarjeta', estado: 'Aprobado' }
        }
      },
      include: { detalles: true, pago: true }
    });

    // 4. Actualizar el stock
    for (const detalle of detalles) {
      await prisma.libro.update({
        where: { idLibro: detalle.idLibro },
        data: { stock: { decrement: detalle.cantidad } }
      });
    }

    res.json({ mensaje: "✅ ¡Compra exitosa! Ticket emitido.", pedido: nuevoPedido });
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
    console.log("🛒 Items recibidos del front para Mercado Pago:", items);

    // 1. Escaneamos los productos para asegurar el precio
    for (const item of items) {
      const libro = await prisma.libro.findUnique({ where: { idLibro: item.idLibro } });
      
      if (!libro) {
        console.log(`⚠️ Alerta: El ID ${item.idLibro} no existe en la BD.`);
        return res.status(400).json({ error: `El producto ID ${item.idLibro} no existe.` });
      }

      console.log("🔎 Datos encontrados en la BD para este libro:", libro.titulo);

      // Parche blindado para asegurar un precio
      const precioFinal = Number(libro.precio) ? Number(libro.precio) : 1500;
      const tituloFinal = libro.titulo ? libro.titulo : "Producto de Librería";

      // 2. Armamos el objeto con el formato EXACTO
      itemsParaMP.push({
        title: tituloFinal,
        quantity: Number(item.cantidad) || 1,
        unit_price: precioFinal,
        currency_id: "ARS"
      });
    } 
    console.log("📦 LO QUE SE MANDA A MP:", JSON.stringify(itemsParaMP, null, 2));
    // 3. Le armamos la Preferencia a Mercado Pago
    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: itemsParaMP,
        back_urls: { 
          success: "https://libreria-frontend-ey5p.onrender.com", 
          failure: "https://libreria-frontend-ey5p.onrender.com",
          pending: "https://libreria-frontend-ey5p.onrender.com"
        },
        auto_return: "approved" 
      }
    });

    console.log("🔗 URL generada por MP:", result.init_point);
    res.json({ url: result.init_point });

  } catch (error) {
    console.error("❌ Error al conectar con MercadoPago:", error);
    res.status(500).json({ error: "Fallo al crear la preferencia de pago." });
  }
});

// Endpoint 6: El Asistente Virtual con IA (Conexión vía Groq)
app.post('/api/chat', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) return res.status(400).json({ error: "No enviaste ningún mensaje." });

  try {
    console.log("⚡ Consultando a Groq (Modelo Llama 3)...");

    const librosDisponibles = await prisma.libro.findMany({ include: { categoria: true } });
    
    const inventarioTexto = librosDisponibles.map(l => {
      const tipoDeProducto = l.categoria ? l.categoria.nombre : "Libro"; 
      return `- [Tipo: ${tipoDeProducto}] "${l.titulo}" | Precio: $${l.precio} | Stock: ${l.stock} u.`;
    }).join("\n");

    const contextoSistema = `
      Sos el asistente virtual de "Librería Digital", una plataforma moderna.
      ¡MUY IMPORTANTE!: Nosotros NO solo vendemos libros de papel. También vendemos CURSOS ONLINE (ej: de programación, bases de datos) y LIBROS DIGITALES.
      
      INVENTARIO DISPONIBLE:
      ${inventarioTexto}
      
      REGLAS DE ORO:
      1. Si el usuario te pregunta por "cursos", "digitales" o "programación", buscá en el inventario y recomendalos con entusiasmo.
      2. NUNCA digas que "solo vendemos libros". ¡Somos una tienda multipropósito!
      3. Si el stock es 0, avisá que está agotado.
      4. Respondé SIEMPRE de forma breve (máximo 2 o 3 oraciones), amable y al pie de la letra con el inventario.
    `;

    const urlGroq = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(urlGroq, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: contextoSistema },
          { role: "user", content: mensaje }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Groq rebotó la conexión:", data);
      return res.status(500).json({ error: "Error de conexión con la IA." });
    }

    res.json({ respuesta: data.choices[0].message.content });

  } catch (error) {
    console.error("❌ Error en el motor de IA:", error);
    res.status(500).json({ error: "El backend se colgó internamente." });
  }
});

// --- CONFIGURACIÓN FINAL ---
module.exports = app;

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Servidor iniciado y listo para operar.");
  });
}