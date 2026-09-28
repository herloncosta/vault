import type {
	Transaction,
	TransactionsSummary,
	Category,
	User,
	InstallmentExpense,
} from "./src/lib/api";

const cats = [
	{ id: "c1", userId: "user-1", name: "Alimentação", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c2", userId: "user-1", name: "Transporte", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c3", userId: "user-1", name: "Moradia", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c4", userId: "user-1", name: "Compras", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c5", userId: "user-1", name: "Saúde", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c6", userId: "user-1", name: "Educação", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c7", userId: "user-1", name: "Lazer", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c8", userId: "user-1", name: "Viagem", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
	{ id: "c9", userId: "user-1", name: "Salário", type: "INCOME" as const, createdAt: "", updatedAt: "" },
	{ id: "c10", userId: "user-1", name: "Freelance", type: "INCOME" as const, createdAt: "", updatedAt: "" },
	{ id: "c11", userId: "user-1", name: "Outro", type: "EXPENSE" as const, createdAt: "", updatedAt: "" },
];

const incomeCats = ["Salário", "Freelance"];
const expenseCats = [
	"Alimentação",
	"Transporte",
	"Moradia",
	"Compras",
	"Saúde",
	"Educação",
	"Lazer",
	"Viagem",
	"Outro",
];
const methods = ["Crédito", "Débito", "Boleto", "PIX", "Dinheiro", "Automático"];
const sources: Transaction["source"][] = ["transaction", "recurring", "installment"];

function randInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]) {
	return arr[randInt(0, arr.length - 1)];
}
function randomDate(daysBack: number): string {
	const d = new Date();
	d.setHours(randInt(6, 23), randInt(0, 59), randInt(0, 59));
	d.setDate(d.getDate() - randInt(0, daysBack));
	return d.toISOString();
}

function buildTransactions(): Transaction[] {
	const txs: Transaction[] = [];
	const incomeCount = randInt(18, 28);
	const expenseCount = randInt(35, 55);

	for (let i = 0; i < incomeCount; i++) {
		const source = pick(sources);
		txs.push({
			id: `tx-inc-${i}`,
			userId: "user-1",
			type: "INCOME",
			amount: randInt(2000, 12000) + Math.random() * 1000,
			description: pick([
				"Salário mensal",
				"Freelance projeto web",
				"Freelance consultoria",
				"Rendimento investimento",
				"Bônus trimestral",
			]),
			category: pick(incomeCats),
			date: randomDate(180),
			paymentMethod: pick(methods),
			status: "COMPLETED",
			source,
			sourceId: source === "transaction" ? null : `src-${i}`,
			installmentNumber: null,
			installmentCount: null,
			createdAt: randomDate(180),
			updatedAt: null,
		});
	}

	for (let i = 0; i < expenseCount; i++) {
		const source = pick(sources);
		txs.push({
			id: `tx-exp-${i}`,
			userId: "user-1",
			type: "EXPENSE",
			amount: randInt(15, 800) + Math.random() * 200,
			description: pick([
				"Supermercado",
				"Uber",
				"Aluguel",
				"Internet",
				"Academia",
				"Farmácia",
				"Restaurante",
				"Combustível",
				"Material escolar",
				"Planos de saúde",
				"Viagem",
				"Eletrônicos",
			]),
			category: pick(expenseCats),
			date: randomDate(180),
			paymentMethod: pick(methods),
			status: "COMPLETED",
			source,
			sourceId: source === "transaction" ? null : `src-${incomeCount + i}`,
			installmentNumber: null,
			installmentCount: null,
			createdAt: randomDate(180),
			updatedAt: null,
		});
	}

	txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return txs;
}

const allTransactions = buildTransactions();

function buildSummary(): TransactionsSummary {
	const now = new Date();
	const current = allTransactions.filter((t) => {
		const d = new Date(t.date);
		return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
	});
	const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
	const previous = allTransactions.filter((t) => {
		const d = new Date(t.date);
		return d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear();
	});

	const sum = (txs: Transaction[]) => ({
		income: Number(txs.filter((t) => t.type === "INCOME").reduce((a, t) => a + t.amount, 0).toFixed(2)),
		expense: Number(txs.filter((t) => t.type === "EXPENSE").reduce((a, t) => a + t.amount, 0).toFixed(2)),
		balance: 0,
	});

	return {
		month: now.toISOString(),
		current: sum(current),
		previous: sum(previous),
	};
}

