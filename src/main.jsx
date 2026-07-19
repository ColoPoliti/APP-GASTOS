import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@trendmicro/react-sidenav/dist/react-sidenav.css'; 
import './index.css';
import './App.css';
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