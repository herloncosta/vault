import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RotateCcw,
  CalendarDays,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import * as api from "../lib/api";
import TransactionForm from "../components/transaction-form";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

export default function RecurringExpensesPage() {
  const [expenses, setExpenses] = useState<api.RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<api.RecurringExpense | null>(null);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeFilter !== "all") params.active = activeFilter;
      if (typeFilter) params.type = typeFilter;
      const result = await api.listRecurringExpenses(params);
      setExpenses(result.data);
    } catch {
      setError("Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, typeFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function openEdit(expense: api.RecurringExpense) {
    setEditingRecurring(expense);
    setModalOpen(true);
  }

  function handleModalSave() {
    setEditingRecurring(null);
    setModalOpen(false);
    fetchExpenses();
  }

  function handleModalClose() {
    setEditingRecurring(null);
    setModalOpen(false);
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
            Receitas e Despesas Fixas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Valores recorrentes mensais
          </p>
        </div>
        <button
          onClick={() => { setEditingRecurring(null); setModalOpen(true); }}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-800 disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <TransactionForm
        isOpen={modalOpen}
        initialType={editingRecurring?.type ?? "EXPENSE"}
        editingRecurring={editingRecurring}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 dark:text-gray-500">Tipo:</span>
        {["", "INCOME", "EXPENSE"].map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
              typeFilter === f
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {f === "" ? "Todos" : f === "INCOME" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
        {filterButtons.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <div key={i} className="h-20 animate-pulse rounded-md bg-slate-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <RotateCcw size={48} className="mx-auto mb-3 text-slate-300 dark:text-gray-600" />
          <p className="text-slate-500 dark:text-gray-400">
            Nenhum registro encontrado
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
                className={`rounded-md border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-gray-900 ${
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
                      {expense.type === "INCOME" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                          <TrendingUp size={10} />
                          Receita
                        </span>
                      )}
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
                    <span className={`text-lg font-bold ${isActive ? (expense.type === "INCOME" ? "text-emerald-500 dark:text-emerald-400" : "text-red-400") : "text-slate-400 dark:text-gray-500"}`}>
                      {expense.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(expense.amount))}
                    </span>
                    <button
                      onClick={() => toggleActive(expense)}
                      className={`cursor-pointer rounded-md p-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(expense.id)}
                      className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-all duration-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
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
            className="w-full max-w-sm rounded-md bg-white p-6 shadow-xl dark:bg-gray-900"
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
                className="flex-1 cursor-pointer rounded-md bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 active:bg-red-700"
              >
                Excluir
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
