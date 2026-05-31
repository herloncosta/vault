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
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
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
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

export default function HomePage() {
	const { user, refreshUser } = useAuth();
	const [transactions, setTransactions] = useState<api.Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingBudget, setEditingBudget] = useState(false);
	const [budgetInput, setBudgetInput] = useState("");
	const [budgetSubmitting, setBudgetSubmitting] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [modalType, setModalType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

	function fetchTransactions() {
		api
			.listTransactions({ limit: "1000" })
			.then((res) => setTransactions(res.data))
			.catch(() => setTransactions([]))
			.finally(() => setLoading(false));
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

	const monthIncome = monthTransactions
		.filter((t) => t.type === "INCOME")
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const monthExpense = monthTransactions
		.filter((t) => t.type === "EXPENSE")
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const recentTransactions = transactions.slice(0, 5);

	const budgetLimit = user?.monthlyBudget ? Number(user.monthlyBudget) : 5000;
	const budgetPercent = Math.min(
		100,
		Math.round((monthExpense / budgetLimit) * 100),
	);

	async function handleSaveBudget() {
		const value = Number.parseFloat(budgetInput.replace(",", "."));
		if (Number.isNaN(value) || value <= 0) return;
		setBudgetSubmitting(true);
		try {
			await api.updateBudget(value);
			await refreshUser();
			setEditingBudget(false);
		} catch {
			// silently fail
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
						<path d="M5 12h14" />
						<path d="M12 5v14" />
					</svg>
					<span className="hidden md:inline">Nova transação</span>
				</button>
			</div>

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
						label: "Saldo mensal",
						amount: formatCurrency(monthIncome - monthExpense),
						icon: Wallet,
						color:
							monthIncome - monthExpense >= 0
								? "text-emerald-500 dark:text-emerald-400"
								: "text-red-400",
						bg: "bg-violet-50 dark:bg-violet-900/20",
					},
				].map(({ label, amount, icon: Icon, color, bg }) => (
					<div
						key={label}
						className="rounded-md border border-slate-200 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
					>
						<div className="mb-4 flex items-center justify-between">
							<span className="text-xs font-medium text-slate-500 dark:text-gray-400">
								{label}
							</span>
							<div className={`rounded-lg p-2 ${bg}`}>
								<Icon size={16} className={color} />
							</div>
						</div>
						<p
							className={`text-lg font-bold ${label === "Saldo mensal" ? color : "text-slate-900 dark:text-gray-100"}`}
						>
							{amount}
						</p>
					</div>
				))}
			</div>

			<div className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-600/20 dark:from-blue-700 dark:to-violet-700">
				<div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
				<div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
				<p className="relative text-xs font-medium tracking-widest text-white/70 uppercase">
					Saldo total
				</p>
				<p className="relative mt-2 text-3xl font-bold tracking-tight">
					{formatCurrency(balance)}
				</p>
				<div className="relative mt-4 flex items-center gap-2 text-sm text-white/70">
					<TrendingUp size={16} className="text-emerald-300" />
					<span className="text-emerald-300">
						{totalIncome > 0
							? `+${((monthIncome / (totalIncome / 12)) * 100 - 100).toFixed(1)}%`
							: "0.0%"}
					</span>
					<span>este mês</span>
				</div>
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

			<div className="mb-8">
				<h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
					Transações recentes
				</h2>
				<div className="rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
					{recentTransactions.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-10">
							<ArrowDownToLine
								size={28}
								className="text-slate-300 dark:text-gray-600"
							/>
							<p className="text-sm text-slate-400 dark:text-gray-500">
								Nenhuma transação ainda
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
										<p className="text-xs text-slate-400 dark:text-gray-500">
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

			<div>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
						Limite mensal
					</h2>
					{!editingBudget && (
						<button
							onClick={() => {
								setBudgetInput(String(budgetLimit));
								setEditingBudget(true);
							}}
							className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-all duration-300 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
						>
							<Pencil size={12} />
							Alterar
						</button>
					)}
				</div>
				<div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
					{editingBudget ? (
						<div>
							<label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-gray-400">
								Novo limite mensal
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									inputMode="decimal"
									value={budgetInput}
									onChange={(e) => setBudgetInput(e.target.value)}
									placeholder="5000"
									className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-blue-400"
								/>
								<button
									onClick={handleSaveBudget}
									disabled={budgetSubmitting}
									className="flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 text-white transition-all duration-300 hover:bg-blue-700 disabled:opacity-60"
								>
									<Check size={16} />
								</button>
								<button
									onClick={() => setEditingBudget(false)}
									disabled={budgetSubmitting}
									className="flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-slate-400 transition-all duration-300 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700"
								>
									<X size={16} />
								</button>
							</div>
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
							<p className="mt-2 text-xs text-slate-400 dark:text-gray-500">
								{budgetPercent}% do limite utilizado
							</p>
						</>
					)}
				</div>
			</div>
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

function MonthlyChart({ transactions }: { transactions: api.Transaction[] }) {
	const now = new Date();

	const monthlyData = Array.from({ length: 12 }, (_, i) => {
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
		<div className="rounded-md border border-slate-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
			<ResponsiveContainer width="100%" height={260}>
				<BarChart
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
						className="text-slate-400 dark:text-gray-500"
						axisLine={{ stroke: "currentColor" }}
						tickLine={false}
						interval={0}
						angle={-30}
						textAnchor="end"
						height={36}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "currentColor" }}
						className="text-slate-400 dark:text-gray-500"
						axisLine={false}
						tickLine={false}
						tickFormatter={(v: number) =>
							v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
						}
						width={40}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "var(--tooltip-bg, #fff)",
							border: "1px solid var(--tooltip-border, #e2e8f0)",
							borderRadius: "12px",
							fontSize: "12px",
							boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
						}}
						formatter={(value) => [formatCurrency(Number(value) || 0)]}
						labelStyle={{ fontWeight: 600, marginBottom: 4 }}
					/>
					<Legend
						wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
						iconType="circle"
						iconSize={8}
					/>
					<Bar
						dataKey="Receita"
						radius={[4, 4, 0, 0]}
						maxBarSize={14}
						fill="#10b981"
					/>
					<Bar
						dataKey="Despesa"
						radius={[4, 4, 0, 0]}
						maxBarSize={14}
						fill="#f87171"
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
