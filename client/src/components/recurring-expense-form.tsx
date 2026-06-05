import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as api from "../lib/api";
import { fmt, parse as parseCurrency } from "../lib/currency";

const recurringIncomeCategories = ["Salário", "Freelance", "Aluguel", "Investimentos", "Outros"];
const recurringExpenseCategories = [
  "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",
  "Lazer", "Assinaturas", "Seguros", "Utilidades", "Outros",
];

const paymentOptions = ["Crédito", "Débito", "Boleto", "PIX", "Dinheiro", "Automático"];

interface Props {
  type: "INCOME" | "EXPENSE";
  editing: api.RecurringExpense | null | undefined;
  onSave: () => void;
  onClose: () => void;
}

interface Form {
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  dayOfMonth: number;
  startDate: string;
  endDate: string;
}

function toNumber(raw: string): number {
  const f = fmt(raw);
  return f ? parseCurrency(f) : 0;
}

function toDisplay(value: number): string {
  if (!value) return "";
  return fmt(String(Math.round(value * 100)));
}

export default function RecurringExpenseForm({ type, editing, onSave, onClose }: Props) {
  const [error, setError] = useState("");
  const { control, register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>({
    defaultValues: { amount: 0, description: "", category: "", paymentMethod: "", dayOfMonth: 1, startDate: "", endDate: "" },
  });

  useEffect(() => {
    if (editing) {
      reset({
        amount: Number(editing.amount),
        description: editing.description,
        category: editing.category ?? "",
        paymentMethod: editing.paymentMethod ?? "",
        dayOfMonth: editing.dayOfMonth,
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate ? editing.endDate.slice(0, 10) : "",
      });
    } else {
      reset({ amount: 0, description: "", category: "", paymentMethod: "", dayOfMonth: 1, startDate: "", endDate: "" });
    }
  }, [editing, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setError("");
    if (data.amount <= 0) { setError("Valor inválido"); return; }
    if (!data.description.trim()) { setError("Descrição é obrigatória"); return; }
    if (!data.startDate) { setError("Data de início é obrigatória"); return; }

    try {
      const payload: api.CreateRecurringExpensePayload = {
        type, amount: data.amount, description: data.description.trim(),
        category: data.category || undefined,
        paymentMethod: data.paymentMethod || undefined,
        dayOfMonth: data.dayOfMonth,
        startDate: new Date(`${data.startDate}T12:00:00`).toISOString(),
        endDate: data.endDate ? new Date(`${data.endDate}T12:00:00`).toISOString() : undefined,
      };
      if (editing) {
        await api.updateRecurringExpense(editing.id, payload);
      } else {
        await api.createRecurringExpense(payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Valor</label>
          <Controller
            name="amount"
            control={control}
            rules={{ required: true, validate: (v) => v > 0 }}
            render={({ field }) => (
              <input
                type="text"
                inputMode="decimal"
                value={toDisplay(field.value)}
                onChange={(e) => field.onChange(toNumber(e.target.value))}
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
              />
            )}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Descrição</label>
          <input
            type="text"
            {...register("description", { required: true })}
            placeholder="Ex: Aluguel"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
          />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Categoria</label>
          <select
            {...register("category")}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          >
            <option value="">Sem categoria</option>
            {(type === "INCOME" ? recurringIncomeCategories : recurringExpenseCategories).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Forma de pagamento</label>
          <select
            {...register("paymentMethod")}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          >
            <option value="">Selecione</option>
            {paymentOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Dia vencimento</label>
          <select
            {...register("dayOfMonth", { valueAsNumber: true })}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Data início</label>
          <input
            type="date"
            {...register("startDate", { required: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Data término</label>
          <input
            type="date"
            {...register("endDate")}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
      >
        {isSubmitting ? "Salvando…" : editing ? "Atualizar" : type === "INCOME" ? "Criar receita fixa" : "Criar despesa fixa"}
      </button>
    </form>
  );
}
