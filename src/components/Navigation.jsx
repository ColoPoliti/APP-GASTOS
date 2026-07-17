// src/components/Navigation.jsx
import SideNav from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';

export default function Navigation({ expanded, setExpanded }) {
  return (
    <SideNav
      expanded={expanded} // Controlamos el estado aquí
      onToggle={(expanded) => setExpanded(expanded)} // Actualizamos estado al hacer clic
      onSelect={(selected) => {
        const to = selected === 'home' ? '/' : '/' + selected;
        if (location.pathname !== to) {
          navigate(to);
          setExpanded(false); // Cerramos al navegar
        }
      }}
      style={{ position: 'fixed', height: '100%', top: '64px', display:'table', background:'#010413', width:'83px', padding:'9px 0 0 9px' }} 
    >
      <SideNav.Toggle />
      <SideNav.Nav defaultSelected="home">
        <NavItem eventKey="home">
          <NavIcon><i className="fa fa-fw fa-home" style={{ fontSize: '1.5em' }} /></NavIcon>
          <NavText>Inicio</NavText>
        </NavItem>
        <NavItem eventKey="graficos">
          <NavIcon><i className="fa fa-fw fa-line-chart" style={{ fontSize: '1.5em' }} /></NavIcon>
          <NavText>Gráficos</NavText>
        </NavItem>
      </SideNav.Nav>
    </SideNav>
  );
}