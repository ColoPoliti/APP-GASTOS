import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { navLinks } from "../config/navLinks";
import { FaPiggyBank } from "react-icons/fa";

export default function MobileBottomNav({ isModalOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Si hay un modal abierto, el menú desaparece al instante
  if (isModalOpen) return null;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 w-full h-16 flex justify-around items-center border-t transition-colors duration-500 z-40
      ${theme === "dark" ? "bg-[#060a17] border-gray-800" : "bg-white border-gray-200"}`}
    >
      {navLinks.map((link) => {
        const rutaActiva =
          location.pathname === "/" + link.id ||
          (link.id === "dashboard" && location.pathname === "/dashboard");

        return (
          <button
            key={link.id}
            onClick={() => navigate("/" + link.id)}
            className={`flex flex-col items-center justify-center w-full h-full text-xs transition-colors cursor-pointer
            ${
              rutaActiva
                ? "text-cyan-400 font-bold"
                : theme === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-black"
            }`}
          >
            {link.id === "vaquitas" ? (
              <FaPiggyBank
                className={`mb-1 transition-transform ${rutaActiva ? "scale-110" : ""}`}
                style={{ fontSize: "24px" }}
              />
            ) : (
              <i
                className={`fa ${link.icon} mb-1 ${rutaActiva ? "scale-110" : ""} transition-transform`}
                style={{ fontSize: "26px" }}
              />
            )}
            <span className="hidden">{link.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
