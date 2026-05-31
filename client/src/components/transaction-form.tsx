import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  RotateCcw,
  Zap,
  CalendarDays,
} from "lucide-react";
import Modal from "./modal";
import * as api from "../lib/api";
import { fmt, parse as parseCurrency, toInput } from "../lib/currency";

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

const categoryOptionsRecurring = [
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

const paymentOptions = [
  "Crédito",
  "Débito",
  "Boleto",
  "PIX",
  "Dinheiro",
  "Automático",
];

type TxKind = "unique" | "fixed" | "installment";

interface TransactionFormProps {
  isOpen: boolean;
  initialType: "INCOME" | "EXPENSE";
  editingTransaction?: api.Transaction | null;
  editingRecurring?: api.RecurringExpense | null;
  editingInstallment?: api.InstallmentExpense | null;
  onSave: () => void;
  onClose: () => void;
}

export default function TransactionForm({
  isOpen,
  initialType,
  editingTransaction,
  editingRecurring,
  editingInstallment,
  onSave,
  onClose,
}: TransactionFormProps) {
  const isEditing = !!(editingTransaction || editingRecurring || editingInstallment);

  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);
  const [txKind, setTxKind] = useState<TxKind>("unique");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("");

  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("2");
  const [installmentType, setInstallmentType] = useState<"CREDIT_CARD" | "CARNE">("CREDIT_CARD");
  const [firstDueDate, setFirstDueDate] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setType(initialType);
    setError("");

    if (editingTransaction) {
      setTxKind("unique");
      setType(editingTransaction.type);
      setAmount(toInput(editingTransaction.amount));
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category ?? "");
      setDate(new Date(editingTransaction.date).toISOString().slice(0, 10));
      setPaymentMethod(editingTransaction.paymentMethod ?? "");
    } else if (editingRecurring) {
      setTxKind("fixed");
      setType("EXPENSE");
      setAmount(toInput(Number(editingRecurring.amount)));
      setDescription(editingRecurring.description);
      setCategory(editingRecurring.category ?? "");
      setPaymentMethod(editingRecurring.paymentMethod ?? "");
      setDayOfMonth(editingRecurring.dayOfMonth);
      setStartDate(editingRecurring.startDate.slice(0, 10));
      setEndDate(editingRecurring.endDate ? editingRecurring.endDate.slice(0, 10) : "");
    } else if (editingInstallment) {
      setTxKind("installment");
      setType("EXPENSE");
      setDescription(editingInstallment.description);
      setTotalAmount(toInput(Number(editingInstallment.totalAmount)));
      setInstallmentCount(String(editingInstallment.installmentCount));
      setInstallmentType(editingInstallment.type);
      setCategory(editingInstallment.category ?? "");
      setFirstDueDate(editingInstallment.firstDueDate.slice(0, 10));
    } else {
      setTxKind("unique");
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod("");
      setDayOfMonth(1);
      setStartDate("");
      setEndDate("");
      setTotalAmount("");
      setInstallmentCount("2");
      setInstallmentType("CREDIT_CARD");
      setFirstDueDate("");
    }
  }, [isOpen, editingTransaction, editingRecurring, editingInstallment, initialType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (txKind === "unique") {
        const parsedAmount = parseCurrency(amount);
        if (parsedAmount <= 0) throw new Error("Valor inválido");

        if (editingTransaction) {
          await api.updateTransaction(editingTransaction.id, {
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
      } else if (txKind === "fixed") {
        const parsedAmount = parseCurrency(amount);
        if (parsedAmount <= 0) throw new Error("Valor inválido");
        if (!description.trim()) throw new Error("Descrição é obrigatória");
        if (!startDate) throw new Error("Data de início é obrigatória");

        const payload: api.CreateRecurringExpensePayload = {
          type,
          amount: parsedAmount,
          description: description.trim(),
          category: category || undefined,
          paymentMethod: paymentMethod || undefined,
          dayOfMonth,
          startDate: new Date(`${startDate}T12:00:00`).toISOString(),
          endDate: endDate ? new Date(`${endDate}T12:00:00`).toISOString() : undefined,
        };

        if (editingRecurring) {
          await api.updateRecurringExpense(editingRecurring.id, payload);
        } else {
          await api.createRecurringExpense(payload);
        }
      } else {
        const parsedTotal = parseCurrency(totalAmount);
        if (parsedTotal <= 0) throw new Error("Valor total inválido");
        if (!description.trim()) throw new Error("Descrição é obrigatória");
        if (!firstDueDate) throw new Error("Primeiro vencimento é obrigatório");

        const payload: api.CreateInstallmentExpensePayload = {
          description: description.trim(),
          totalAmount: parsedTotal,
          installmentCount: Number.parseInt(installmentCount, 10),
          type: installmentType,
          category: category || undefined,
          firstDueDate: new Date(firstDueDate).toISOString(),
        };

        if (editingInstallment) {
          await api.updateInstallmentExpense(editingInstallment.id, payload);
        } else {
          await api.createInstallmentExpense(payload);
        }
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  const title = isEditing
    ? editingTransaction
      ? "Editar transação"
      : editingRecurring
        ? "Editar despesa fixa"
        : "Editar compra parcelada"
    : "Nova transação";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => { setType("EXPENSE"); if (!isEditing && txKind !== "fixed" && txKind !== "installment") setTxKind("unique"); }}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-300 ${
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
            onClick={() => { setType("INCOME"); if (!isEditing) setTxKind("unique"); }}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-300 ${
              type === "INCOME"
                ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
            }`}
          >
            <TrendingUp size={16} />
            Receita
          </button>
        </div>

        {!isEditing && (
          <div className="mb-6 flex gap-2">
            {([
              { value: "unique" as TxKind, label: "Única", icon: Zap },
              { value: "fixed" as TxKind, label: "Fixa", icon: RotateCcw },
              { value: "installment" as TxKind, label: "Parcelada", icon: CreditCard },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTxKind(value)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-300 ${
                  txKind === value
                    ? "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {txKind === "unique" && (
          <>
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
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
              />
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                >
                  <option value="">Sem categoria</option>
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Forma de pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
              >
                <option value="">Selecione</option>
                {paymentOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {txKind === "fixed" && (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aluguel"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
                />
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                >
                  <option value="">Sem categoria</option>
                  {categoryOptionsRecurring.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Forma de pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                >
                  <option value="">Selecione</option>
                  {paymentOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Dia vencimento
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Data início
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Data término
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </div>
            </div>
          </>
        )}

        {txKind === "installment" && (
          <>
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Descrição
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Notebook Dell"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
              />
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Valor total
                </label>
                <input
                  type="text"
                  required
                  inputMode="decimal"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(fmt(e.target.value))}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Quantidade de parcelas
                </label>
                <input
                  type="number"
                  required
                  min="2"
                  max="120"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInstallmentType("CREDIT_CARD")}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-300 ${
                      installmentType === "CREDIT_CARD"
                        ? "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-400"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                    }`}
                  >
                    <CreditCard size={14} />
                    Cartão
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallmentType("CARNE")}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-300 ${
                      installmentType === "CARNE"
                        ? "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-400"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                    }`}
                  >
                    <Receipt size={14} />
                    Carnê
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                >
                  <option value="">Sem categoria</option>
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
                Primeiro vencimento
              </label>
              <input
                type="date"
                required
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
        >
          {submitting
            ? "Salvando…"
            : isEditing
              ? "Atualizar"
              : txKind === "fixed"
                ? type === "INCOME" ? "Criar receita fixa" : "Criar despesa fixa"
                : txKind === "installment"
                  ? "Criar compra parcelada"
                  : "Salvar transação"}
        </button>
      </form>
    </Modal>
  );
}
