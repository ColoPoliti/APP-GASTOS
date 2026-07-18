
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
  const { sesion, loading, hogarId } = useUser();

  if (loading) return <div>Cargando...</div>;
  if (!sesion) return <Login />;
  
  // Si no hay hogar, mostramos SetupHogar sin romper la navegación
  if (!hogarId) return <SetupHogar userId={sesion.user.id} onHogarSet={(id) => window.location.reload()} />;

  return (
    <>
      <ThemeToggle />
      <div className="flex">
        <main className="flex-1 mt-12 transition-all duration-300">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/historial" element={<PaginaHistorial />} />
            </Route>
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