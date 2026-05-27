import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, User, Settings, LogOut, ArrowLeftRight, Users, RotateCcw } from "lucide-react";
import { useAuth } from "../contexts/auth-context";

function useLinks() {
  const { user } = useAuth();
  const base = [
    { to: "/", label: "Início", icon: Home },
    { to: "/transacoes", label: "Transações", icon: ArrowLeftRight },
    { to: "/despesas-fixas", label: "Despesas Fixas", icon: RotateCcw },
    { to: "/perfil", label: "Perfil", icon: User },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ];
  if (user?.role === "ADMIN") {
    base.push({ to: "/admin/usuarios", label: "Usuários", icon: Users });
  }
  return base;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const links = useLinks();

  function close() {
    setOpen(false);
  }

  return (
    <>
      <nav className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="transition-all duration-300 hover:opacity-80">
            <img src="/vault-logo.png" alt="Vault" className="h-16" />
          </Link>

          <button
            className="block cursor-pointer text-slate-400 transition-all duration-300 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="menu"
          >
            <Menu size={24} />
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 text-sm transition-all duration-300 ${
                  pathname === to
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <span className="text-xs text-slate-400 dark:text-gray-500">
              {user?.name ?? user?.email}
            </span>
            <button
              onClick={logout}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-400 transition-all duration-300 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-64 flex-col gap-2 border-l border-slate-200 bg-white p-6 shadow-xl transition-transform duration-300 dark:border-gray-800 dark:bg-gray-950 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 dark:text-gray-100">Menu</span>
          <button
            onClick={close}
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
              onClick={close}
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
            onClick={() => {
              close();
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
