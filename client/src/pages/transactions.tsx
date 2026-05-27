import { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Filter,
  X,
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
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as api from "../lib/api";
import { fmt, parse as parseCurrency, toInput } from "../lib/currency";

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

const categoryList = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Compras",
  "Saúde",
  "Educação",
  "Lazer",
  "Viagem",
  "Salário",
  "Freelance",
  "Outro",
];

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<string>("");

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (filterType) params.type = filterType;
      const result = await api.listTransactions(params);
      setTransactions(result.data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setType("EXPENSE");
    setAmount("");
    setDescription("");
    setCategory("");
    setPaymentMethod("");
    setDate(new Date().toISOString().slice(0, 10));
    setError("");
  }

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const parsedAmount = parseCurrency(amount);
      if (parsedAmount <= 0) throw new Error("Valor inválido");

      if (editingId) {
        await api.updateTransaction(editingId, {
          type,
          amount: parsedAmount,
          description,
          category: category || undefined,
          date: new Date(date).toISOString(),
          paymentMethod: paymentMethod || undefined,
        });
      } else {
        await api.createTransaction({
          type,
          amount: parsedAmount,
          description,
          category: category || undefined,
          date: new Date(date).toISOString(),
          paymentMethod: paymentMethod || undefined,
        });
      }

      resetForm();
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar transação");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(t: api.Transaction) {
    if (t.source !== "transaction") return;
    setEditingId(t.id);
    setType(t.type);
    setAmount(toInput(t.amount));
    setDescription(t.description);
    setCategory(t.category ?? "");
    setDate(new Date(t.date).toISOString().slice(0, 10));
    setPaymentMethod(t.paymentMethod ?? "");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Transações</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Todas as suas movimentações em um só lugar
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] md:px-4"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span className="hidden md:inline">{showForm ? "Cancelar" : "Nova transação"}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
              {editingId ? "Editar transação" : "Nova transação"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="cursor-pointer text-xs text-slate-400 transition-all duration-300 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                Cancelar edição
              </button>
            )}
          </div>

          {error && (
            <p className="mb-6 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                type === "EXPENSE"
                  ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-400"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <TrendingDown size={16} />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                type === "INCOME"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <TrendingUp size={16} />
              Receita
            </button>
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Valor
            </label>
            <input
              type="text"
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(fmt(e.target.value))}
              placeholder="0,00"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Descrição
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário mensal"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
              >
                <option value="">Sem categoria</option>
                {categoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
              Forma de pagamento
            </label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Ex: Cartão de crédito, Pix, Boleto"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
          >
            {submitting ? "Salvando…" : editingId ? "Atualizar transação" : "Salvar transação"}
          </button>
        </form>
      )}

      <div className="mb-4 flex items-center gap-3">
        <Filter size={16} className="text-slate-400" />
        {["", "INCOME", "EXPENSE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
              filterType === f
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {f === "" ? "Todas" : f === "INCOME" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-gray-800"
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
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
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
                          onClick={() => handleEdit(t)}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition-all duration-300 hover:bg-blue-50 hover:text-blue-500 dark:text-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          aria-label="editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.source)}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition-all duration-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label="excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={t.source === "installment" ? "/despesas-parceladas" : "/despesas-fixas"}
                        className="rounded-lg p-1.5 text-slate-300 transition-all duration-300 hover:bg-slate-100 hover:text-blue-500 dark:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
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
    </main>
  );
}
