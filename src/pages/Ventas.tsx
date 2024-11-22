import React, { useState, useEffect, useRef } from 'react';
import { useInventarioStore } from '../store/inventarioStore';
import { useVentasStore } from '../store/ventasStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Trash2, Search, Barcode } from 'lucide-react';
import { Producto } from '../types';

export const Ventas: React.FC = () => {
  const { productos } = useInventarioStore();
  const { agregarVenta } = useVentasStore();
  const { usuario } = useAuthStore();
  const [carrito, setCarrito] = useState<Array<{ producto: Producto; cantidad: number }>>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [codigoBuffer, setCodigoBuffer] = useState('');
  const ultimaTeclaRef = useRef<number>(0);
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // Manejador del escáner de código de barras
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!escaneando) return;

      const ahora = Date.now();
      if (ahora - ultimaTeclaRef.current > 100) {
        setCodigoBuffer('');
      }
      ultimaTeclaRef.current = ahora;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (codigoBuffer) {
          const producto = productos.find((p) => p.codigo === codigoBuffer);
          if (producto) {
            agregarAlCarrito(producto);
            if (codigoInputRef.current) {
              codigoInputRef.current.value = '';
              codigoInputRef.current.focus();
            }
          } else {
            setError('Producto no encontrado');
            setTimeout(() => setError(null), 3000);
          }
        }
        setCodigoBuffer('');
      } else if (e.key.length === 1) {
        setCodigoBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [escaneando, productos]);

  // Cuando se activa el escaneo, enfocar el campo de código
  useEffect(() => {
    if (escaneando && codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, [escaneando]);

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.cantidad <= 0) {
      setError('No hay stock disponible para este producto');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setCarrito((prev) => {
      const existente = prev.find((item) => item.producto.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.cantidad) {
          setError('No hay suficiente stock disponible');
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.producto.id === productoId) {
          const nuevaCantidad = Math.max(1, cantidad);
          if (nuevaCantidad > item.producto.cantidad) {
            setError('No hay suficiente stock disponible');
            setTimeout(() => setError(null), 3000);
            return item;
          }
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      })
    );
  };

  const eliminarDelCarrito = (productoId: number) => {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const buscarPorCodigo = (codigo: string) => {
    const producto = productos.find((p) => p.codigo === codigo);
    if (producto) {
      agregarAlCarrito(producto);
      if (codigoInputRef.current) {
        codigoInputRef.current.value = '';
      }
    } else {
      setError('Producto no encontrado');
      setTimeout(() => setError(null), 3000);
    }
  };

  const total = carrito.reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0
  );

  const realizarVenta = async () => {
    if (carrito.length === 0) return;
    if (!usuario) {
      setError('No hay usuario autenticado');
      return;
    }

    try {
      const ventaData = {
        productos: carrito.map(item => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio
        })),
        total,
        vendedor_id: usuario.id
      };

      const response = await fetch('http://localhost:3000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al realizar la venta');
      }

      const ventaRealizada = await response.json();
      agregarVenta(ventaRealizada);
      setCarrito([]);
      setError(null);
      alert('Venta realizada con éxito');
    } catch (error) {
      console.error('Error al realizar la venta:', error);
      setError(error instanceof Error ? error.message : 'Error al realizar la venta');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {error && (
        <div className="col-span-2 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar productos..."
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
          </div>
          <div className="relative flex-1">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  ref={codigoInputRef}
                  type="text"
                  placeholder={escaneando ? "Esperando lectura..." : "Código de barras"}
                  className="pl-10 pr-4 py-2 w-full border rounded-md"
                  readOnly={escaneando}
                  onKeyDown={(e) => {
                    if (!escaneando && e.key === 'Enter') {
                      e.preventDefault();
                      buscarPorCodigo(e.currentTarget.value);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => setEscaneando(!escaneando)}
                className={`px-4 py-2 rounded-md ${
                  escaneando
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title={escaneando ? 'Detener escaneo' : 'Iniciar escaneo'}
              >
                <Barcode size={20} />
              </button>
            </div>
            {escaneando && (
              <p className="mt-1 text-sm text-green-600">
                Modo escaneo activo - Escanee el código de barras
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {productos
            .filter(
              (p) =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.codigo.includes(busqueda)
            )
            .map((producto) => (
              <button
                key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                disabled={producto.cantidad <= 0}
              >
                <h3 className="font-semibold">{producto.nombre}</h3>
                <p className="text-sm text-gray-600">Código: {producto.codigo}</p>
                <p className="text-gray-600">${producto.precio.toFixed(2)}</p>
                <p className={`text-sm ${producto.cantidad <= 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  Stock: {producto.cantidad}
                </p>
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Carrito</h2>
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="space-y-4">
            {carrito.map((item) => (
              <div
                key={item.producto.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <h3 className="font-semibold">{item.producto.nombre}</h3>
                  <p className="text-sm text-gray-600">Código: {item.producto.codigo}</p>
                  <p className="text-gray-600">
                    ${item.producto.precio.toFixed(2)} x {item.cantidad}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={item.producto.cantidad}
                    value={item.cantidad}
                    onChange={(e) =>
                      actualizarCantidad(
                        item.producto.id,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-16 border rounded-md px-2 py-1"
                  />
                  <button
                    onClick={() => eliminarDelCarrito(item.producto.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={realizarVenta}
              disabled={carrito.length === 0}
              className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Realizar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};