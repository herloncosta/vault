import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  CreditCard,
  Receipt,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import * as api from "../lib/api";
import TransactionForm from "../components/transaction-form";
import Modal from "../components/modal";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

export default function InstallmentExpensesPage() {
  const [expenses, setExpenses] = useState<api.InstallmentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<api.InstallmentExpense | null>(null);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "5", page: String(page) };
      if (typeFilter !== "all") params.type = typeFilter;
      const result = await api.listInstallmentExpenses(params);
      setExpenses(result.data);
      setTotalPages(result.totalPages);
    } catch {
      setError("Erro ao carregar despesas parceladas");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page]);

  useEffect(() => { setPage(1); }, [typeFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function openEdit(expense: api.InstallmentExpense) {
    setEditingInstallment(expense);
    setModalOpen(true);
  }

  function handleModalSave() {
    setEditingInstallment(null);
    setModalOpen(false);
    fetchExpenses();
  }

  function handleModalClose() {
    setEditingInstallment(null);
    setModalOpen(false);
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
          type="button"
          onClick={() => { setEditingInstallment(null); setModalOpen(true); }}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-violet-700 disabled:opacity-50"
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
        initialType="EXPENSE"
        editingInstallment={editingInstallment}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />

      <div className="mb-6 flex gap-2">
        {filterButtons.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
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
            <div key={i} className="h-24 animate-pulse rounded-md bg-slate-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
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
                className={`rounded-md border bg-white shadow-sm transition-all duration-300 dark:bg-gray-900 ${
                  isFullyPaid
                    ? "border-emerald-200 opacity-70 dark:border-emerald-900"
                    : "border-slate-200 dark:border-gray-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(expense.id)}
                  className="flex w-full cursor-pointer items-center justify-between p-5 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2.5 ${isCard ? "bg-violet-100 dark:bg-violet-950" : "bg-amber-100 dark:bg-amber-950"}`}>
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
                          type="button"
                          onClick={() => openEdit(expense)}
                          className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:hover:bg-gray-800 dark:hover:text-violet-400"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(expense.id)}
                          className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-all duration-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
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
                            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-all duration-300 ${
                              inst.paid
                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                : overdue
                                  ? "bg-red-50 dark:bg-red-950/30"
                                  : "bg-slate-50 dark:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-all duration-300 hover:bg-slate-100 disabled:cursor-default disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                p === page
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-all duration-300 hover:bg-slate-100 disabled:cursor-default disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Próximo
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm" hideClose>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
          Excluir despesa parcelada?
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
          Todas as parcelas serão excluídas. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => handleDelete(deleteId!)}
            className="flex-1 cursor-pointer rounded-md bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 active:bg-red-700"
          >
            Excluir
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(null)}
            className="flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 active:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
