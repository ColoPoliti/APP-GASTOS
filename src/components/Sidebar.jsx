import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { navLinks } from '../config/navLinks';
import './App.css';

export default function Sidebar({ expanded, setExpanded }) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);

    // Efecto para cerrar el sidebar al hacer click fuera de él cuando está expandido
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (expanded && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expanded, setExpanded]);

    const handleNavigation = (id, e) => {
        e.currentTarget.blur();
        const route = id === 'dashboard' ? '/' : `/${id}`;
        navigate(route);
        setExpanded(false);
    };

    const currentPath = location.pathname;

    return (
        <aside
            ref={sidebarRef}
            className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out shadow-xl flex flex-col ${
                expanded ? 'w-64' : 'w-20'
            } ${
                theme === 'dark' 
                    ? 'bg-[#060a17] text-white' 
                    : 'bg-[#060a17] text-white'
            }`}
        >
            {/* Botón de Toggle Manual */}
            <div className="flex items-center justify-end p-4">
                <button
                    onClick={(e) => {
                        e.currentTarget.blur();
                        setExpanded(!expanded);
                    }}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="p-2 rounded-full hover:bg-white/10 active:bg-transparent transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <i className={`fa fa-fw ${expanded ? 'fa-angle-left' : 'fa-angle-right'}`} style={{ fontSize: '1.2em' }} />
                </button>
            </div>

            {/* Lista de Enlaces */}
            <nav className="flex-1 overflow-y-auto py-2">
                <ul className="space-y-2 px-2">
                    {navLinks.map((link) => {
                        const linkRoute = link.id === 'dashboard' ? '/' : `/${link.id}`;
                        const isActive = currentPath === linkRoute || (link.id === 'dashboard' && currentPath === '/dashboard');

                        return (
                            <li key={link.id} className="relative">
                                <button
                                    onClick={(e) => handleNavigation(link.id, e)}
                                    style={{ outline: 'none', boxShadow: 'none' }}
                                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group select-none ${
                                        isActive 
                                            ? 'font-semibold text-cyan-400 bg-transparent' 
                                            : 'hover:bg-white/10 text-inherit bg-transparent'
                                    }`}
                                >
                                    {/* Contenedor del icono 100% circular */}
                                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                        isActive ? 'bg-cyan-500/20 text-cyan-400' : 'group-hover:bg-white/20'
                                    }`}>
                                        <i className={`fa fa-fw ${link.icon}`} style={{ fontSize: '1.3em' }} />
                                        
                                        {/* Puntito más pequeño indicador */}
                                        {!isActive && (
                                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-75"></span>
                                        )}
                                    </div>

                                    {/* Texto del menú */}
                                    <span
                                        className={`whitespace-nowrap transition-opacity duration-200 txt-dark ${
                                            isActive ? 'text-cyan-400 font-bold' : ''
                                        } ${
                                            expanded ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'
                                        }`}
                                    >
                                        {link.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}