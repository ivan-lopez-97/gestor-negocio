import React, { useState, useEffect } from 'react';
import { useVentasStore } from '../store/ventasStore';
import { FileDown, Calendar, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Venta } from '../types';

export const Reportes: React.FC = () => {
  const { ventas, setVentas } = useVentasStore();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventasFiltradas, setVentasFiltradas] = useState<Venta[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/ventas');
        if (!response.ok) throw new Error('Error al cargar las ventas');
        const data = await response.json();
        setVentas(data);
        setVentasFiltradas(data);
      } catch (err) {
        setError('Error al cargar las ventas. Verifique la conexión al servidor.');
        console.error('Error:', err);
      }
    };
    cargarVentas();
  }, [setVentas]);

  const filtrarVentas = () => {
    let ventasFiltradas = [...ventas];

    if (fechaInicio || fechaFin) {
      ventasFiltradas = ventasFiltradas.filter((venta) => {
        const fechaVenta = new Date(venta.fecha);
        const inicio = fechaInicio ? new Date(fechaInicio) : null;
        const fin = fechaFin ? new Date(fechaFin) : null;

        if (inicio && fin) {
          return fechaVenta >= inicio && fechaVenta <= fin;
        } else if (inicio) {
          return fechaVenta >= inicio;
        } else if (fin) {
          return fechaVenta <= fin;
        }
        return true;
      });
    }

    if (busqueda) {
      ventasFiltradas = ventasFiltradas.filter((venta) => 
        venta.productos.some(item => 
          item.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.producto.codigo.toLowerCase().includes(busqueda.toLowerCase())
        ) ||
        venta.vendedor.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setVentasFiltradas(ventasFiltradas);
  };

  useEffect(() => {
    filtrarVentas();
  }, [busqueda, fechaInicio, fechaFin, ventas]);

  const generarPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Ventas', 14, 20);

    // Período
    doc.setFontSize(12);
    doc.text(
      `Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}`,
      14,
      30
    );

    // Tabla de ventas
    const ventasData = ventasFiltradas.map((venta) => {
      const productosStr = venta.productos
        .map((p) => `${p.producto.nombre} (${p.cantidad})`)
        .join('\n');

      return [
        new Date(venta.fecha).toLocaleDateString(),
        venta.vendedor.nombre,
        productosStr,
        `$${venta.total.toFixed(2)}`,
      ];
    });

    (doc as any).autoTable({
      startY: 40,
      head: [['Fecha', 'Vendedor', 'Productos (Cantidad)', 'Total']],
      body: ventasData,
      styles: { cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 80 },
        3: { cellWidth: 30 },
      },
    });

    // Resumen
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    const totalGeneral = ventasFiltradas.reduce((sum, venta) => sum + venta.total, 0);
    const totalProductos = ventasFiltradas.reduce(
      (sum, venta) => sum + venta.productos.reduce((s, p) => s + p.cantidad, 0),
      0
    );

    doc.text('Resumen:', 14, finalY + 10);
    doc.text(`Total Ventas: $${totalGeneral.toFixed(2)}`, 14, finalY + 20);
    doc.text(`Total Productos Vendidos: ${totalProductos}`, 14, finalY + 30);

    doc.save('reporte-ventas.pdf');
  };

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
        <h1 className="text-2xl font-bold">Reportes de Ventas</h1>
        <button
          onClick={generarPDF}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700"
        >
          <FileDown size={20} />
          <span>Descargar PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha Inicio
          </label>
          <div className="mt-1 relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha Fin
          </label>
          <div className="mt-1 relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Buscar
          </label>
          <div className="mt-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por producto o vendedor..."
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasFiltradas.map((venta) => (
              <tr key={venta.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(venta.fecha).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {venta.vendedor.nombre}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {venta.productos.map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.producto.nombre} - {item.cantidad} unidades a ${item.producto.precio}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${venta.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="text-xl font-bold">
          Total General: ${ventasFiltradas.reduce((sum, venta) => sum + venta.total, 0).toFixed(2)}
        </div>
        <div className="text-gray-600">
          Total Productos Vendidos: {
            ventasFiltradas.reduce(
              (sum, venta) => sum + venta.productos.reduce((s, p) => s + p.cantidad, 0),
              0
            )
          }
        </div>
      </div>
    </div>
  );
};