import { useTheme } from './context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
<button 
  onClick={toggleTheme}
  className={`fixed top-[85px] right-6 md:top-auto md:bottom-10 md:right-10 rounded-full transition-all duration-300 shadow-lg z-50 flex items-center justify-center border w-14 h-14 ${
    theme === 'light' 
      ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' 
      : 'bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900'
  }`}
>
  <FontAwesomeIcon icon={theme === 'light' ? faSun : faMoon} className="text-xl" />
</button>
  );
}