import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { navLinks } from "../config/navLinks";
import { FaPiggyBank, FaStar, FaMoneyBillWave } from "react-icons/fa";

export default function MobileBottomNav({ isModalOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Si hay un modal abierto, el menú desaparece al instante
  if (isModalOpen) return null;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 w-full h-16 flex justify-around items-center border-t transition-colors duration-500 z-40 shadow-xl
      ${theme === "dark" ? "bg-[#060a17] border-gray-800 text-white" : "bg-white border-gray-200 text-slate-500"}`}
    >
      {navLinks.map((link) => {
        const linkRoute = link.id === "dashboard" ? "/" : `/${link.id}`;
        const rutaActiva =
          location.pathname === linkRoute ||
          (link.id === "dashboard" && location.pathname === "/dashboard");

        const isVaquitas = link.id === "vaquitas";

        return (
          <button
            key={link.id}
            onClick={() => navigate(linkRoute)}
            className={`flex flex-col items-center justify-center w-full h-full text-xs transition-colors cursor-pointer relative select-none
            ${
              rutaActiva
                ? isVaquitas
                  ? "text-amber-500 font-bold"
                  : "dark:text-cyan-400 text-purple-800 font-bold"
                : isVaquitas
                  ? "text-amber-500/90 font-medium"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-black"
            }`}
          >
            {/* Contenedor del ícono con soporte para estilo especial de vaquitas */}
            <div
              className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                rutaActiva
                  ? isVaquitas
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md scale-110"
                    : "dark:bg-cyan-500/20 dark:text-cyan-400 bg-purple-500/20 text-purple-800 scale-110"
                  : isVaquitas
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-gray-600"
              }`}
            >
              {link.id === "finanzas" ? (
                <FaMoneyBillWave
                  className="text-xl transition-colors"
                  style={{ fontSize: "1.6em" }}
                />
              ) : isVaquitas ? (
                <FaPiggyBank
                  className="text-xl transition-colors"
                  style={{ fontSize: "1.6em" }}
                />
              ) : (
                <i
                  className={`fa fa-fw ${link.icon}`}
                  style={{ fontSize: "1.6em" }}
                />
              )}

              {/* Estrellita flotante indicator para la versión PRO en móviles */}
              {isVaquitas && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center text-[8px] w-2.5 h-2.5">
                  <FaStar size={7} />
                </span>
              )}
            </div>

            {/* Opcional: etiqueta oculta o visible si querés mostrar texto chico abajo */}
            <span className="hidden">{link.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
