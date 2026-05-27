import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react";
import * as api from "../lib/api";
import { fmt, parse as parseCurrency } from "../lib/currency";

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

interface TransactionFormProps {
  initialType: "INCOME" | "EXPENSE";
  onSave: () => void;
  onClose: () => void;
}

export default function TransactionForm({ initialType, onSave, onClose }: TransactionFormProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const parsedAmount = parseCurrency(amount);
      if (parsedAmount <= 0) throw new Error("Valor inválido");

      await api.createTransaction({
        type,
        amount: parsedAmount,
        description,
        category: category || undefined,
        date: new Date(date).toISOString(),
        paymentMethod: paymentMethod || undefined,
      });

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar transação");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
          Nova transação
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-all duration-300 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X size={14} />
          Cancelar
        </button>
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
        {submitting ? "Salvando…" : "Salvar transação"}
      </button>
    </form>
  );
}
