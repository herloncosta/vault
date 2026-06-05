import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap, RotateCcw, CreditCard } from "lucide-react";
import Modal from "./modal";
import UniqueTransactionForm from "./unique-transaction-form";
import RecurringExpenseForm from "./recurring-expense-form";
import InstallmentExpenseForm from "./installment-expense-form";
import * as api from "../lib/api";

type TxKind = "unique" | "fixed" | "installment";

interface Props {
  isOpen: boolean;
  initialType: "INCOME" | "EXPENSE";
  editingTransaction?: api.Transaction | null;
  editingRecurring?: api.RecurringExpense | null;
  editingInstallment?: api.InstallmentExpense | null;
  onSave: () => void;
  onClose: () => void;
}

const kindOptions: { value: TxKind; label: string; icon: typeof Zap }[] = [
  { value: "unique", label: "Única", icon: Zap },
  { value: "fixed", label: "Fixa", icon: RotateCcw },
  { value: "installment", label: "Parcelada", icon: CreditCard },
];

export default function TransactionForm({
  isOpen, initialType, editingTransaction, editingRecurring, editingInstallment, onSave, onClose,
}: Props) {
  const isEditing = !!(editingTransaction || editingRecurring || editingInstallment);
  const [txKind, setTxKind] = useState<TxKind>("unique");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);

  useEffect(() => {
    if (!isOpen) return;
    setType(editingTransaction?.type ?? initialType);
    if (editingTransaction) setTxKind("unique");
    else if (editingRecurring) setTxKind("fixed");
    else if (editingInstallment) setTxKind("installment");
    else setTxKind("unique");
  }, [isOpen, editingTransaction, editingRecurring, editingInstallment, initialType]);

  const title = isEditing
    ? editingTransaction ? "Editar transação"
      : editingRecurring ? "Editar despesa fixa" : "Editar compra parcelada"
    : "Nova transação";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-xl">
      <div className="mb-6 flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); if (!isEditing && txKind !== "fixed" && txKind !== "installment") setTxKind("unique"); }}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-300 ${
              type === t
                ? t === "EXPENSE"
                  ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-400"
                  : "border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
            }`}
          >
            {t === "EXPENSE" ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            {t === "EXPENSE" ? "Despesa" : "Receita"}
          </button>
        ))}
      </div>

      {!isEditing && (
        <div className="mb-6 flex gap-2">
          {kindOptions.map(({ value, label, icon: Icon }) => (
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
        <UniqueTransactionForm type={type} editing={editingTransaction} onSave={onSave} onClose={onClose} />
      )}
      {txKind === "fixed" && (
        <RecurringExpenseForm type={type} editing={editingRecurring} onSave={onSave} onClose={onClose} />
      )}
      {txKind === "installment" && (
        <InstallmentExpenseForm editing={editingInstallment} onSave={onSave} onClose={onClose} />
      )}
    </Modal>
  );
}
