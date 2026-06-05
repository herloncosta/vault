import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { CreditCard, Receipt } from "lucide-react";
import * as api from "../lib/api";
import { fmt, parse as parseCurrency } from "../lib/currency";

interface Props {
  editing: api.InstallmentExpense | null | undefined;
  onSave: () => void;
  onClose: () => void;
}

interface Form {
  description: string;
  totalAmount: number;
  installmentCount: string;
  installmentType: "CREDIT_CARD" | "CARNE";
  category: string;
  firstDueDate: string;
}

function toNumber(raw: string): number {
  const f = fmt(raw);
  return f ? parseCurrency(f) : 0;
}

function toDisplay(value: number): string {
  if (!value) return "";
  return fmt(String(Math.round(value * 100)));
}

export default function InstallmentExpenseForm({ editing, onSave, onClose }: Props) {
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<api.Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await api.listCategories("EXPENSE");
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const { control, register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<Form>({
    defaultValues: { description: "", totalAmount: 0, installmentCount: "2", installmentType: "CREDIT_CARD", category: "", firstDueDate: "" },
  });

  useEffect(() => {
    if (editing) {
      reset({
        description: editing.description,
        totalAmount: Number(editing.totalAmount),
        installmentCount: String(editing.installmentCount),
        installmentType: editing.type,
        category: editing.category ?? "",
        firstDueDate: editing.firstDueDate.slice(0, 10),
      });
    } else {
      reset({ description: "", totalAmount: 0, installmentCount: "2", installmentType: "CREDIT_CARD", category: "", firstDueDate: "" });
    }
  }, [editing, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setError("");
    if (data.totalAmount <= 0) { setError("Valor total inválido"); return; }
    if (!data.description.trim()) { setError("Descrição é obrigatória"); return; }
    if (!data.firstDueDate) { setError("Primeiro vencimento é obrigatório"); return; }

    try {
      const payload: api.CreateInstallmentExpensePayload = {
        description: data.description.trim(),
        totalAmount: data.totalAmount,
        installmentCount: Number.parseInt(data.installmentCount, 10),
        type: data.installmentType,
        category: data.category || undefined,
        firstDueDate: new Date(data.firstDueDate).toISOString(),
      };
      if (editing) {
        await api.updateInstallmentExpense(editing.id, payload);
      } else {
        await api.createInstallmentExpense(payload);
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

      <div className="mb-5">
        <label htmlFor="inst-description" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Descrição</label>
        <input
          id="inst-description"
          type="text"
          {...register("description", { required: true })}
          placeholder="Ex: Notebook Dell"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inst-totalAmount" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Valor total</label>
          <Controller
            name="totalAmount"
            control={control}
            rules={{ required: true, validate: (v) => v > 0 }}
            render={({ field }) => (
              <input
                id="inst-totalAmount"
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
          <label htmlFor="inst-installmentCount" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Quantidade de parcelas</label>
          <input
            id="inst-installmentCount"
            type="number"
            min="2"
            max="120"
            {...register("installmentCount", { required: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inst-type" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Tipo</label>
          <div id="inst-type" className="flex gap-2">
            {(["CREDIT_CARD", "CARNE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("installmentType", t)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-300 ${
                  watch("installmentType") === t
                    ? "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                }`}
              >
                {t === "CREDIT_CARD" ? <CreditCard size={14} /> : <Receipt size={14} />}
                {t === "CREDIT_CARD" ? "Cartão" : "Carnê"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="inst-category" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Categoria</label>
          <select
            id="inst-category"
            {...register("category")}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
          >
            <option value="">Sem categoria</option>
            {loadingCategories ? (
              <option value="" disabled>Carregando…</option>
            ) : categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="inst-firstDueDate" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">Primeiro vencimento</label>
        <input
          id="inst-firstDueDate"
          type="date"
          {...register("firstDueDate", { required: true })}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-60 disabled:shadow-none"
      >
        {isSubmitting ? "Salvando…" : editing ? "Atualizar" : "Criar compra parcelada"}
      </button>
    </form>
  );
}
