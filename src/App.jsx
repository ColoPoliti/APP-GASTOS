
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SideBar from './components/SideBar';
import Dashboard from './pages/DashboardRefact.jsx';
import Login from './pages/Login';
import Graficos from './pages/Graficos';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import Layout from './components/Layout';
import { UserProvider, useUser } from './context/UserContext.jsx'; 
import SetupHogar from "./components/SetupHogar";
import PaginaHistorial from './pages/PaginaHistorial';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const { sesion, loading, hogarId, setHogarId } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Cargando...</div>;

  if (!sesion) return <Login />;

  if (!hogarId) {
    return (
      <SetupHogar 
        userId={sesion.user.id} 
        onHogarSet={(nuevoId) => setHogarId(nuevoId)} 
      />
    );
  }

  // 3. Si SÍ hay sesión, mostramos el contenido principal
  return (
 <BrowserRouter>
      <ThemeToggle />
      <div className="flex">
        {/* Tu Sidebar debería ir aquí si quieres que se vea siempre */}
        
        
        <main className="flex-1 mt-12 transition-all duration-300">
          <Routes>
            <Route element={<Layout />}>
              {/* CAMBIO: Agregué path="/dashboard" y un redirect para la raíz */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/historial" element={<PaginaHistorial />} />
            </Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}