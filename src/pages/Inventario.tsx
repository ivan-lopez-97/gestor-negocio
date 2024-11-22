import React, { useState, useEffect, useRef } from 'react';
import { useInventarioStore } from '../store/inventarioStore';
import { Plus, Edit, Trash2, Search, Barcode } from 'lucide-react';
import { Producto } from '../types';

export const Inventario: React.FC = () => {
  const { productos, agregarProducto, actualizarProducto, eliminarProducto } = useInventarioStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [productoActual, setProductoActual] = useState<Producto | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codigoInputRef = useRef<HTMLInputElement>(null);
  const [codigoBuffer, setCodigoBuffer] = useState('');
  const ultimaTeclaRef = useRef<number>(0);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/productos');
        if (!res.ok) throw new Error('Error al cargar productos');
        const data = await res.json();
        useInventarioStore.getState().setProductos(data);
      } catch (err) {
        setError('Error al cargar productos. Asegúrese que el servidor esté funcionando.');
        console.error('Error:', err);
      }
    };
    fetchProductos();
  }, []);

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
          if (codigoInputRef.current) {
            codigoInputRef.current.value = codigoBuffer;
            // Enfocar el siguiente campo después de escanear
            const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
            if (nombreInput) nombreInput.focus();
          }
        }
        setCodigoBuffer('');
        setEscaneando(false);
      } else if (e.key.length === 1) {
        setCodigoBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [escaneando]);

  // Cuando se activa el escaneo, enfocar el campo de código
  useEffect(() => {
    if (escaneando && codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, [escaneando]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const producto = {
        id: productoActual?.id || Date.now(),
        codigo: formData.get('codigo') as string,
        nombre: formData.get('nombre') as string,
        precio: Number(formData.get('precio')),
        cantidad: Number(formData.get('cantidad')),
      };

      if (productoActual) {
        const res = await fetch(`http://localhost:3000/api/productos/${producto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(producto),
        });
        if (!res.ok) throw new Error('Error al actualizar producto');
        const data = await res.json();
        actualizarProducto(data);
      } else {
        const res = await fetch('http://localhost:3000/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(producto),
        });
        if (!res.ok) throw new Error('Error al crear producto');
        const data = await res.json();
        agregarProducto(data);
      }
      
      setModalOpen(false);
      setProductoActual(null);
      setCodigoBuffer('');
    } catch (err) {
      setError('Error al guardar el producto. Intente nuevamente.');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/productos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar producto');
      eliminarProducto(id);
    } catch (err) {
      setError('Error al eliminar el producto. Intente nuevamente.');
      console.error('Error:', err);
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <button
          onClick={() => {
            setModalOpen(true);
            setTimeout(() => setEscaneando(true), 100);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700"
        >
          <Plus size={20} />
          <span>Nuevo Producto</span>
        </button>
      </div>

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
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosFiltrados.map((producto) => (
              <tr key={producto.id}>
                <td className="px-6 py-4 whitespace-nowrap">{producto.codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap">{producto.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${producto.precio.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{producto.cantidad}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setProductoActual(producto);
                        setModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {productoActual ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form id="producto-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Código
                </label>
                <div className="mt-1 flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      ref={codigoInputRef}
                      name="codigo"
                      defaultValue={productoActual?.codigo || ''}
                      className="pl-10 pr-4 py-2 w-full border rounded-md"
                      readOnly={escaneando}
                      placeholder={escaneando ? 'Esperando lectura del código...' : 'Código del producto'}
                    />
                    <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEscaneando(!escaneando)}
                    className={`px-4 py-2 rounded-md ${
                      escaneando
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Barcode size={20} />
                  </button>
                </div>
                {escaneando && (
                  <p className="mt-1 text-sm text-green-600">
                    Esperando lectura del código de barras...
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  name="nombre"
                  defaultValue={productoActual?.nombre}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  name="precio"
                  type="number"
                  step="0.01"
                  defaultValue={productoActual?.precio}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad
                </label>
                <input
                  name="cantidad"
                  type="number"
                  defaultValue={productoActual?.cantidad}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setProductoActual(null);
                    setCodigoBuffer('');
                    setEscaneando(false);
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};