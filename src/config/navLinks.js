export const navLinks = [
  { id: "dashboard", label: "Dashboard", icon: "fa-home", path: "/dashboard" },
  {
    id: "gestion-gastos",
    label: "Gestión de Gastos",
    icon: "fa-plus-circle",
    path: "/gestion-gastos",
  },
  {
    id: "transferencias",
    label: "Transferencias",
    icon: "fa-exchange",
    path: "/transferencias",
  },
  {
    id: "historial",
    label: "Gastos por Usuarios",
    icon: "fa-users",
    path: "/historial",
  },
  {
    id: "graficos",
    label: "Gráficos",
    icon: "fa-line-chart",
    path: "/graficos",
  },
  {
    id: "finanzas",
    label: "Mis Finanzas",
    icon: "FaMoneyBillWave",
    path: "/finanzas",
  },
];

// Vaquitas es un MUNDO APARTE del Bolsillo: se muestra separado en el menú
// y es una sección Premium (sección con suscripción).
export const vaquitasLink = {
  id: "vaquitas",
  label: "Vaquita",
  icon: "fa-piggy-bank",
  path: "/vaquitas",
  premium: true,
};

export const userLinks = [
  { id: "profile", label: "Mi Perfil", path: "/profile" },
  { id: "settings", label: "Configuración", path: "/settings" },
  { id: "logout", label: "Cerrar Sesión", path: "/logout" },
];
