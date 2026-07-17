// src/components/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav'; // Importalo

export default function Layout() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="h-screen bg-white dark:bg-gray-950 dark:text-white flex flex-col">
        <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Solo visible en PC (md) */}
        <div className="hidden md:block h-full">
          <Sidebar expanded={expanded} setExpanded={setExpanded} />
        </div>

        {/* Contenido Principal */}
        <main className={`flex-1 overflow-y-auto transition-all pt-16 duration-300 pb-16 md:pb-0 ${expanded ? 'md:ml-64' : 'md:ml-20'}`}>
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