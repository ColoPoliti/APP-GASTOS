import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { navLinks } from '../config/navLinks';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <nav 
      className={`md:hidden fixed bottom-0 left-0 w-full h-16 flex justify-around items-center border-t transition-colors duration-500 z-50
      ${theme === 'dark' ? 'bg-[#060a17] border-gray-800' : 'bg-white border-gray-200'}`}
    >
      {navLinks.map((link) => (
        <button 
          key={link.id}
          onClick={() => navigate('/' + link.id)}
          className={`flex flex-col items-center justify-center w-full h-full text-xs transition-colors
          ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
        >
          <i className={`fa ${link.icon} text-lg mb-1`} />
          <span>{link.label}</span>
        </button>
      ))}
    </nav>
  );
}