import { useState, useEffect, useRef } from 'react';

export default function Dropdown({ label, items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Hook para detectar clic afuera
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
        className="inline-flex w-full justify-between items-center rounded-lg  px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none"
      >
        {label}
        <svg className={`ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-slate-900 border border-slate-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="block w-full px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}