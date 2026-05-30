import { useTheme } from "../contexts/theme-context";
import { MoonStar, Sun } from "lucide-react";

export default function SettingsPage() {
  const { dark, toggle } = useTheme();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-gray-100">Configurações</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              {dark ? <MoonStar size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-gray-100">Aparência</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Modo {dark ? "escuro" : "claro"}
              </p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition-all duration-300 ${
              dark ? "bg-blue-600" : "bg-slate-200"
            }`}
            aria-label="toggle theme"
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                dark ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </main>
  );
}
