import { useAuth } from "../contexts/auth-context";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Send,
  ArrowDownToLine,
  Receipt,
  ShoppingCart,
  Home,
  Car,
} from "lucide-react";

const summary = [
  {
    label: "Receitas",
    amount: "R$ 8.450,00",
    icon: TrendingUp,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    label: "Despesas",
    amount: "R$ 4.230,00",
    icon: TrendingDown,
    color: "text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
  {
    label: "Investimentos",
    amount: "R$ 1.500,00",
    icon: BarChart3,
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
];

const quickActions = [
  { label: "Receita", icon: Plus, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
  { label: "Despesa", icon: ArrowDownToLine, color: "text-red-400 bg-red-50 dark:bg-red-900/20" },
  { label: "Transferir", icon: Send, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
];

const recentTransactions = [
  { description: "Supermercado", amount: "-R$ 187,90", icon: ShoppingCart, type: "expense" },
  { description: "Salário", amount: "+R$ 5.200,00", icon: Wallet, type: "income" },
  { description: "Aluguel", amount: "-R$ 1.800,00", icon: Home, type: "expense" },
  { description: "Gasolina", amount: "-R$ 98,50", icon: Car, type: "expense" },
  { description: "Freelance", amount: "+R$ 850,00", icon: Receipt, type: "income" },
];

const budgetPercent = 72;

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs text-slate-500 dark:text-gray-400">Bem-vindo de volta,</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">
          {user?.name ?? user?.email}
        </h1>
      </div>

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-600/20 dark:from-blue-700 dark:to-violet-700">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
        <p className="relative text-xs font-medium tracking-widest text-white/70 uppercase">
          Saldo total
        </p>
        <p className="relative mt-2 text-3xl font-bold tracking-tight">R$ 12.680,00</p>
        <div className="relative mt-4 flex items-center gap-2 text-sm text-white/70">
          <TrendingUp size={16} className="text-emerald-300" />
          <span className="text-emerald-300">+5,2%</span>
          <span>este mês</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map(({ label, amount, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
                {label}
              </span>
              <div className={`rounded-xl p-2 ${bg}`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-gray-100">{amount}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex gap-3">
        {quickActions.map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.97] dark:border-gray-800 dark:bg-gray-900"
          >
            <div className={`rounded-xl p-2.5 ${color}`}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
          Transações recentes
        </h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {recentTransactions.map(({ description, amount, icon: Icon, type }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-gray-800/60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400">
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-gray-100">
                  {description}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
          Limite mensal
        </h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-gray-400">Gasto</span>
            <span className="font-semibold text-slate-900 dark:text-gray-100">
              R$ 3.600 / R$ 5.000
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetPercent < 50
                  ? "bg-emerald-500"
                  : budgetPercent < 80
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-gray-500">
            {budgetPercent}% do limite utilizado
          </p>
        </div>
      </div>
    </main>
  );
}
