import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import UserMenu from './UserMenu';
import { useUser } from "../context/UserContext.jsx";
import { supabase } from '../supabaseClient';
import Dropdown from '../components/Dropdown.jsx';
import { FaPen, FaTrash, FaEllipsisV  } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";

const Navbar = () => {
    // Definimos todo una sola vez
    const { nombreUsuario, hogarId, setHogarId, sesion } = useUser();

    const handleCambiarHogar = async () => {
        if (!sesion?.user?.id) return;

        await supabase
            .from('perfiles')
            .update({ hogar_id: null })
            .eq('id', sesion.user.id);

        setHogarId(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setHogarId(null);
        localStorage.removeItem('hogar_id');
    };

    const opciones = [
        { label: 'Ver Perfil', value: 'perfil' },
        { label: 'Cambiar Compartido', value: 'cambiar_hogar' },
        { label: 'Cerrar Sesión', value: 'logout' }
    ];

   const manejarSeleccion = async (item) => {
  if (item.value === 'logout') {
    await handleLogout();
  } else if (item.value === 'cambiar_hogar') {
    // Reutilizamos tu lógica de cambiar hogar
    if (!sesion?.user?.id) return;
    
    await supabase
      .from('perfiles')
      .update({ hogar_id: null })
      .eq('id', sesion.user.id);

    setHogarId(null);
    localStorage.removeItem('hogar_id');
  }
};

    return (
           
        <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 z-50">
    {/* Logo */}
    <div className="flex items-center gap-2 text-xl font-bold whitespace-nowrap">
        <GiTakeMyMoney /> <span>Control de Gastos</span>
    </div>

<div className="flex items-center gap-4 text-xs md:text-sm">
    <p className="bg-slate-900 text-white px-2 py-1 rounded hidden sm:block">
        {/* Aquí mostramos que estamos dentro de un hogar, sin intentar fetchear el nombre */}
        Hogar: {hogarId ? 'Activo' : 'Ninguno'} 
        {hogarId && (
            <button 
                onClick={handleCambiarHogar} 
                className="ml-2 px-2 py-1 text-xs font-semibold text-rose-300 bg-rose-900/30 rounded hover:bg-rose-900/50 hover:text-white transition-colors border border-rose-800"
            >
                Cambiar
            </button>
        )}
    </p>
    <p className="font-bold hidden sm:block">{nombreUsuario}</p>
    
    <Dropdown
        label={<FaEllipsisV />}
        items={opciones}
        onSelect={manejarSeleccion}
    />
</div>
</nav>
    );
};

export default Navbar;