import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "../contexts/theme-context";
import { MoonStar, Sun, Plus, Pencil, Trash2, X, Check, Tags } from "lucide-react";
import * as api from "../lib/api";

function CategorySection({ type, label, color }: { type: "INCOME" | "EXPENSE"; label: string; color: string }) {
  const [categories, setCategories] = useState<api.Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string }>();

  const fetchCategories = useCallback(async () => {
    try {
      setError("");
      const data = await api.listCategories(type);
      setCategories(data);
    } catch {
      setError("Erro ao carregar categorias");
    }
  }, [type]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function onAdd(data: { name: string }) {
    setError("");
    try {
      await api.createCategory({ name: data.name.trim(), type });
      reset({ name: "" });
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  }

  async function onEdit(id: string, currentName: string) {
    setError("");
    try {
      await api.updateCategory(id, { name: currentName });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar");
    }
  }

  async function onDelete(id: string) {
    setError("");
    try {
      await api.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{label}</h2>
        <span className="text-xs text-slate-400 dark:text-gray-500">{categories.length} categorias</span>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(onAdd)} className="mb-4 flex gap-2">
        <input
          type="text"
          {...register("name", { required: true })}
          placeholder="Nova categoria"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-60 ${color}`}
        >
          <Plus size={14} />
          Adicionar
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400 dark:text-gray-500">
          Nenhuma categoria cadastrada
        </p>
      ) : (
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-md px-3 py-2 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-gray-800/60"
            >
              {editingId === cat.id ? (
                <EditInline
                  initialValue={cat.name}
                  onSave={(name) => onEdit(cat.id, name)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <span className="text-sm text-slate-700 dark:text-gray-300">{cat.name}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(cat.id)}
                      className="cursor-pointer rounded p-1 text-slate-300 transition-all duration-300 hover:bg-blue-50 hover:text-blue-500 dark:text-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      aria-label="editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat.id)}
                      className="cursor-pointer rounded p-1 text-slate-300 transition-all duration-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      aria-label="excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditInline({ initialValue, onSave, onCancel }: { initialValue: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="flex flex-1 items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="flex-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-blue-400 dark:border-blue-600 dark:bg-gray-800 dark:text-gray-100"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value);
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        type="button"
        onClick={() => onSave(value)}
        className="cursor-pointer rounded p-1 text-emerald-500 transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        aria-label="confirmar"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded p-1 text-slate-400 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-gray-700"
        aria-label="cancelar"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-gray-100">Configurações</h1>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
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

      <div className="mb-6 flex items-center gap-3">
        <Tags size={18} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Categorias</h2>
      </div>

      <div className="mb-6 flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {t === "EXPENSE" ? "Despesas" : "Receitas"}
          </button>
        ))}
      </div>

      {tab === "EXPENSE" ? (
        <div className="space-y-4">
          <CategorySection type="EXPENSE" label="Categorias de despesa" color="bg-red-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <CategorySection type="INCOME" label="Categorias de receita" color="bg-emerald-500" />
        </div>
      )}
    </main>
  );
}
