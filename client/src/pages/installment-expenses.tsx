import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  CreditCard,
  Receipt,
  Pencil,
  Trash2,
  X,
  Tag,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as api from "../lib/api";

const CATEGORY_OPTIONS = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Eletrônicos",
  "Vestuário",
  "Viagem",
  "Outros",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

const initialForm = {
  description: "",
  totalAmount: "",
  installmentCount: "2",
  type: "CREDIT_CARD" as "CREDIT_CARD" | "CARNE",
  category: "",
  firstDueDate: "",
};

export default function InstallmentExpensesPage() {
  const [expenses, setExpenses] = useState<api.InstallmentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter !== "all") params.type = typeFilter;
      const result = await api.listInstallmentExpenses(params);
      setExpenses(result.data);
    } catch {
      setError("Erro ao carregar despesas parceladas");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  }

  function openEdit(expense: api.InstallmentExpense) {
    setForm({
      description: expense.description,
      totalAmount: String(expense.totalAmount),
      installmentCount: String(expense.installmentCount),
      type: expense.type,
      category: expense.category ?? "",
      firstDueDate: expense.firstDueDate.slice(0, 10),
    });
    setEditingId(expense.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const totalAmount = Number.parseFloat(form.totalAmount);
    if (!totalAmount || totalAmount <= 0) { setError("Valor total deve ser positivo"); return; }
    if (!form.description.trim()) { setError("Descrição é obrigatória"); return; }
    if (!form.firstDueDate) { setError("Primeiro vencimento é obrigatório"); return; }

    try {
      const payload: api.CreateInstallmentExpensePayload = {
        description: form.description.trim(),
        totalAmount,
        installmentCount: Number.parseInt(form.installmentCount, 10),
        type: form.type,
        category: form.category || undefined,
        firstDueDate: new Date(form.firstDueDate).toISOString(),
      };

      if (editingId) {
        await api.updateInstallmentExpense(editingId, payload);
      } else {
        await api.createInstallmentExpense(payload);
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
      await api.deleteInstallmentExpense(id);
      setDeleteId(null);
      if (expandedId === id) setExpandedId(null);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir");
    }
  }

  async function togglePaid(installment: api.Installment) {
    try {
      await api.updateInstallmentPaid(installment.id, !installment.paid);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Erro ao alterar status");
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  const paidCount = (installments: api.Installment[]) =>
    installments.filter((i) => i.paid).length;

  const filterButtons = [
    { value: "all", label: "Todas" },
    { value: "CREDIT_CARD", label: "Cartão" },
    { value: "CARNE", label: "Carnê" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-gray-100">
            Despesas Parceladas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Compras parceladas no cartão de crédito ou carnê
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-violet-700 disabled:opacity-50"
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
            {editingId ? "Editar compra parcelada" : "Nova compra parcelada"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Descrição *
              </label>
              <input
                type="text"
                placeholder="Ex: Notebook Dell"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-violet-500 dark:focus:ring-violet-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Valor total *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-violet-500 dark:focus:ring-violet-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Quantidade de parcelas *
              </label>
              <input
                type="number"
                min="2"
                max="120"
                value={form.installmentCount}
                onChange={(e) => setForm({ ...form, installmentCount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-violet-500 dark:focus:ring-violet-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Tipo *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "CREDIT_CARD" })}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    form.type === "CREDIT_CARD"
                      ? "bg-violet-500 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <CreditCard size={16} />
                  Cartão
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "CARNE" })}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    form.type === "CARNE"
                      ? "bg-violet-500 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <Receipt size={16} />
                  Carnê
                </button>
              </div>
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
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900"
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
                Primeiro vencimento *
              </label>
              <input
                type="date"
                value={form.firstDueDate}
                onChange={(e) => setForm({ ...form, firstDueDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all duration-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-violet-500 px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-violet-700 disabled:opacity-50"
            >
              {editingId ? "Atualizar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
            onClick={() => setTypeFilter(value)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              typeFilter === value
                ? "bg-violet-500 text-white"
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
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <CreditCard size={48} className="mx-auto mb-3 text-slate-300 dark:text-gray-600" />
          <p className="text-slate-500 dark:text-gray-400">
            Nenhuma despesa parcelada encontrada
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const isExpanded = expandedId === expense.id;
            const totalPaid = paidCount(expense.installments);
            const isFullyPaid = totalPaid === expense.installmentCount;
            const isCard = expense.type === "CREDIT_CARD";

            return (
              <div
                key={expense.id}
                className={`rounded-2xl border bg-white shadow-sm transition-all duration-300 dark:bg-gray-900 ${
                  isFullyPaid
                    ? "border-emerald-200 opacity-70 dark:border-emerald-900"
                    : "border-slate-200 dark:border-gray-800"
                }`}
              >
                <button
                  onClick={() => toggleExpand(expense.id)}
                  className="flex w-full cursor-pointer items-center justify-between p-5 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${isCard ? "bg-violet-100 dark:bg-violet-950" : "bg-amber-100 dark:bg-amber-950"}`}>
                      {isCard
                        ? <CreditCard size={20} className="text-violet-500 dark:text-violet-400" />
                        : <Receipt size={20} className="text-amber-500 dark:text-amber-400" />
                      }
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isFullyPaid ? "text-slate-500 dark:text-gray-400" : "text-slate-900 dark:text-gray-100"}`}>
                        {expense.description}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-gray-500">
                        {expense.installmentCount}x {formatCurrency(Number(expense.totalAmount) / expense.installmentCount)} • {isCard ? "Cartão" : "Carnê"}
                        {expense.category && ` • ${expense.category}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isFullyPaid ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-gray-100"}`}>
                        {formatCurrency(Number(expense.totalAmount))}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">
                        {totalPaid}/{expense.installmentCount} pagas
                      </p>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-3 dark:border-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-violet-500 transition-all duration-300"
                            style={{ width: `${(totalPaid / expense.installmentCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 dark:text-gray-500">
                          {Math.round((totalPaid / expense.installmentCount) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(expense)}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:hover:bg-gray-800 dark:hover:text-violet-400"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(expense.id)}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all duration-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {expense.installments.map((inst) => {
                        const overdue = !inst.paid && new Date(inst.dueDate) < new Date();
                        return (
                          <div
                            key={inst.id}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all duration-300 ${
                              inst.paid
                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                : overdue
                                  ? "bg-red-50 dark:bg-red-950/30"
                                  : "bg-slate-50 dark:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePaid(inst)}
                                className={`cursor-pointer transition-all duration-300 focus:outline-none ${
                                  inst.paid
                                    ? "text-emerald-500 hover:text-emerald-600"
                                    : "text-slate-300 hover:text-emerald-500 dark:text-gray-600 dark:hover:text-emerald-400"
                                }`}
                                title={inst.paid ? "Marcar como não paga" : "Marcar como paga"}
                              >
                                {inst.paid ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>
                              <span className={`font-medium ${inst.paid ? "text-emerald-700 dark:text-emerald-400" : overdue ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-gray-300"}`}>
                                {inst.installmentNumber}ª parcela
                              </span>
                              <span className="text-slate-400 dark:text-gray-500">
                                {formatDate(inst.dueDate)}
                              </span>
                            </div>
                            <span className={`font-semibold ${inst.paid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-gray-100"}`}>
                              {formatCurrency(Number(inst.amount))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
              Excluir despesa parcelada?
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
              Todas as parcelas serão excluídas. Esta ação não pode ser desfeita.
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
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
