import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/auth-context";
import { Save, X } from "lucide-react";

interface ProfileForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  currentPassword: string;
}

export default function ProfileEditor({ onCancel }: { onCancel: () => void }) {
  const { user, updateProfile } = useAuth();
  const {
    register, handleSubmit, watch, reset,
    formState: { isSubmitting, errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      confirmPassword: "",
      currentPassword: "",
    },
  });
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const password = watch("password");

  async function onSubmit(data: ProfileForm) {
    setServerError("");
    setSuccess("");

    const payload: {
      name?: string; email?: string;
      currentPassword?: string; password?: string;
    } = {};

    if (data.name !== (user?.name ?? "")) {
      payload.name = data.name.trim() || undefined;
    }
    if (data.email !== user?.email) {
      if (!data.email.trim()) {
        setServerError("O email não pode ficar vazio.");
        return;
      }
      payload.email = data.email.trim();
    }

    if (data.password) {
      if (!data.currentPassword) {
        setServerError("Informe sua senha atual para alterar a senha.");
        return;
      }
      payload.currentPassword = data.currentPassword;
      payload.password = data.password;
    }

    if (Object.keys(payload).length === 0) {
      setSuccess("Nenhuma alteração para salvar.");
      return;
    }

    try {
      const updated = await updateProfile(payload);
      reset({
        name: updated.name ?? "",
        email: updated.email,
        password: "",
        confirmPassword: "",
        currentPassword: "",
      });
      setSuccess("Perfil atualizado com sucesso!");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {success && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          {success}
        </p>
      )}

      {serverError && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {serverError}
        </p>
      )}

      <div>
        <label
          htmlFor="edit-name"
          className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400"
        >
          Nome
        </label>
        <input
          id="edit-name"
          type="text"
          {...register("name")}
          placeholder="Seu nome"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
        />
      </div>

      <div>
        <label
          htmlFor="edit-email"
          className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400"
        >
          Email
        </label>
        <input
          id="edit-email"
          type="email"
          {...register("email", {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Informe um email válido",
            },
          })}
          placeholder="seu@email.com"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <hr className="border-slate-100 dark:border-gray-800" />

      <div>
        <label
          htmlFor="edit-password"
          className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400"
        >
          Nova senha
        </label>
        <input
          id="edit-password"
          type="password"
          {...register("password", {
            minLength: {
              value: 8,
              message: "A senha deve ter no mínimo 8 caracteres",
            },
          })}
          autoComplete="new-password"
          placeholder="Deixe em branco para manter"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {password && (
        <>
          <div>
            <label
              htmlFor="edit-confirmPassword"
              className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400"
            >
              Confirmar nova senha
            </label>
            <input
              id="edit-confirmPassword"
              type="password"
              {...register("confirmPassword", {
                validate: (v) =>
                  v === password || "As senhas não conferem",
              })}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-currentPassword"
              className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400"
            >
              Senha atual <span className="text-red-400">(obrigatório)</span>
            </label>
            <input
              id="edit-currentPassword"
              type="password"
              {...register("currentPassword", {
                required: {
                  value: true,
                  message: "Senha atual é obrigatória para alterar a senha",
                },
              })}
              autoComplete="current-password"
              placeholder="Sua senha atual"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
        >
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
          <Save size={16} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.97] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <X size={16} />
          Cancelar
        </button>
      </div>
    </form>
  );
}
