import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-blue-950/30">
      <div className="pointer-events-none absolute -inset-40 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.06),transparent_60%)]" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-3xl border border-slate-200/60 bg-white/70 p-8 shadow-xl backdrop-blur-2xl dark:border-gray-800/60 dark:bg-gray-950/70"
      >
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-gray-100">
          vault
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-gray-400">
          Acesse sua conta financeira
        </p>

        {error && (
          <p className="mb-6 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
          >
            {submitting ? "Entrando…" : "Entrar"}
            {submitting ? null : <ArrowRight size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
