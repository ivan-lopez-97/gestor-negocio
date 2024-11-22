CREATE DATABASE IF NOT EXISTS sistema_gestion;
USE sistema_gestion;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('vendedor', 'administrador') NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ventas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fecha DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  vendedor_id INT NOT NULL,
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS ventas_detalle (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insert test users
INSERT INTO usuarios (nombre, usuario, password, rol) VALUES 
('Administrador', 'admin', 'admin', 'administrador'),
('Vendedor', 'vendedor', 'vendedor', 'vendedor');

-- Insert test products
INSERT INTO productos (codigo, nombre, precio, cantidad) VALUES
('001', 'Producto 1', 10.50, 100),
('002', 'Producto 2', 15.75, 50),
('003', 'Producto 3', 20.00, 75);