import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import {
  Shield, Mail, Calendar, Pencil, Trash2,
} from "lucide-react";
import ProfileEditor from "../components/profile-editor";
import Modal from "../components/modal";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function ProfilePage() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (!user) return null;

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount();
      navigate("/login");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Erro ao excluir conta",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">
            {user.name || "Sem nome"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97]"
          >
            <Pencil size={14} />
            Editar
          </button>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <dl className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400">
              <Mail size={16} />
            </div>
            <div>
              <dt className="text-xs text-slate-400 dark:text-gray-500">
                Email
              </dt>
              <dd className="text-slate-900 dark:text-gray-100">
                {user.email}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-violet-500 dark:bg-violet-900/20 dark:text-violet-400">
              <Shield size={16} />
            </div>
            <div>
              <dt className="text-xs text-slate-400 dark:text-gray-500">
                Permissão
              </dt>
              <dd className="text-slate-900 dark:text-gray-100">
                {user.role === "ADMIN" ? "Administrador" : "Operador"}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400">
              <Calendar size={16} />
            </div>
            <div>
              <dt className="text-xs text-slate-400 dark:text-gray-500">
                Membro desde
              </dt>
              <dd className="text-slate-900 dark:text-gray-100">
                {formatDate(user.createdAt)}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {editing && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 text-sm font-semibold text-slate-900 dark:text-gray-100">
            Editar perfil
          </h2>
          <ProfileEditor onCancel={() => setEditing(false)} />
        </div>
      )}

      <div className="rounded-lg border border-red-200 bg-white p-6 shadow-lg dark:border-red-900/30 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Excluir conta
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Todos os seus dados serão removidos permanentemente
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirm(true);
              setDeleteError("");
            }}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-all duration-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/40 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      </div>

      <Modal
        isOpen={deleteConfirm}
        onClose={() => !deleting && setDeleteConfirm(false)}
        maxWidth="max-w-sm"
        hideClose
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
          Excluir conta
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
          Tem certeza? Todos os seus dados (transações, despesas fixas,
          parceladas, categorias) serão removidos permanentemente. Esta ação
          não pode ser desfeita.
        </p>

        {deleteError && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {deleteError}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 cursor-pointer rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {deleting ? "Excluindo…" : "Sim, excluir minha conta"}
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(false)}
            disabled={deleting}
            className="flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </main>
  );
}
