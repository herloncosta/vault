import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Shield,
  ShieldAlert,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import * as api from "../lib/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

interface UserForm {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<api.User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<UserForm>({
    defaultValues: { email: "", password: "", name: "", role: "OPERATOR" },
  });

  const role = watch("role");

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openCreate() {
    reset({ email: "", password: "", name: "", role: "OPERATOR" });
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(user: api.User) {
    reset({ email: user.email, password: "", name: user.name ?? "", role: user.role as "ADMIN" | "OPERATOR" });
    setEditingId(user.id);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  async function onSubmit(data: UserForm) {
    setError("");

    if (data.password && data.password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    try {
      if (editingId) {
        const payload: api.UpdateUserPayload = {
          name: data.name || undefined,
          email: data.email || undefined,
          role: data.role,
        };
        if (data.password) payload.password = data.password;
        await api.updateUser(editingId, payload);
      } else {
        await api.createUser({
          email: data.email,
          password: data.password,
          name: data.name || undefined,
          role: data.role,
        });
      }
      closeForm();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuário");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteUser(id);
      setDeleteConfirm(null);
      fetchUsers();
    } catch {
      // silently fail
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Usuários</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Gerencie os usuários cadastrados na plataforma
            </p>
          </div>
        </div>
        <button
          onClick={() => showForm ? closeForm() : openCreate()}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] md:px-4"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span className="hidden md:inline">{showForm ? "Cancelar" : "Novo usuário"}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
              {editingId ? "Editar usuário" : "Novo usuário"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={closeForm}
                className="cursor-pointer text-xs text-slate-400 transition-all duration-300 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                Cancelar edição
              </button>
            )}
          </div>

          {error && (
            <p className="mb-6 rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              autoComplete="off"
              {...register("email", { required: true })}
              placeholder="email@exemplo.com"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Nome
            </label>
            <input
              type="text"
              autoComplete="off"
              {...register("name")}
              placeholder="Nome do usuário"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              {editingId ? "Nova senha (deixe em branco para manter)" : "Senha"}
            </label>
            <input
              type="password"
              required={!editingId}
              autoComplete="new-password"
              {...register("password", { required: !editingId })}
              placeholder="••••••••"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Permissão
            </label>
            <div className="flex gap-2">
              {(["OPERATOR", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue("role", r)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    role === r
                      ? r === "ADMIN"
                        ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-900/20 dark:text-violet-400"
                        : "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  {r === "ADMIN" ? <ShieldAlert size={16} /> : <Shield size={16} />}
                  {r === "ADMIN" ? "Admin" : "Operador"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
          >
            {isSubmitting ? "Salvando…" : editingId ? "Atualizar usuário" : "Criar usuário"}
          </button>
        </form>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-slate-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users size={40} className="text-slate-300 dark:text-gray-600" />
            <p className="text-sm text-slate-400 dark:text-gray-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-4 px-4 py-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-gray-800/60"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                  u.role === "ADMIN"
                    ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  {u.role === "ADMIN" ? <ShieldAlert size={18} /> : <User size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-gray-100">
                      {u.name || "Sem nome"}
                    </p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      u.role === "ADMIN"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {u.role === "ADMIN" ? "Admin" : "Operador"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail size={11} />
                      {u.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(u)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition-all duration-300 hover:bg-blue-50 hover:text-blue-500 dark:text-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                    aria-label="editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(u.id)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition-all duration-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    aria-label="excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-gray-100">Excluir usuário</h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-gray-400">
              Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all duration-300 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-700 active:scale-[0.97]"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
