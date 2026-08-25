import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle'; // Asegurate de importar la ruta correcta

export default function Dropdown({ label, items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botón activador */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full justify-between items-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none cursor-pointer"
      >
        {label}
        <svg className={`ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-1 z-10 mt-4 w-48 origin-top-right shadow dark:bg-slate-900 bg-white dark:border dark:border-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200 rounded-xl overflow-hidden">
          <div className="py-1">
            {items.map((item, index) => {
              if (item.path) {
                return (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-2 text-sm dark:text-slate-300 text-slate-950  hover:font-bold transition-colors text-left"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (onSelect) onSelect(item);
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-sm dark:text-slate-300 text-slate-950  hover:text-slate-950  hover:font-bold transition-colors text-left cursor-pointer"
                >
                  {item.label}
                </button>
              );
            })}

    
            <div className="border-t dark:border-slate-800 border-slate-200 mt-1 pt-1">
              <ThemeToggle asMenuItem={true} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}