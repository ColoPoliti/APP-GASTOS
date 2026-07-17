import { useTheme } from './context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="px-2 py-2 absolute bottom-10 right-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white transition-all duration-300"
    >
      {theme === 'light' ? '☀️' : ' 🌙'}
    </button>
  );
}