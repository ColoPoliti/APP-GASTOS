import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/DashboardRefact.jsx';
import Login from './pages/Login';
import Graficos from './pages/Graficos';
import ThemeToggle from './ThemeToggle';
import Layout from './components/Layout';
import { UserProvider, useUser } from './context/UserContext.jsx'; 
import SetupHogar from "./components/SetupHogar";
import PaginaHistorial from './pages/PaginaHistorial';
import PaginaGestionGastos from './pages/PaginaGestionGastos';
import { BounceLoader } from 'react-spinners';
import { supabase } from './supabaseClient';

// Componente para forzar la redirección al dashboard al arrancar o loguearse
function ForceDashboardRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Si acaba de arrancar la app y está en la raíz, login, o cualquier otra página vieja, 
    // lo mandamos al dashboard una sola vez al inicio.
    if (!hasRedirected.current) {
      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '' || location.pathname !== '/dashboard') {
        navigate('/dashboard', { replace: true });
      }
      hasRedirected.current = true;
    }

    // Escuchamos por si hace login en caliente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]); // Quitamos location.pathname de las dependencias para que solo actúe al montar

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
  
  if (!hogarId) return <SetupHogar userId={sesion.user.id} onHogarSet={() => {}} />;

  return (
    <>
      <ForceDashboardRedirect />
      <ThemeToggle />
      <div className="flex">
        <main className="flex-1 mt-12 transition-all duration-300">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/historial" element={<PaginaHistorial />} />
              <Route path="/gestion-gastos" element={<PaginaGestionGastos />} />
            </Route>
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}