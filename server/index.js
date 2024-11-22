import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_gestion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ruta de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    const [rows] = await pool.query(
      'SELECT id, nombre, rol FROM usuarios WHERE usuario = ? AND password = ?',
      [usuario, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Rutas para productos
app.get('/api/productos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    res.json(rows.map(producto => ({
      ...producto,
      precio: Number(producto.precio),
      cantidad: Number(producto.cantidad)
    })));
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const { codigo, nombre, precio, cantidad } = req.body;
    const [result] = await pool.query(
      'INSERT INTO productos (codigo, nombre, precio, cantidad) VALUES (?, ?, ?, ?)',
      [codigo, nombre, Number(precio), Number(cantidad)]
    );
    
    const [producto] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
    res.status(201).json({
      ...producto[0],
      precio: Number(producto[0].precio),
      cantidad: Number(producto[0].cantidad)
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.put('/api/productos/:id', async (req, res) => {
  try {
    const { codigo, nombre, precio, cantidad } = req.body;
    await pool.query(
      'UPDATE productos SET codigo = ?, nombre = ?, precio = ?, cantidad = ? WHERE id = ?',
      [codigo, nombre, Number(precio), Number(cantidad), req.params.id]
    );
    
    const [producto] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    res.json({
      ...producto[0],
      precio: Number(producto[0].precio),
      cantidad: Number(producto[0].cantidad)
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Rutas para ventas
app.get('/api/ventas', async (req, res) => {
  try {
    const [ventas] = await pool.query(`
      SELECT v.*, u.nombre as vendedor_nombre, u.rol as vendedor_rol
      FROM ventas v
      JOIN usuarios u ON v.vendedor_id = u.id
      ORDER BY v.fecha DESC
    `);

    const ventasConDetalles = await Promise.all(
      ventas.map(async (venta) => {
        const [detalles] = await pool.query(`
          SELECT vd.*, p.nombre, p.codigo, p.precio
          FROM ventas_detalle vd
          JOIN productos p ON vd.producto_id = p.id
          WHERE vd.venta_id = ?
        `, [venta.id]);

        return {
          id: venta.id,
          fecha: venta.fecha,
          total: Number(venta.total),
          vendedor: {
            id: venta.vendedor_id,
            nombre: venta.vendedor_nombre,
            rol: venta.vendedor_rol
          },
          productos: detalles.map(d => ({
            producto: {
              id: d.producto_id,
              nombre: d.nombre,
              codigo: d.codigo,
              precio: Number(d.precio)
            },
            cantidad: Number(d.cantidad)
          }))
        };
      })
    );

    res.json(ventasConDetalles);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

app.post('/api/ventas', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { productos, total, vendedor_id } = req.body;

    // Verificar stock disponible
    for (const item of productos) {
      const [stockResult] = await connection.query(
        'SELECT cantidad FROM productos WHERE id = ?',
        [item.producto_id]
      );

      if (!stockResult[0] || stockResult[0].cantidad < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto ${item.producto_id}`);
      }
    }

    // Crear la venta
    const [ventaResult] = await connection.query(
      'INSERT INTO ventas (fecha, total, vendedor_id) VALUES (NOW(), ?, ?)',
      [Number(total), vendedor_id]
    );

    const ventaId = ventaResult.insertId;

    // Registrar productos y actualizar stock
    for (const item of productos) {
      await connection.query(
        'INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [ventaId, item.producto_id, Number(item.cantidad), Number(item.precio_unitario)]
      );

      await connection.query(
        'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?',
        [Number(item.cantidad), item.producto_id]
      );
    }

    await connection.commit();

    // Obtener la venta completa
    const [[venta]] = await connection.query(`
      SELECT v.*, u.nombre as vendedor_nombre, u.rol as vendedor_rol
      FROM ventas v
      JOIN usuarios u ON v.vendedor_id = u.id
      WHERE v.id = ?
    `, [ventaId]);

    const [detalles] = await connection.query(`
      SELECT vd.*, p.nombre, p.codigo, p.precio
      FROM ventas_detalle vd
      JOIN productos p ON vd.producto_id = p.id
      WHERE vd.venta_id = ?
    `, [ventaId]);

    const ventaCompleta = {
      id: venta.id,
      fecha: venta.fecha,
      total: Number(venta.total),
      vendedor: {
        id: venta.vendedor_id,
        nombre: venta.vendedor_nombre,
        rol: venta.vendedor_rol
      },
      productos: detalles.map(d => ({
        producto: {
          id: d.producto_id,
          nombre: d.nombre,
          codigo: d.codigo,
          precio: Number(d.precio)
        },
        cantidad: Number(d.cantidad)
      }))
    };

    res.status(201).json(ventaCompleta);
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});