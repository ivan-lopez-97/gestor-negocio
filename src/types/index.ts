export interface Usuario {
  id: number;
  nombre: string;
  rol: 'vendedor' | 'administrador';
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Venta {
  id: number;
  fecha: string;
  productos: {
    producto: Producto;
    cantidad: number;
  }[];
  total: number;
  vendedor: Usuario;
}