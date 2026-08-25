// src/components/ThemeToggle.jsx
import { useTheme } from './context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle({ isOpen = false, asMenuItem = false }) {
  const { theme, toggleTheme } = useTheme();

  if (isOpen && !asMenuItem) return null;

  // Si se usa dentro del menú desplegable
  if (asMenuItem) {
    return (
      <button
        onClick={toggleTheme}
        className="flex w-full items-center justify-between px-4 py-2 text-sm dark:text-slate-300 text-slate-950 hover:bg-indigo-600 hover:text-white hover:font-bold transition-colors text-left cursor-pointer"
      >
        <span className="text-slate-950 dark:text-indigo-300">Tema {theme === 'light' ? 'Claro' : 'Oscuro'}</span>
        <FontAwesomeIcon 
          icon={theme === 'light' ? faSun : faMoon} 
          className="text-base text-amber-500 dark:text-indigo-300" 
        />
      </button>
    );
  }

  // Comportamiento original flotante (para PC o cuando no es ítem)
  return (
<button 
      onClick={toggleTheme}
      className={`fixed hidden md:flex items-center  px-1.5 py-1.5 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md z-40 border cursor-pointer group 
        md:bottom-8 md:right-8 
        ${
          theme === 'light' 
            ? 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white hover:shadow-xl hover:border-amber-300' 
            : 'bg-slate-900/80 text-slate-200 border-slate-800 hover:bg-slate-900 hover:shadow-xl hover:border-indigo-600'
        }`}
      title="Cambiar tema"
    >
      <div className={`w-6 h-6 p-5 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-45 ${theme === 'light' ? 'text-amber-500' : 'text-indigo-400'}`}>
        <FontAwesomeIcon icon={theme === 'light' ? faSun : faMoon} className="text-base" />
      </div>
    
    </button>
  );
}