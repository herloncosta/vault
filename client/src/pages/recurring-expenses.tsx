import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RotateCcw,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  CreditCard,
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import * as api from "../lib/api";

const CATEGORY_OPTIONS = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Seguros",
  "Utilidades",
  "Outros",
];

const PAYMENT_OPTIONS = [
  "Crédito",
  "Débito",
  "Boleto",
  "PIX",
  "Dinheiro",
  "Automático",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

const initialForm = {
  amount: "",
  description: "",
  category: "",
  paymentMethod: "",
  dayOfMonth: 1,
  startDate: "",
  endDate: "",
};

export default function RecurringExpensesPage() {
  const [expenses, setExpenses] = useState<api.RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeFilter !== "all") params.active = activeFilter;
      const result = await api.listRecurringExpenses(params);
      setExpenses(result.data);
    } catch {
      setError("Erro ao carregar despesas fixas");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  }

  function openEdit(expense: api.RecurringExpense) {
    setForm({
      amount: String(expense.amount),
      description: expense.description,
      category: expense.category ?? "",
      paymentMethod: expense.paymentMethod ?? "",
      dayOfMonth: expense.dayOfMonth,
      startDate: expense.startDate.slice(0, 10),
      endDate: expense.endDate ? expense.endDate.slice(0, 10) : "",
    });
    setEditingId(expense.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amount = Number.parseFloat(form.amount);
    if (!amount || amount <= 0) { setError("Valor deve ser positivo"); return; }
    if (!form.description.trim()) { setError("Descrição é obrigatória"); return; }
    if (!form.startDate) { setError("Data de início é obrigatória"); return; }

    try {
      const payload: api.CreateRecurringExpensePayload = {
        amount,
        description: form.description.trim(),
        category: form.category || undefined,
        paymentMethod: form.paymentMethod || undefined,
        dayOfMonth: form.dayOfMonth,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      if (editingId) {
        await api.updateRecurringExpense(editingId, payload);
      } else {
        await api.createRecurringExpense(payload);
      }

      resetForm();
      setShowForm(false);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteRecurringExpense(id);
      setDeleteId(null);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir");
    }
  }

  async function toggleActive(expense: api.RecurringExpense) {
    try {
      await api.updateRecurringExpense(expense.id, { active: !expense.active });
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Erro ao alterar status");
    }
  }

  const filterButtons = [
    { value: "true", label: "Ativas" },
    { value: "false", label: "Inativas" },
    { value: "all", label: "Todas" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-gray-100">
            Despesas Fixas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Despesas recorrentes mensais com valor fixo
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-800 disabled:opacity-50"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-gray-100">
            {editingId ? "Editar despesa fixa" : "Nova despesa fixa"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Descrição *
              </label>
              <input
                type="text"
                placeholder="Ex: Aluguel"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Categoria
              </label>
              <div className="relative">
                <Tag size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                >
                  <option value="">Selecione</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Forma de pagamento
              </label>
              <div className="relative">
                <CreditCard size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                >
                  <option value="">Selecione</option>
                  {PAYMENT_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Dia do vencimento *
              </label>
              <div className="relative">
                <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={form.dayOfMonth}
                  onChange={(e) => setForm({ ...form, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Data de início *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Data de término
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-gray-500">
                Deixe em branco se não houver previsão de término
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-800 disabled:opacity-50"
            >
              {editingId ? "Atualizar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 flex gap-2">
        {filterButtons.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeFilter === value
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <RotateCcw size={48} className="mx-auto mb-3 text-slate-300 dark:text-gray-600" />
          <p className="text-slate-500 dark:text-gray-400">
            Nenhuma despesa fixa {activeFilter === "true" ? "ativa" : activeFilter === "false" ? "inativa" : ""} encontrada
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const isActive = expense.active;
            const hasEnded = expense.endDate && new Date(expense.endDate) < new Date();
            return (
              <div
                key={expense.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-gray-900 ${
                  isActive
                    ? "border-slate-200 dark:border-gray-800"
                    : "border-slate-200 opacity-60 dark:border-gray-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-gray-100">
                        {expense.description}
                      </h3>
                      {hasEnded && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                          <XCircle size={12} />
                          Expirada
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        Dia {expense.dayOfMonth} de cada mês
                      </span>
                      <span>Início: {formatDate(expense.startDate)}</span>
                      {expense.endDate && (
                        <span>Término: {formatDate(expense.endDate)}</span>
                      )}
                      {expense.category && <span>{expense.category}</span>}
                      {expense.paymentMethod && <span>{expense.paymentMethod}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${isActive ? "text-red-400" : "text-slate-400 dark:text-gray-500"}`}>
                      {formatCurrency(Number(expense.amount))}
                    </span>
                    <button
                      onClick={() => toggleActive(expense)}
                      className={`cursor-pointer rounded-lg p-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isActive
                          ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800"
                      }`}
                      title={isActive ? "Desativar" : "Ativar"}
                    >
                      {isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </button>
                    <button
                      onClick={() => openEdit(expense)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(expense.id)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all duration-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
              Excluir despesa fixa?
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 cursor-pointer rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 active:bg-red-700"
              >
                Excluir
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
