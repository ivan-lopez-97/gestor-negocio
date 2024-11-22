import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Inventario } from './pages/Inventario';
import { Ventas } from './pages/Ventas';
import { Reportes } from './pages/Reportes';
import { useAuthStore } from './store/authStore';

function App() {
  const { usuario } = useAuthStore();

  if (!usuario) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {usuario.rol === 'administrador' ? (
            <>
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/" element={<Navigate to="/inventario" replace />} />
            </>
          ) : (
            <>
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/" element={<Navigate to="/ventas" replace />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;