import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRight, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "../contexts/auth-context";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();
  const [error, setError] = useState("");

  async function onSubmit(data: LoginForm) {
    setError("");
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch {
      setError("Email ou senha incorretos");
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-8 md:flex md:p-12 lg:p-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-white/[0.03]" />

        <div className="relative">
          <img src="/vault-logo.png" alt="Vault" className="h-18" />
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
              Controle suas
              <br />
              finanças com
              <br />
              <span className="text-blue-200">inteligência</span>
            </h1>
            <p className="max-w-sm text-base text-blue-100/80 md:text-lg">
              Acompanhe receitas, despesas e investimentos em um só lugar. Tenha uma visão clara do seu dinheiro.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {[
              { icon: TrendingUp, label: "Receitas", color: "text-emerald-300" },
              { icon: TrendingUp, label: "Despesas", color: "text-red-300", className: "rotate-180" },
              { icon: Shield, label: "Segurança", color: "text-blue-200" },
            ].map(({ icon: Icon, label, color, className }) => (
              <div key={label} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <Icon size={18} className={`${color} ${className ?? ""}`} />
                <span className="text-sm text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-blue-200/50">
          &copy; {new Date().getFullYear()} Vault. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 dark:bg-gray-950 md:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center md:items-start">
            <img src="/vault-logo.png" alt="Vault" className="mb-6 h-18 md:hidden" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Acesse sua conta para continuar
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register("email", { required: true })}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register("password", { required: true })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
            >
              {isSubmitting ? "Entrando…" : "Entrar"}
              {isSubmitting ? null : <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
