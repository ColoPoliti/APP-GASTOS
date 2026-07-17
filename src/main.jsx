import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@trendmicro/react-sidenav/dist/react-sidenav.css'; // Primero la librería
import './index.css'; // DESPUÉS tu CSS (esto le da prioridad a tu archivo)
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'; 
import 'font-awesome/css/font-awesome.min.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)