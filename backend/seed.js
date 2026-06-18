const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('⏳ Limpiando base de datos...');
    await prisma.libro.deleteMany();
    await prisma.categoria.deleteMany();

    console.log('🌱 Creando categorías...');
    const catTech = await prisma.categoria.create({ data: { nombre: 'Tecnología' } });
    const catLit = await prisma.categoria.create({ data: { nombre: 'Literatura' } });
    const catHist = await prisma.categoria.create({ data: { nombre: 'Historia' } });

    console.log('📚 Cargando catálogo de libros...');
    await prisma.libro.createMany({
        data: [
            { titulo: 'El Arte de la Programación', isbn: '978-0201896831', precio: 4500, stock: 15, tipo: 'Libro', idCategoria: catTech.idCategoria },
            { titulo: 'Python para Todos', isbn: '978-1530051120', precio: 2800, stock: 50, tipo: 'Curso', idCategoria: catTech.idCategoria },
            { titulo: 'Cien Años de Soledad', isbn: '978-0307474728', precio: 1900, stock: 20, tipo: 'Libro', idCategoria: catLit.idCategoria },
            { titulo: 'Diseño de Algoritmos', isbn: '978-0073523408', precio: 3200, stock: 10, tipo: 'Digital', idCategoria: catTech.idCategoria },
            { titulo: 'El Principito', isbn: '978-0156012195', precio: 1200, stock: 35, tipo: 'Libro', idCategoria: catLit.idCategoria },
            { titulo: 'Bases de Datos', isbn: '978-8448136561', precio: 3800, stock: 25, tipo: 'Curso', idCategoria: catTech.idCategoria },
            { titulo: 'Clean Code', isbn: '978-0132350884', precio: 2600, stock: 40, tipo: 'Digital', idCategoria: catTech.idCategoria },
            { titulo: 'Sapiens', isbn: '978-0062316097', precio: 2200, stock: 12, tipo: 'Libro', idCategoria: catHist.idCategoria },
        ]
    });

    console.log('✅ ¡Base de datos poblada con éxito! Ya tenés productos para vender.');
}

main()
    .catch((e) => {
        console.error('❌ Error al poblar la base:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });