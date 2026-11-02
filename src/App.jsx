import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import PushManager from "./components/PushManager";
import ReloadPrompt from "./components/ReloadPrompt";
import Dashboard from "./pages/DashboardRefact.jsx";
import Login from "./pages/Login";
import Graficos from "./pages/Graficos";
import MisFinanzas from "./components/MisFinanzas";
import VaquitasManager from "./components/VaquitasManager"; // <--- 1. Importamos el componente de Vaquitas
import ThemeToggle from "./ThemeToggle";
import Layout from "./components/Layout";
import { UserProvider, useUser } from "./context/UserContext.jsx";
import SetupHogar from "./components/SetupHogar";
import PaginaHistorial from "./pages/PaginaHistorial";
import PaginaGestionGastos from "./pages/PaginaGestionGastos";
import PaginaTransferencias from "./pages/PaginaTransferencias";
import AceptarInvitacion from "./components/AceptarInvitacion";
import { HashLoader } from "react-spinners";
import CustomToaster from "./CustomToaster.jsx";
import PaginaPerfil from "./pages/PaginaPerfil";
import { supabase } from "./supabaseClient.js";

// Componente ScrollToTop a prueba de balas para resetear la vista al cambiar de ruta
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const mainContainer = document.querySelector("main");
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }

    const elementosConScroll = document.querySelectorAll("*");
    elementosConScroll.forEach((el) => {
      if (el.scrollTop > 0) {
        el.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
}

function AppContent() {
  const { sesion, loading, hogarId, refrescarPerfil } = useUser();
  const location = useLocation();
  const [invitacionPendiente, setInvitacionPendiente] = useState(null);
  const [verificandoInvitacion, setVerificandoInvitacion] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const chequearInvitaciones = async () => {
      if (!sesion?.user?.email) {
        if (isMounted) setVerificandoInvitacion(false);
        return;
      }

      setVerificandoInvitacion(true);

      try {
        const { data } = await supabase
          .from("invitaciones")
          .select("*, hogares(codigo)")
          .eq("email_invitado", sesion.user.email)
          .eq("estado", "pendiente");

        if (isMounted) {
          if (data && data.length > 0) {
            setInvitacionPendiente(data[0]);
          } else {
            setInvitacionPendiente(null);
          }
        }
      } catch (error) {
        console.error("Error al verificar invitaciones en App:", error);
      } finally {
        if (isMounted) {
          setVerificandoInvitacion(false);
        }
      }
    };

    if (sesion) {
      chequearInvitaciones();
    } else {
      setVerificandoInvitacion(false);
    }

    return () => {
      isMounted = false;
    };
  }, [sesion?.user?.email]);

  if (loading || verificandoInvitacion) {
    const isDark = document.documentElement.classList.contains("dark");
    const colorLoader = isDark ? "#ffffff" : "#4f46e5";

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center dark:bg-slate-950 bg-slate-50 transition-colors duration-300 gap-4">
        <HashLoader color={colorLoader} size={60} />
        Cargando tus datos de perfil...
      </div>
    );
  }
  if (!sesion) return <Login />;

  // 1. Si hay invitación pendiente, se muestra el modal
  if (invitacionPendiente) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✉️
          </div>
          <div>
            <h2 className="text-white text-xl font-bold mb-2">
              ¡Tenés una invitación!
            </h2>
            <p className="text-slate-300 text-sm">
              Te invitaron a unirte al hogar:{" "}
              <strong className="text-indigo-400">
                {invitacionPendiente.hogares?.codigo}
              </strong>
            </p>
          </div>
          <div className="pt-2">
            <AceptarInvitacion
              invitacion={invitacionPendiente}
              onAceptado={() => {
                window.location.reload();
              }}
              onPosponer={() => {
                setInvitacionPendiente(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. Si no tiene hogar, le mostramos el setup y forzamos recarga de perfil al completarlo
  // Pero si ya esta en /vaquitas, mostramos la gestion de vaquitas aunque no tenga bolsillo
  if (!hogarId && location.pathname !== "/vaquitas") {
    return (
      <SetupHogar
        userId={sesion.user.id}
        onHogarSet={async () => {
          await refrescarPerfil();
        }}
      />
    );
  }

  return (
    <>
      <ThemeToggle />
      <div className="flex w-full overflow-x-hidden">
        <main className="flex-1 w-full min-w-0 mt-12 transition-all duration-300 overflow-x-hidden">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/finanzas" element={<MisFinanzas />} />
              <Route path="/historial" element={<PaginaHistorial />} />
              <Route path="/gestion-gastos" element={<PaginaGestionGastos />} />
              <Route
                path="/transferencias"
                element={<PaginaTransferencias />}
              />
              <Route path="/profile" element={<PaginaPerfil />} />
              <Route path="/vaquitas" element={<VaquitasManager />} />{" "}
              {/* <--- 2. Agregamos la ruta acá */}
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <div className="fixed bottom-4 left-4 z-50">
            <PushManager />
          </div>
        </main>
      </div>

      <CustomToaster />
      <ReloadPrompt />
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}
