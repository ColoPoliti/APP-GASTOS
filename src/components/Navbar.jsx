import React, { useState, useEffect } from 'react';
import { useUser } from "../context/UserContext.jsx";
import { supabase } from '../supabaseClient';
import Dropdown from './Dropdown.jsx';
import NotificacionesDropdown from './NotificacionesDropdown';
import { FaEllipsisV } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";

const Navbar = () => {
    const { nombreHogar, nombreUsuario, hogarId, sesion, actualizarHogar } = useUser();
    
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') setShowInstallButton(false);
            setDeferredPrompt(null);
        });
    };

    const handleCambiarHogar = async () => {
        if (!sesion?.user?.id) return;
        try {
            await supabase.from('perfiles').update({ hogar_id: null }).eq('id', sesion.user.id);
            actualizarHogar(null, '');
        } catch (err) {
            console.error("Error al desvincular el Bolsillo:", err);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        actualizarHogar(null, '');
    };

    const opciones = [
        { label: 'Ver Perfil', value: 'perfil' },
        { label: 'Cambiar Compartido', value: 'cambiar_hogar' },
        { label: 'Cerrar Sesión', value: 'logout' }
    ];

    const manejarSeleccion = async (item) => {
        if (item.value === 'logout') await handleLogout();
        else if (item.value === 'cambiar_hogar') await handleCambiarHogar();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 z-50">
            {/* Logo */}
            <div className="flex items-center gap-2 text-2xl text-white font-bold whitespace-nowrap">
                <GiTakeMyMoney className="md:text-6xl"/> <span>Gatillar</span>
            </div>

            <div className="flex items-center gap-4 text-xs md:text-sm">
                {showInstallButton && (
                    <button 
                        onClick={handleInstall}
                        className="bg-slate-900 text-white px-3 py-1.5 rounded-full font-bold shadow-md transition-colors border border-slate-700"
                    >
                        📲 Instalar App
                    </button>
                )}

                <p className="bg-slate-900 text-white px-3 py-1.5 rounded-full hidden sm:flex items-center gap-1 shadow-sm">
                    <span>Bolsillo:</span> {nombreHogar ? <span className="font-bold text-indigo-300">{nombreHogar}</span> : 'Ninguno'}
                    {hogarId && (
                        <button 
                            onClick={handleCambiarHogar} 
                            className="ml-2 px-2 py-0.5 text-xs font-semibold text-rose-300 bg-rose-900/30 rounded-full hover:bg-rose-900/50 hover:text-white transition-colors border border-rose-800"
                        >
                            Cambiar
                        </button>
                    )}
                </p>
                <p className="font-bold text-white hidden sm:block">{nombreUsuario}</p>
    
                {/* COMPONENTE DE NOTIFICACIONES */}
                <NotificacionesDropdown />

                <div className="[&_button]:hover:bg-transparent [&_button]:bg-transparent [&_button]:shadow-none [&_button]:border-0 text-white text-lg">
                    <Dropdown
                        label={<FaEllipsisV className="cursor-pointer text-white" />}
                        items={opciones}
                        onSelect={manejarSeleccion}
                    />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;