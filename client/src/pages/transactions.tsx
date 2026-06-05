import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Filter,
  ArrowDownToLine,
  Wallet,
  ShoppingCart,
  Home,
  Car,
  Receipt,
  Utensils,
  Gamepad2,
  Plane,
  HeartPulse,
  GraduationCap,
  RotateCcw,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as api from "../lib/api";
import TransactionForm from "../components/transaction-form";

const categoryIcons: Record<string, LucideIcon> = {
  Alimentação: Utensils,
  Transporte: Car,
  Moradia: Home,
  Compras: ShoppingCart,
  Saúde: HeartPulse,
  Educação: GraduationCap,
  Lazer: Gamepad2,
  Viagem: Plane,
  Salário: Wallet,
  Freelance: Receipt,
  Outro: ArrowDownToLine,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const sourceConfig = {
  transaction: { label: "", icon: null, color: "" },
  installment: { label: "Parcelada", icon: CreditCard, color: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" },
  recurring: { label: "Fixa", icon: RotateCcw, color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<api.Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editingTransaction, setEditingTransaction] = useState<api.Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "10", page: String(page) };
      if (filterType) params.type = filterType;
      const result = await api.listTransactions(params);
      setTransactions(result.data);
      setTotalPages(result.totalPages);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, page]);

  function handleEdit(t: api.Transaction) {
    if (t.source !== "transaction") return;
    setEditingTransaction(t);
    setModalInitialType(t.type);
    setModalOpen(true);
  }

  async function handleDelete(id: string, source: string) {
    if (source !== "transaction") return;
    try {
      await api.deleteTransaction(id);
      fetchTransactions();
    } catch {
      // silently fail
    }
  }

  function handleModalSave() {
    setEditingTransaction(null);
    fetchTransactions();
  }

  function handleModalClose() {
    setEditingTransaction(null);
    setModalOpen(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Transações</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Todas as suas movimentações em um só lugar
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingTransaction(null); setModalInitialType("EXPENSE"); setModalOpen(true); }}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] md:px-4"
        >
          <Plus size={16} />
          <span className="hidden md:inline">Nova transação</span>
        </button>
      </div>

      <TransactionForm
        isOpen={modalOpen}
        initialType={modalInitialType}
        editingTransaction={editingTransaction}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />

      <div className="mb-4 flex items-center gap-3">
        <Filter size={16} className="text-slate-400" />
        {["", "INCOME", "EXPENSE"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilterType(f)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
              filterType === f
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {f === "" ? "Todas" : f === "INCOME" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-slate-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-md bg-slate-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <ArrowDownToLine size={40} className="text-slate-300 dark:text-gray-600" />
            <p className="text-sm text-slate-400 dark:text-gray-500">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {transactions.map((t) => {
              const CatIcon = categoryIcons[t.category ?? ""] ?? ArrowDownToLine;
              const cfg = sourceConfig[t.source];

              return (
                <div
                  key={`${t.source}-${t.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-gray-800/60"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${
                      t.type === "INCOME"
                        ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    <CatIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-gray-100">
                        {t.description}
                      </p>
                      {t.source !== "transaction" && (
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                          {cfg.icon && <cfg.icon size={10} />}
                          {cfg.label}
                          {t.source === "installment" && t.installmentCount && (
                            <> {t.installmentNumber}/{t.installmentCount}</>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400 dark:text-gray-500">
                      {formatDate(t.date)}
                      {t.category ? ` • ${t.category}` : ""}
                      {t.paymentMethod ? ` • ${t.paymentMethod}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-semibold ${
                        t.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(Number(t.amount))}
                    </span>
                    {t.source === "transaction" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="cursor-pointer rounded-md p-1.5 text-slate-300 transition-all duration-300 hover:bg-blue-50 hover:text-blue-500 dark:text-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          aria-label="editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id, t.source)}
                          className="cursor-pointer rounded-md p-1.5 text-slate-300 transition-all duration-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label="excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={t.source === "installment" ? "/despesas-parceladas" : "/despesas-fixas"}
                        className="rounded-md p-1.5 text-slate-300 transition-all duration-300 hover:bg-slate-100 hover:text-blue-500 dark:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                        aria-label="ver detalhes"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                  ? "bg-blue-600 text-white shadow-sm"
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
    </main>
  );
}
