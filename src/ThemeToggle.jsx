import { useTheme } from './context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle({ isOpen = false }) {
  const { theme, toggleTheme } = useTheme();

  // Si el modal está abierto, podemos ocultarlo por completo
  if (isOpen) return null;

  return (
<button 
      onClick={toggleTheme}
      className={`fixed flex rounded-full transition-all duration-300 shadow-xl z-[9999] items-center justify-center border 
        top-[12px] left-1/2 -translate-x-1/2 w-10 h-10 
        md:top-auto md:bottom-10 md:right-10 md:left-auto md:translate-x-0 md:w-14 md:h-14 
        ${
          theme === 'light' 
            ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' 
            : 'bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900'
        }`}
    >
      <FontAwesomeIcon icon={theme === 'light' ? faSun : faMoon} className="text-base md:text-xl" />
    </button>
  );
}