import { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth-context";
import {
	Wallet,
	TrendingUp,
	TrendingDown,
	Pencil,
	ShoppingCart,
	Home,
	Car,
	Receipt,
	Utensils,
	Gamepad2,
	Plane,
	HeartPulse,
	GraduationCap,
	X,
	Check,
	type LucideIcon,
	ArrowDownToLine,
} from "lucide-react";
import {
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
	LineChart,
	Line,
} from "recharts";
import * as api from "../lib/api";
import { parse as parseCurrency, brl as formatCurrency } from "../lib/currency";
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

export default function HomePage() {
	const { user, refreshUser } = useAuth();
	const [transactions, setTransactions] = useState<api.Transaction[]>([]);
	const [summary, setSummary] = useState<api.TransactionsSummary | null>(null);
	const [installmentExpenses, setInstallmentExpenses] = useState<api.InstallmentExpense[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingBudget, setEditingBudget] = useState(false);
	const [budgetInput, setBudgetInput] = useState("");
	const [budgetSubmitting, setBudgetSubmitting] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [modalType, setModalType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
	const [txError, setTxError] = useState(false);
	const [budgetError, setBudgetError] = useState("");

	function fetchTransactions() {
		setTxError(false);
		api
			.listTransactions({ limit: "1000" })
			.then((res) => setTransactions(res.data))
			.catch(() => {
				setTransactions([]);
				setTxError(true);
			})
			.finally(() => setLoading(false));
		api.getTransactionsSummary().then(setSummary).catch(() => setSummary(null));
		api
			.listInstallmentExpenses({ limit: "100" })
			.then((res) => setInstallmentExpenses(res.data))
			.catch(() => setInstallmentExpenses([]));
	}

	useEffect(() => {
		fetchTransactions();
	}, []);

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	const monthTransactions = transactions.filter((t) => {
		const d = new Date(t.date);
		return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
	});

	const totalIncome = transactions
		.filter((t) => t.type === "INCOME")
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const totalExpense = transactions
		.filter((t) => t.type === "EXPENSE")
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const balance = totalIncome - totalExpense;

	const monthIncome = summary?.current.income ?? monthTransactions
		.filter((t) => t.type === "INCOME")
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const monthExpense = summary?.current.expense ?? monthTransactions
		.filter((t) => t.type === "EXPENSE")
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const prevIncome = summary?.previous.income ?? 0;
	const incomeChange = prevIncome > 0 ? ((monthIncome - prevIncome) / prevIncome) * 100 : null;

	const prevExpense = summary?.previous.expense ?? 0;
	const expenseChange = prevExpense > 0 ? ((monthExpense - prevExpense) / prevExpense) * 100 : null;

	const monthBalance = monthIncome - monthExpense;

	const recentTransactions = transactions.filter((t) => new Date(t.date) <= now).slice(0, 5);

	const budgetLimit = user?.monthlyBudget ? Number(user.monthlyBudget) : 5000;
	const budgetPercent = Math.min(
		100,
		Math.round((monthExpense / budgetLimit) * 100),
	);

	async function handleSaveBudget() {
		const value = parseCurrency(budgetInput);
		if (!(value > 0)) return;
		setBudgetSubmitting(true);
		setBudgetError("");
		try {
			await api.updateBudget(value);
			await refreshUser();
			setEditingBudget(false);
		} catch {
			setBudgetError("Não foi possível salvar. Tente de novo.");
		} finally {
			setBudgetSubmitting(false);
		}
	}

	if (loading) {
		return (
			<main className="mx-auto max-w-5xl px-4 py-10">
				<div className="space-y-6">
					<div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-gray-800" />
					<div className="h-44 animate-pulse rounded-lg bg-slate-200 dark:bg-gray-800" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-28 animate-pulse rounded-md bg-slate-200 dark:bg-gray-800"
							/>
						))}
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-5xl px-4 py-10">
			<div className="mb-8 flex items-start justify-between">
				<div>
					<p className="text-xs text-slate-500 dark:text-gray-400">
						Bem-vindo de volta,
					</p>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">
						{user?.name ?? user?.email}
					</h1>
				</div>
				<button
					type="button"
					onClick={() => {
						setModalType("EXPENSE");
						setModalOpen(true);
					}}
					className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97] md:px-4"
					aria-label="Nova transação"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title>Ícone de Adicionar</title>
						<path d="M5 12h14" />
						<path d="M12 5v14" />
					</svg>
					<span className="hidden md:inline">Nova transação</span>
				</button>
			</div>

			{txError ? (
				<div className="rounded-xl border border-red-200 bg-white p-10 text-center shadow-lg dark:border-red-900/40 dark:bg-gray-900">
					<p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
						Não foi possível carregar seus dados
					</p>
					<p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
						Verifique sua conexão e tente de novo.
					</p>
					<button
						type="button"
						onClick={fetchTransactions}
						className="mt-4 cursor-pointer rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.97]"
					>
						Tentar novamente
					</button>
				</div>
			) : (
				<>
			<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
				{[
					{
						label: "Receitas",
						amount: formatCurrency(monthIncome),
						icon: TrendingUp,
						color: "text-emerald-500 dark:text-emerald-400",
						bg: "bg-emerald-50 dark:bg-emerald-900/20",
					},
					{
						label: "Despesas",
						amount: formatCurrency(monthExpense),
						icon: TrendingDown,
						color: "text-red-400",
						bg: "bg-red-50 dark:bg-red-900/20",
					},
					{
						label: "Saldo total",
						amount: formatCurrency(balance),
						icon: Wallet,
						color: "text-violet-500 dark:text-violet-400",
						bg: "bg-violet-50 dark:bg-violet-900/20",
					},
				].map(({ label, amount, icon: Icon, color, bg }) => (
					<div
						key={label}
						className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
					>
						<div className="mb-4 flex items-center justify-between">
							<span className="text-xs font-medium text-slate-500 dark:text-gray-400">
								{label}
							</span>
							<div className={`rounded-lg p-2 ${bg}`}>
								<Icon size={16} className={color} />
							</div>
						</div>
						<p className="text-lg font-bold text-slate-900 dark:text-gray-100">
							{amount}
						</p>
					</div>
				))}
			</div>

			<div className="relative mb-8 overflow-hidden rounded-lg bg-linear-to-br from-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-600/20 dark:from-blue-700 dark:to-violet-700">
				<div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
				<div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
				<p className="relative text-xs font-medium tracking-widest text-white/70 uppercase">
					Saldo do mês
				</p>
				<p className="relative mt-2 text-3xl font-bold tracking-tight">
					{formatCurrency(monthBalance)}
				</p>
				<p className="relative mt-1 text-sm text-white/70">
					Total geral: {formatCurrency(balance)}
				</p>
				<div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
					{incomeChange === null && expenseChange === null ? (
						<span>sem dados do mês anterior</span>
					) : (
						<>
							{incomeChange !== null && (
								<span className="flex items-center gap-1">
									<TrendingUp size={16} className="text-emerald-300" />
									<span className="text-emerald-300">
										Receitas {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(1)}%
									</span>
								</span>
							)}
							{expenseChange !== null && (
								<span className="text-red-200">
									Gastos {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}%
								</span>
							)}
							<span>vs. mês anterior</span>
						</>
					)}
				</div>
			</div>

			<div className="mb-8">
				<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
					Evolução do saldo
				</h2>
				<BalanceAreaChart transactions={transactions} />
			</div>

			<TransactionForm
				isOpen={modalOpen}
				initialType={modalType}
				onSave={fetchTransactions}
				onClose={() => setModalOpen(false)}
			/>

			<div className="mb-8">
				<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
					Receitas x Despesas
				</h2>
				<MonthlyChart transactions={transactions} />
			</div>

			<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
						Despesas por categoria
					</h2>
					<DonutChart data={groupSum(monthTransactions, "EXPENSE", "category")} />
				</div>
				<div>
					<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
						Despesas por forma de pagamento
					</h2>
					<DonutChart data={groupSum(monthTransactions, "EXPENSE", "paymentMethod")} />
				</div>
			</div>

			<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
						Fixas vs variáveis
					</h2>
					<FixedVariableBar transactions={monthTransactions} />
				</div>
				<div>
					<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
						Parcelas
					</h2>
					<InstallmentsDonut expenses={installmentExpenses} />
				</div>
			</div>

			<div className="mb-8">
				<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
					Transações recentes
				</h2>
				<div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
					{recentTransactions.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-10">
							<ArrowDownToLine
								size={28}
								className="text-slate-400 dark:text-gray-600"
							/>
							<p className="text-sm text-slate-500 dark:text-gray-500">
								Nenhuma transação ainda
							</p>
							<p className="text-xs text-slate-500 dark:text-gray-500">
								Use Nova transação acima para começar.
							</p>
						</div>
					) : (
						recentTransactions.map((t) => {
							const CatIcon =
								categoryIcons[t.category ?? ""] ?? ArrowDownToLine;
							return (
								<div
									key={t.id}
									className="flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-gray-800/60"
								>
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-lg ${
											t.type === "INCOME"
												? "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400"
												: "bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-400"
										}`}
									>
										<CatIcon size={16} />
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium text-slate-900 dark:text-gray-100">
											{t.description}
										</p>
										<p className="text-xs text-slate-500 dark:text-gray-500">
											{new Date(t.date).toLocaleDateString("pt-BR")}
										</p>
									</div>
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
								</div>
							);
						})
					)}
				</div>
			</div>

			<div className="mb-8">
				<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
					Gasto diário vs limite
				</h2>
				<DailySpendingChart transactions={monthTransactions} budgetLimit={budgetLimit} />
			</div>

			<div>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
						Limite mensal
					</h2>
					{!editingBudget && (
						<button
							type="button"
							onClick={() => {
								setBudgetInput(String(budgetLimit));
								setEditingBudget(true);
							}}
							className="flex cursor-pointer items-center gap-1 text-xs text-slate-500 transition-all duration-300 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
						>
							<Pencil size={12} />
							Alterar
						</button>
					)}
				</div>
				<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
					{editingBudget ? (
						<div>
							<label
								htmlFor="budget-input"
								className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400"
							>
								Novo limite mensal
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									id="budget-input"
									inputMode="decimal"
									value={budgetInput}
									onChange={(e) => setBudgetInput(e.target.value)}
									placeholder="5000"
									className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-blue-400"
								/>
								<button
									type="button"
									onClick={handleSaveBudget}
									disabled={budgetSubmitting}
									className="flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 text-white transition-all duration-300 hover:bg-blue-700 disabled:opacity-60"
								>
									<Check size={16} />
								</button>
								<button
									type="button"
									onClick={() => setEditingBudget(false)}
									disabled={budgetSubmitting}
									className="flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-slate-500 transition-all duration-300 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700"
								>
									<X size={16} />
								</button>
							</div>
							{budgetError && (
								<p className="mt-2 text-xs text-red-500 dark:text-red-400">{budgetError}</p>
							)}
						</div>
					) : (
						<>
							<div className="mb-3 flex items-center justify-between text-sm">
								<span className="text-slate-500 dark:text-gray-400">Gasto</span>
								<span className="font-semibold text-slate-900 dark:text-gray-100">
									{formatCurrency(monthExpense)} / {formatCurrency(budgetLimit)}
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
							<p className="mt-2 text-xs text-slate-500 dark:text-gray-500">
								{budgetPercent}% do limite utilizado
							</p>
						</>
					)}
				</div>
			</div>
				</>
			)}
		</main>
	);
}

const monthNames = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
];

const CHART_COLORS = [
	"#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6",
	"#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
	"#06b6d4", "#d946ef", "#eab308", "#22c55e", "#64748b",
];

const tooltipContentStyle = {
	backgroundColor: "var(--tooltip-bg, #fff)",
	border: "1px solid var(--tooltip-border, #e2e8f0)",
	borderRadius: "12px",
	fontSize: "12px",
	boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
} as const;

const tooltipLabelStyle = { fontWeight: 600, marginBottom: 4 } as const;

const tooltipFormatter = (value: any) => [formatCurrency(Number(value) || 0)];

const axisKFormatter = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

function EmptyChart({ message = "Nenhum dado no mês atual" }: { message?: string }) {
	return (
		<div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<p className="text-sm text-slate-500 dark:text-gray-500">{message}</p>
		</div>
	);
}

function groupSum(
	transactions: api.Transaction[],
	type: "INCOME" | "EXPENSE",
	key: "category" | "paymentMethod",
) {
	const totals: Record<string, number> = {};
	for (const t of transactions) {
		const k = t[key];
		if (t.type !== type || !k) continue;
		totals[k] = (totals[k] ?? 0) + Number(t.amount);
	}
	return Object.entries(totals)
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value);
}

function colorForCategory(name: string) {
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	return CHART_COLORS[hash % CHART_COLORS.length];
}

function DonutChart({
	data,
	colors,
	emptyMessage,
	subtitle,
}: {
	data: { name: string; value: number }[];
	colors?: string[];
	emptyMessage?: string;
	subtitle?: string;
}) {
	if (data.length === 0) {
		return <EmptyChart message={emptyMessage ?? "Nenhum dado no mês atual"} />;
	}

	const total = data.reduce((a, d) => a + d.value, 0);

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<div className="flex flex-col items-center gap-4 sm:flex-row">
				<ResponsiveContainer width="100%" height={220} className="sm:max-w-[220px]">
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={90}
							innerRadius={50}
							paddingAngle={3}
						>
							{data.map((d, i) => (
								<Cell
									key={d.name}
									fill={colors?.[i % colors.length] ?? colorForCategory(d.name)}
								/>
							))}
						</Pie>
						<Tooltip
							contentStyle={tooltipContentStyle}
							formatter={tooltipFormatter}
							labelStyle={tooltipLabelStyle}
						/>
					</PieChart>
				</ResponsiveContainer>
				<ul className="w-full flex-1 space-y-2">
					{data.map((d, i) => (
						<li key={d.name} className="flex items-center gap-2 text-sm">
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: colors?.[i % colors.length] ?? colorForCategory(d.name) }}
							/>
							<span className="flex-1 truncate text-slate-600 dark:text-gray-300">{d.name}</span>
							<span className="font-semibold text-slate-900 dark:text-gray-100">
								{formatCurrency(d.value)}
							</span>
							<span className="w-11 shrink-0 text-right text-xs text-slate-500 dark:text-gray-500">
								{total > 0 ? Math.round((d.value / total) * 100) : 0}%
							</span>
						</li>
					))}
				</ul>
			</div>
			{subtitle && (
				<p className="mt-2 text-center text-xs text-slate-500 dark:text-gray-500">{subtitle}</p>
			)}
		</div>
	);
}

function BalanceAreaChart({ transactions }: { transactions: api.Transaction[] }) {
	const byMonth = new Map<string, number>();
	for (const t of transactions) {
		const d = new Date(t.date);
		const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
		byMonth.set(
			key,
			(byMonth.get(key) ?? 0) + (t.type === "INCOME" ? Number(t.amount) : -Number(t.amount)),
		);
	}

	let acc = 0;
	const data = [...byMonth.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, net]) => {
			acc += net;
			const [y, m] = key.split("-");
			return {
				label: `${monthNames[Number(m)]}/${y.slice(-2)}`,
				Saldo: Math.round(acc * 100) / 100,
			};
		})
		.slice(-12);

	if (data.length === 0) return <EmptyChart message="Nenhuma transação ainda" />;

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<ResponsiveContainer width="100%" height={260}>
				<AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
					<defs>
						<linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
							<stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						className="text-slate-100 dark:text-gray-800"
					/>
					<XAxis
						dataKey="label"
						tick={{ fontSize: 10, fill: "currentColor" }}
						className="text-slate-500 dark:text-gray-500"
						axisLine={{ stroke: "currentColor" }}
						tickLine={false}
						interval={0}
						angle={-30}
						textAnchor="end"
						height={36}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "currentColor" }}
						className="text-slate-500 dark:text-gray-500"
						axisLine={false}
						tickLine={false}
						tickFormatter={axisKFormatter}
						width={40}
					/>
					<Tooltip
						contentStyle={tooltipContentStyle}
						formatter={tooltipFormatter}
						labelStyle={tooltipLabelStyle}
					/>
					<Area
						type="monotone"
						dataKey="Saldo"
						stroke="#3b82f6"
						strokeWidth={2}
						fill="url(#balanceGradient)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

function DailySpendingChart({
	transactions,
	budgetLimit,
}: {
	transactions: api.Transaction[];
	budgetLimit: number;
}) {
	const now = new Date();
	const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
	const today = now.getDate();

	const perDay = new Array<number>(daysInMonth).fill(0);
	for (const t of transactions) {
		if (t.type !== "EXPENSE") continue;
		const d = new Date(t.date);
		if (d <= now) perDay[d.getDate() - 1] += Number(t.amount);
	}

	let acc = 0;
	const data = perDay.map((amount, i) => {
		acc += amount;
		return {
			day: i + 1,
			Gasto: i + 1 <= today ? Math.round(acc * 100) / 100 : null,
			Limite: Math.round(((budgetLimit / daysInMonth) * (i + 1)) * 100) / 100,
		};
	});

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<ResponsiveContainer width="100%" height={260}>
				<LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						className="text-slate-100 dark:text-gray-800"
					/>
					<XAxis
						dataKey="day"
						tick={{ fontSize: 10, fill: "currentColor" }}
						className="text-slate-500 dark:text-gray-500"
						axisLine={{ stroke: "currentColor" }}
						tickLine={false}
						interval={4}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "currentColor" }}
						className="text-slate-500 dark:text-gray-500"
						axisLine={false}
						tickLine={false}
						tickFormatter={axisKFormatter}
						width={40}
					/>
					<Tooltip
						contentStyle={tooltipContentStyle}
						formatter={tooltipFormatter}
						labelStyle={tooltipLabelStyle}
					/>
					<Legend
						wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
						iconType="circle"
						iconSize={8}
					/>
					<Line
						type="monotone"
						dataKey="Gasto"
						name="Gasto acumulado"
						stroke="#3b82f6"
						strokeWidth={2}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="Limite"
						name="Ritmo do limite"
						stroke="#94a3b8"
						strokeWidth={1.5}
						strokeDasharray="6 6"
						dot={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

function FixedVariableBar({ transactions }: { transactions: api.Transaction[] }) {
	const expenses = transactions.filter((t) => t.type === "EXPENSE");
	const fixed = expenses
		.filter((t) => t.source !== "transaction")
		.reduce((a, t) => a + Number(t.amount), 0);
	const variable = expenses
		.filter((t) => t.source === "transaction")
		.reduce((a, t) => a + Number(t.amount), 0);
	const total = fixed + variable;

	if (total === 0) return <EmptyChart />;

	const items = [
		{ label: "Fixas", value: fixed, color: "#8b5cf6" },
		{ label: "Variáveis", value: variable, color: "#3b82f6" },
	];

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
				{items.map((it) => (
					<div
						key={it.label}
						className="h-full transition-all duration-300"
						style={{ width: `${(it.value / total) * 100}%`, backgroundColor: it.color }}
					/>
				))}
			</div>
			<div className="mt-4 space-y-2">
				{items.map((it) => (
					<div key={it.label} className="flex items-center gap-2 text-sm">
						<span
							className="h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: it.color }}
						/>
						<span className="flex-1 text-slate-500 dark:text-gray-400">{it.label}</span>
						<span className="font-semibold text-slate-900 dark:text-gray-100">
							{formatCurrency(it.value)}
						</span>
						<span className="w-10 text-right text-xs text-slate-500 dark:text-gray-500">
							{Math.round((it.value / total) * 100)}%
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function InstallmentsDonut({ expenses }: { expenses: api.InstallmentExpense[] }) {
	const all = expenses.flatMap((e) => e.installments);
	const paidList = all.filter((i) => i.paid);
	const paid = paidList.reduce((a, i) => a + Number(i.amount), 0);
	const remaining = all.filter((i) => !i.paid).reduce((a, i) => a + Number(i.amount), 0);

	const data = [
		{ name: "Pago", value: paid },
		{ name: "A vencer", value: remaining },
	].filter((d) => d.value > 0);

	return (
		<DonutChart
			data={data}
			colors={["#10b981", "#f59e0b"]}
			emptyMessage="Nenhuma compra parcelada"
			subtitle={all.length > 0 ? `${paidList.length} de ${all.length} parcelas pagas` : ""}
		/>
	);
}

function MonthlyChart({ transactions }: { transactions: api.Transaction[] }) {
	const now = new Date();

	const monthlyData = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
		const month = d.getMonth();
		const year = d.getFullYear();

		const monthTx = transactions.filter((t) => {
			const td = new Date(t.date);
			return td.getMonth() === month && td.getFullYear() === year;
		});

		return {
			label: `${monthNames[month]}/${String(year).slice(-2)}`,
			Receita: monthTx
				.filter((t) => t.type === "INCOME")
				.reduce((a, t) => a + Number(t.amount), 0),
			Despesa: monthTx
				.filter((t) => t.type === "EXPENSE")
				.reduce((a, t) => a + Number(t.amount), 0),
		};
	});

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<ResponsiveContainer width="100%" height={260}>
				<LineChart
					data={monthlyData}
					margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						className="text-slate-100 dark:text-gray-800"
					/>
						<XAxis
							dataKey="label"
							tick={{ fontSize: 10, fill: "currentColor" }}
							className="text-slate-500 dark:text-gray-500"
							axisLine={{ stroke: "currentColor" }}
							tickLine={false}
						/>
						<YAxis
							tick={{ fontSize: 10, fill: "currentColor" }}
							className="text-slate-500 dark:text-gray-500"
							axisLine={false}
							tickLine={false}
							tickFormatter={(v: number) =>
								v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
							}
						width={40}
					/>
					<Tooltip
						contentStyle={tooltipContentStyle}
						formatter={tooltipFormatter}
						labelStyle={tooltipLabelStyle}
					/>
					<Legend
						wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
						iconType="circle"
						iconSize={8}
					/>
					<Line
						type="monotone"
						dataKey="Receita"
						stroke="#10b981"
						strokeWidth={2}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="Despesa"
						stroke="#f87171"
						strokeWidth={2}
						dot={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
