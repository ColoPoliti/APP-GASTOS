import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import PushManager from './components/PushManager';
import Dashboard from './pages/DashboardRefact.jsx';
import Login from './pages/Login';
import Graficos from './pages/Graficos';
import ThemeToggle from './ThemeToggle';
import Layout from './components/Layout';
import { UserProvider, useUser } from './context/UserContext.jsx';
import SetupHogar from "./components/SetupHogar";
import PaginaHistorial from './pages/PaginaHistorial';
import PaginaGestionGastos from './pages/PaginaGestionGastos';
import PaginaTransferencias from './pages/PaginaTransferencias';
import { BounceLoader } from 'react-spinners';
import CustomToaster from './CustomToaster.jsx';
import PaginaPerfil from './pages/PaginaPerfil';

// Componente ScrollToTop a prueba de balas para resetear la vista al cambiar de ruta
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);

        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }

        const elementosConScroll = document.querySelectorAll('*');
        elementosConScroll.forEach(el => {
            if (el.scrollTop > 0) {
                el.scrollTop = 0;
            }
        });
    }, [pathname]);

    return null;
}

function AppContent() {
  const { sesion, loading, hogarId } = useUser();

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <BounceLoader color="#ffffff" size={60} />
      </div>
    );
  }

  if (!sesion) return <Login />;

  if (!hogarId) return <SetupHogar userId={sesion.user.id} onHogarSet={() => { }} />;

  return (
    <>
      <ThemeToggle />
      <div className="flex w-full overflow-x-hidden">
        <main className="flex-1 w-full min-w-0 mt-12 transition-all duration-300 overflow-x-hidden">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/historial" element={<PaginaHistorial />} />
              <Route path="/gestion-gastos" element={<PaginaGestionGastos />} />
              <Route path="/transferencias" element={<PaginaTransferencias />} />
              <Route path="/profile" element={<PaginaPerfil />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <div className="fixed bottom-4 left-4 z-50">
            <PushManager />
          </div>
        </main>
      </div>

      <CustomToaster />
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}