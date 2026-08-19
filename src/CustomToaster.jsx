import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './context/ThemeContext';

export default function CustomToaster() {
  const { theme } = useTheme();

  const esLight = theme === 'light';

  return (
    <Toaster 
      position="bbottom-center"
      toastOptions={{
        style: {
          background: esLight ? '#0f172a' : '#ffffff',
          color: esLight ? '#ffffff':'#0f172a' ,
          border: esLight ? '1px solid #cbd5e1' : '1px solid #334155',
          fontWeight: 'bold',
          zIndex: 999999,
        },
      }}
      containerStyle={{
        bottom: 20,
      }}
    />
  );
}