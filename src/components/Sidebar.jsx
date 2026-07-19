import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { navLinks } from '../config/navLinks';
import './App.css';

export default function Sidebar({ expanded, setExpanded }) {
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <SideNav
            className="sidecolor"
            expanded={expanded}
            onToggle={(expanded) => setExpanded(expanded)}
            onSelect={(selected) => {
                // Si la ruta es 'dashboard', navegamos a '/', si no, a la ruta seleccionada
                const route = selected === 'dashboard' ? '/' : `/${selected}`;
                navigate(route);
            }}
            style={{
                position: 'fixed',
                top: '64px',
                height: 'calc(100vh - 64px)',
                // Forzamos el background para que no sea transparente
                background: theme === 'dark'
                    ? '#060a17'
                    : 'linear-gradient(to bottom, #818cf8, #c084fc, #f472b6)',
                borderRight: theme === 'dark' ? 'none' : '1px solid #d1d5db',
                zIndex: 40 // Un poco más bajo que el Navbar (que es 50) para que no tape nada
            }}
        >
            <SideNav.Toggle className="sidecolor" />
            <SideNav.Nav defaultSelected="dashboard">
                {navLinks.map((link) => (
                    <NavItem key={link.id} eventKey={link.id}>
                        <NavIcon>
                            <i className={`fa fa-fw ${link.icon}`} style={{ fontSize: '1.5em' }} />
                        </NavIcon>
                        <NavText className="txt-dark">{link.label}</NavText>
                    </NavItem>
                ))}
            </SideNav.Nav>
        </SideNav>
    );
}