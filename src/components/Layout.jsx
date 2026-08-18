// src/components/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import { useUser } from "../context/UserContext.jsx";

export default function Layout() {
  const [expanded, setExpanded] = useState(false);
  const { loading } = useUser();

 
  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-950 bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            💸
          </div>
          <p className="text-sm font-semibold tracking-wider uppercase text-slate-400">Cargando tu hogar...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-100 text-dark transition-colors duration-300 pb-20">
      <Navbar />
      <div className="flex flex-1 ">
        {/* Sidebar: Solo visible en PC (md) */}
        <div className="hidden md:block h-full">
          <Sidebar expanded={expanded} setExpanded={setExpanded} />
        </div>

        {/* Contenido Principal */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 pb-16 md:pb-0 ${expanded ? 'md:ml-64' : 'md:ml-20'}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav: Solo visible en celular (md:hidden) */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}