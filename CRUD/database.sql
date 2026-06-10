-- ============================================
-- Bookstore — Schema MariaDB
-- ============================================

CREATE DATABASE IF NOT EXISTS bookstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bookstore;

CREATE TABLE IF NOT EXISTS libros (
  id               INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  titulo           VARCHAR(255)    NOT NULL,
  autor            VARCHAR(255)    NOT NULL,
  isbn             VARCHAR(20)     UNIQUE,
  editorial        VARCHAR(150),
  genero           VARCHAR(80),
  descripcion      TEXT,
  precio           DECIMAL(10,2)   NOT NULL,
  stock            INT UNSIGNED    NOT NULL DEFAULT 0,
  anio_publicacion YEAR,
  imagen_url       VARCHAR(500),
  creado_en        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Datos de ejemplo
-- ============================================
INSERT INTO libros (titulo, autor, isbn, editorial, genero, precio, stock, anio_publicacion) VALUES
  ('El Señor de los Anillos',   'J.R.R. Tolkien',    '978-0618640157', 'Minotauro',   'Fantasía',  2500.00, 15, 1954),
  ('Cien años de soledad',      'Gabriel García Márquez', '978-0307474728', 'Sudamericana', 'Realismo mágico', 1800.00, 22, 1967),
  ('1984',                      'George Orwell',      '978-0451524935', 'Destino',     'Distopía',  1200.00, 30, 1949),
  ('El nombre de la rosa',      'Umberto Eco',        '978-8423340894', 'Lumen',       'Misterio',  1600.00, 10, 1980),
  ('Harry Potter y la piedra filosofal', 'J.K. Rowling', '978-8478884452', 'Salamandra', 'Fantasía', 1400.00, 50, 1997);
