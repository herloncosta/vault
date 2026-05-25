import { useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { Save, Edit2 } from "lucide-react";

export default function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!editing) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Nome</h2>
          <button
            onClick={() => {
              setName(user?.name ?? "");
              setEditing(true);
            }}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 transition-all duration-300 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
          >
            <Edit2 size={14} />
            Editar
          </button>
        </div>
        <p className="text-sm text-slate-900 dark:text-gray-100">
          {user?.name || <span className="text-slate-400 dark:text-gray-500">Não informado</span>}
        </p>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      await updateProfile({ name: name || undefined });
      setMessage("Nome atualizado.");
      setEditing(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">Editar nome</h2>

      {message && (
        <p
          className={`mb-4 rounded-xl px-3 py-2 text-sm ${
            message === "Nome atualizado."
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-700 active:scale-[0.97] disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
            <Save size={16} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="cursor-pointer rounded-xl px-4 py-2 text-sm text-slate-500 transition-all duration-300 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
