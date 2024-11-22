import { create } from 'zustand';
import { Producto } from '../types';

interface InventarioState {
  productos: Producto[];
  setProductos: (productos: Producto[]) => void;
  agregarProducto: (producto: Producto) => void;
  actualizarProducto: (producto: Producto) => void;
  eliminarProducto: (id: number) => void;
}

export const useInventarioStore = create<InventarioState>((set) => ({
  productos: [],
  setProductos: (productos) => set({ 
    productos: productos.map(p => ({
      ...p,
      precio: Number(p.precio),
      cantidad: Number(p.cantidad)
    }))
  }),
  agregarProducto: (producto) =>
    set((state) => ({ 
      productos: [...state.productos, {
        ...producto,
        precio: Number(producto.precio),
        cantidad: Number(producto.cantidad)
      }]
    })),
  actualizarProducto: (producto) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === producto.id ? {
          ...producto,
          precio: Number(producto.precio),
          cantidad: Number(producto.cantidad)
        } : p
      ),
    })),
  eliminarProducto: (id) =>
    set((state) => ({
      productos: state.productos.filter((p) => p.id !== id),
    })),
}));