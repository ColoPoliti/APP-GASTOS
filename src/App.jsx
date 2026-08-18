import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { BounceLoader } from 'react-spinners';
import { supabase } from './supabaseClient';

function ForceDashboardRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasRedirected.current) {
      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '' || location.pathname !== '/dashboard') {
        navigate('/dashboard', { replace: true });
      }
      hasRedirected.current = true;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function AppContent() {
  const { sesion, loading, hogarId } = useUser();

  // Freno total mientras valida sesión y perfil de usuario
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

          <div className="fixed bottom-4 left-4 z-50">
            <PushManager />
          </div>
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