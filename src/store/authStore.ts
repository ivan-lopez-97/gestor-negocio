import { create } from 'zustand';
import { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  setUsuario: (usuario) => set({ usuario }),
}));