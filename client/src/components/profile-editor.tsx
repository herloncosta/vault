import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/auth-context";
import { Save } from "lucide-react";

interface ProfileForm {
  name: string;
  email: string;
  password: string;
  currentPassword: string;
}

export default function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm<ProfileForm>({
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", password: "", currentPassword: "" },
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const password = watch("password");

  async function onSubmit(data: ProfileForm) {
    setMessage("");
    setError("");

    if (data.password) {
      if (data.password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
      if (!data.currentPassword) { setError("Informe sua senha atual para alterar a senha."); return; }
    }

    try {
      const payload: { name?: string; email?: string; currentPassword?: string; password?: string } = {};
      if (data.name !== (user?.name ?? "")) payload.name = data.name || undefined;
      if (data.email !== user?.email) payload.email = data.email;
      if (data.password) {
        payload.currentPassword = data.currentPassword;
        payload.password = data.password;
      }

      if (Object.keys(payload).length === 0) {
        setMessage("Nenhuma alteração para salvar.");
        return;
      }

      await updateProfile(payload);
      setMessage("Perfil atualizado com sucesso.");
      reset({ ...data, password: "", currentPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-6 text-sm font-semibold text-slate-900 dark:text-gray-100">Editar perfil</h2>

      {message && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          {message}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="prof-name" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
            Nome
          </label>
          <input
            id="prof-name"
            type="text"
            {...register("name")}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
          />
        </div>

        <div>
          <label htmlFor="prof-email" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
            Email
          </label>
          <input
            id="prof-email"
            type="email"
            {...register("email")}
            placeholder="seu@email.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
          />
        </div>

        <div>
          <label htmlFor="prof-password" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
            Nova senha <span className="text-slate-400 dark:text-gray-500">(deixe em branco para manter)</span>
          </label>
          <input
            id="prof-password"
            type="password"
            {...register("password")}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
          />
        </div>

        {password && (
          <div>
            <label htmlFor="prof-currentPassword" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Senha atual <span className="text-red-400">(obrigatório para alterar a senha)</span>
            </label>
            <input
              id="prof-currentPassword"
              type="password"
              {...register("currentPassword", { required: true })}
              autoComplete="current-password"
              placeholder="Sua senha atual"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
        >
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
          <Save size={16} />
        </button>
      </form>
    </div>
  );
}