function buildCategories(): Category[] {
	return cats;
}

function buildUser(): User {
	return {
		id: "user-1",
		email: "user@example.com",
		name: "Usuário Mock",
		role: "ADMIN",
		monthlyBudget: "5000",
		createdAt: new Date().toISOString(),
	};
}

function buildInstallments(): InstallmentExpense[] {
	const plans: Omit<InstallmentExpense, "installments">[] = [
		{ id: "ie-1", userId: "user-1", description: "Notebook Dell", totalAmount: 4800, installmentCount: 12, type: "CREDIT_CARD", category: "Compras", firstDueDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: "ie-2", userId: "user-1", description: "Curso online", totalAmount: 1200, installmentCount: 6, type: "CARNE", category: "Educação", firstDueDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: "ie-3", userId: "user-1", description: "Celular", totalAmount: 3600, installmentCount: 12, type: "CREDIT_CARD", category: "Compras", firstDueDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	];

	return plans.map((plan) => ({
		...plan,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		installments: Array.from({ length: plan.installmentCount }, (_, i) => ({
			id: `inst-${plan.id}-${i}`,
			installmentExpenseId: plan.id,
			amount: Number((plan.totalAmount / plan.installmentCount).toFixed(2)),
			installmentNumber: i + 1,
			dueDate: new Date(
				new Date(plan.firstDueDate).getFullYear(),
				new Date(plan.firstDueDate).getMonth() + i,
				new Date(plan.firstDueDate).getDate(),
			).toISOString(),
			paid: i < randInt(1, 3),
			paidAt: i < randInt(1, 3) ? new Date().toISOString() : null,
			createdAt: new Date().toISOString(),
		})),
	}));
}

const transactions = allTransactions;
const summary = buildSummary();
const categories = buildCategories();
const user = buildUser();
const installmentExpenses = buildInstallments();

function readBody(req: { on: (e: string, cb: (...args: any[]) => void) => void }): Promise<unknown> {
	return new Promise((resolve) => {
		let d = "";
		req.on("data", (c: Buffer) => { d += c.toString(); });
		req.on("end", () => resolve(d ? JSON.parse(d) : {}));
	});
}

function send(res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, status: number, body: unknown) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(body));
}

export function handleMock(req: { url?: string; method?: string; on: (e: string, cb: (...args: any[]) => void) => void }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }): boolean {
	const url = new URL(req.url ?? "http://localhost");
	const path = url.pathname;
	const method = req.method ?? "GET";

	if (path === "/api/transactions" && method === "GET") {
		const limit = Number(url.searchParams.get("limit") ?? "1000");
		const data = transactions.slice(0, limit);
		send(res, 200, { data, total: data.length, page: 1, limit, totalPages: 1 });
		return true;
	}

	if (path === "/api/transactions/summary" && method === "GET") {
		send(res, 200, summary);
		return true;
	}

	if (path === "/api/categories" && method === "GET") {
		const type = url.searchParams.get("type") ?? undefined;
		const data = type ? categories.filter((c) => c.type === type) : categories;
		send(res, 200, data);
		return true;
	}

	if (path === "/api/auth/me" && method === "GET") {
		send(res, 200, user);
		return true;
	}

	if (path === "/api/installment-expenses" && method === "GET") {
		const limit = Number(url.searchParams.get("limit") ?? "100");
		const data = installmentExpenses.slice(0, limit);
		send(res, 200, { data, total: data.length, page: 1, limit, totalPages: 1 });
		return true;
	}

	if (path === "/api/transactions" && method === "POST") {
		readBody(req).then((body) => {
			const b = body as Partial<Transaction>;
			const tx = {
				id: `tx-mock-${Date.now()}`,
				userId: "user-1",
				type: b.type ?? "EXPENSE",
				amount: b.amount ?? 0,
				description: b.description ?? "",
				category: b.category ?? null,
				date: b.date ?? new Date().toISOString(),
				paymentMethod: b.paymentMethod ?? null,
				status: "COMPLETED",
				source: "transaction",
				sourceId: null,
				installmentNumber: null,
				installmentCount: null,
				createdAt: new Date().toISOString(),
				updatedAt: null,
			};
			send(res, 201, tx);
		});
		return true;
	}

	if (path === "/api/auth/refresh" && method === "POST") {
		send(res, 200, { ok: true });
		return true;
	}

	return false;
}
