import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Package, ShoppingCart, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { usuario, setUsuario } = useAuthStore();

  const cerrarSesion = () => {
    setUsuario(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">Sistema de Gestión</span>
            </div>
            
            {usuario && (
              <div className="flex items-center space-x-4">
                {usuario.rol === 'administrador' && (
                  <>
                    <button
                      onClick={() => navigate('/inventario')}
                      className="flex items-center space-x-2 hover:text-indigo-200"
                    >
                      <Package size={20} />
                      <span>Inventario</span>
                    </button>
                    <button
                      onClick={() => navigate('/reportes')}
                      className="flex items-center space-x-2 hover:text-indigo-200"
                    >
                      <BarChart3 size={20} />
                      <span>Reportes</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate('/ventas')}
                  className="flex items-center space-x-2 hover:text-indigo-200"
                >
                  <ShoppingCart size={20} />
                  <span>Ventas</span>
                </button>
                <button
                  onClick={cerrarSesion}
                  className="flex items-center space-x-2 hover:text-indigo-200"
                >
                  <LogOut size={20} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};