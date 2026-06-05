import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  User,
  Settings,
  LogOut,
  ArrowLeftRight,
  Users,
  RotateCcw,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";

function useLinks() {
  const { user } = useAuth();
  const base = [
    { to: "/", label: "Início", icon: Home },
    { to: "/transacoes", label: "Transações", icon: ArrowLeftRight },
    { to: "/despesas-fixas", label: "Despesas Fixas", icon: RotateCcw },
    { to: "/despesas-parceladas", label: "Parceladas", icon: CreditCard },
    { to: "/perfil", label: "Perfil", icon: User },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ];
  if (user?.role === "ADMIN") {
    base.push({ to: "/admin/usuarios", label: "Usuários", icon: Users });
  }
  return base;
}

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const links = useLinks();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950 md:flex ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-3 dark:border-gray-800">
          <Link
            to="/"
            className={`flex items-center transition-all duration-300 ${sidebarOpen ? "gap-2" : "justify-center"}`}
          >
            <img
              src="/vault-logo.png"
              alt="Vault"
              className={`transition-all duration-300 ${sidebarOpen ? "h-10" : "h-8"}`}
            />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`group flex items-center rounded-xl text-sm transition-all duration-300 ${
                  sidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-3"
                } ${
                  pathname === to
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                }`}
                title={sidebarOpen ? undefined : label}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-2 py-3 dark:border-gray-800">
          <div className={`flex flex-col gap-1 ${sidebarOpen ? "" : "items-center"}`}>
            <div
              className={`truncate text-xs text-slate-400 dark:text-gray-500 ${sidebarOpen ? "px-3 pb-1" : "hidden"}`}
            >
              {user?.name ?? user?.email}
            </div>
            <button
              type="button"
              onClick={logout}
              className={`group flex items-center rounded-xl text-sm text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400 cursor-pointer ${
                sidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-3"
              }`}
              title={sidebarOpen ? undefined : "Sair"}
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="font-medium">Sair</span>}
            </button>
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`group flex items-center rounded-xl text-sm text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400 cursor-pointer ${
                sidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-3"
              }`}
              title={sidebarOpen ? "Recolher" : "Expandir"}
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
              {sidebarOpen && <span className="font-medium">Recolher</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80 md:hidden">
        <Link to="/">
          <img src="/vault-logo.png" alt="Vault" className="h-10" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer text-slate-400 transition-all duration-300 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onKeyUp={closeMobile}
          onClick={closeMobile}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-64 flex-col gap-2 border-l border-slate-200 bg-white p-6 shadow-xl transition-transform duration-300 dark:border-gray-800 dark:bg-gray-950 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 dark:text-gray-100">Menu</span>
          <button
            type="button"
            onClick={closeMobile}
            className="cursor-pointer rounded p-1 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-slate-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ${
                pathname === to
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-gray-800">
          <p className="mb-3 truncate text-xs text-slate-400 dark:text-gray-500">
            {user?.name ?? user?.email}
          </p>
          <button
            type="button"
            onClick={() => {
              closeMobile();
              logout();
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
