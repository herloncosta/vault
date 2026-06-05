import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import * as api from "../lib/api";
import { fmt, parse as parseCurrency } from "../lib/currency";

const paymentOptions = ["Crédito", "Débito", "Boleto", "PIX", "Dinheiro", "Automático"];

interface Props {
  type: "INCOME" | "EXPENSE";
  editing: api.Transaction | null | undefined;
  onSave: () => void;
  onClose: () => void;
}

interface Form {
  amount: number;
  description: string;
  category: string;
  date: string;
  paymentMethod: string;
}

function toNumber(raw: string): number {
  const f = fmt(raw);
  return f ? parseCurrency(f) : 0;
}

function toDisplay(value: number): string {
  if (!value) return "";
  return fmt(String(Math.round(value * 100)));
}

export default function UniqueTransactionForm({ type, editing, onSave, onClose }: Props) {
  const { control, register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>({
    defaultValues: { amount: 0, description: "", category: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "" },
  });

  const [categories, setCategories] = useState<api.Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await api.listCategories(type);
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [type]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (editing) {
      reset({
        amount: Number(editing.amount),
        description: editing.description,
        category: editing.category ?? "",
        date: new Date(editing.date).toISOString().slice(0, 10),
        paymentMethod: editing.paymentMethod ?? "",
      });
    } else {
      reset({ amount: 0, description: "", category: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "" });
    }
  }, [editing, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (data.amount <= 0) return;
    const payload = {
      type, amount: data.amount, description: data.description,
      category: data.category || undefined,
      date: new Date(data.date).toISOString(),
      paymentMethod: data.paymentMethod || undefined,
    };
    if (editing) {
      await api.updateTransaction(editing.id, payload);
    } else {
      await api.createTransaction(payload);
    }
    onSave();
    onClose();
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-5">
        <label htmlFor="uni-amount" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Valor</label>
        <Controller
          name="amount"
          control={control}
          rules={{ required: true, validate: (v) => v > 0 }}
          render={({ field }) => (
            <input
              id="uni-amount"
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

      <div className="mb-5">
        <label htmlFor="uni-description" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Descrição</label>
        <input
          id="uni-description"
          type="text"
          {...register("description", { required: true })}
          placeholder="Ex: Salário mensal"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="uni-category" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Categoria</label>
          <select
            id="uni-category"
            {...register("category")}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          >
            <option value="">Sem categoria</option>
            {loadingCategories ? (
              <option value="" disabled>Carregando…</option>
            ) : categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="uni-date" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Data</label>
          <input
            id="uni-date"
            type="date"
            {...register("date", { required: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="uni-paymentMethod" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Forma de pagamento</label>
        <select
          id="uni-paymentMethod"
          {...register("paymentMethod")}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
        >
          <option value="">Selecione</option>
          {paymentOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
      >
        {isSubmitting ? "Salvando…" : editing ? "Atualizar" : "Salvar transação"}
      </button>
    </form>
  );
}
