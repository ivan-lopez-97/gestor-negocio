import { create } from 'zustand';
import { Venta } from '../types';

interface VentasState {
  ventas: Venta[];
  setVentas: (ventas: Venta[]) => void;
  agregarVenta: (venta: Venta) => void;
  cancelarVenta: (id: number) => void;
}

export const useVentasStore = create<VentasState>((set) => ({
  ventas: [],
  setVentas: (ventas) => set({ ventas }),
  agregarVenta: (venta) =>
    set((state) => ({ ventas: [...state.ventas, venta] })),
  cancelarVenta: (id) =>
    set((state) => ({
      ventas: state.ventas.filter((v) => v.id !== id),
    })),
}));