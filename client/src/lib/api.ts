const BASE = "";

let refreshPromise: Promise<boolean> | null = null;
let onUnauthorized: (() => void) | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function doFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; body: T | undefined; message: string }> {
  try {
    const res = await fetch(`${BASE}${url}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });

    if (res.ok) {
      if (res.status === 204) return { ok: true, status: 204, body: undefined, message: "" };
      return { ok: true, status: 200, body: await res.json(), message: "" };
    }

    const body = await res.json().catch(() => ({ error: res.statusText }));
    const message = Array.isArray(body.error)
      ? body.error.map((e: any) => e.message ?? e).join(". ")
      : (body.error || "Request failed");

    return { ok: false, status: res.status, body: undefined, message };
  } catch {
    return { ok: false, status: 0, body: undefined, message: "Erro de conexão" };
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const result = await doFetch<T>(url, options);

  if (result.ok) return result.body as T;

  if (result.status === 401) {
    if (!refreshPromise) refreshPromise = refreshTokens();
    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      const retry = await doFetch<T>(url, options);
      if (retry.ok) return retry.body as T;
    }

    onUnauthorized?.();
    throw new Error("Sessão expirada");
  }

  throw new Error(result.message);
}

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  monthlyBudget?: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  user: User;
}

export function login(data: LoginPayload) {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}

export function getMe() {
  return request<User>("/api/auth/me");
}

export function listUsers() {
  return request<User[]>("/api/users");
}

export function getUser(id: string) {
  return request<User>(`/api/users/${id}`);
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name?: string;
  role?: "ADMIN" | "OPERATOR";
}

export function createUser(data: CreateUserPayload) {
  return request<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: "ADMIN" | "OPERATOR";
  password?: string;
}

export function updateUser(id: string, data: UpdateUserPayload) {
  return request<User>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string) {
  return request<void>(`/api/users/${id}`, { method: "DELETE" });
}

export interface Transaction {
  id: string;
  userId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  date: string;
  paymentMethod: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  source: "transaction" | "installment" | "recurring";
  sourceId: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  createdAt: string;
  updatedAt: string | null;
  user?: { id: string; email: string; name: string | null };
}

export interface TransactionListResult {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function listTransactions(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return request<TransactionListResult>(`/api/transactions${qs}`);
}

export function getTransaction(id: string) {
  return request<Transaction>(`/api/transactions/${id}`);
}

export interface CreateTransactionPayload {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category?: string;
  date: string;
  paymentMethod?: string;
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
}

export function createTransaction(data: CreateTransactionPayload) {
  return request<Transaction>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTransaction(id: string, data: Partial<CreateTransactionPayload>) {
  return request<Transaction>(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTransaction(id: string) {
  return request<void>(`/api/transactions/${id}`, { method: "DELETE" });
}

export function updateMyProfile(data: { name?: string; email?: string; currentPassword?: string; password?: string }) {
  return request<User>("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateBudget(monthlyBudget: number) {
  return request<User>("/api/auth/me/budget", {
    method: "PATCH",
    body: JSON.stringify({ monthlyBudget }),
  });
}

export interface RecurringExpense {
  id: string;
  userId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  paymentMethod: string | null;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; name: string | null };
}

export interface RecurringExpenseListResult {
  data: RecurringExpense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateRecurringExpensePayload {
  type?: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category?: string;
  paymentMethod?: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

export function listRecurringExpenses(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return request<RecurringExpenseListResult>(`/api/recurring-expenses${qs}`);
}

export function getRecurringExpense(id: string) {
  return request<RecurringExpense>(`/api/recurring-expenses/${id}`);
}

export function createRecurringExpense(data: CreateRecurringExpensePayload) {
  return request<RecurringExpense>("/api/recurring-expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRecurringExpense(id: string, data: Partial<CreateRecurringExpensePayload & { active: boolean }>) {
  return request<RecurringExpense>(`/api/recurring-expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteRecurringExpense(id: string) {
  return request<void>(`/api/recurring-expenses/${id}`, { method: "DELETE" });
}

export interface Installment {
  id: string;
  installmentExpenseId: string;
  amount: number;
  installmentNumber: number;
  dueDate: string;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
}

export interface InstallmentExpense {
  id: string;
  userId: string;
  description: string;
  totalAmount: number;
  installmentCount: number;
  type: "CREDIT_CARD" | "CARNE";
  category: string | null;
  firstDueDate: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; name: string | null };
  installments: Installment[];
}

export interface InstallmentExpenseListResult {
  data: InstallmentExpense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateInstallmentExpensePayload {
  description: string;
  totalAmount: number;
  installmentCount: number;
  type: "CREDIT_CARD" | "CARNE";
  category?: string;
  firstDueDate: string;
}

export function listInstallmentExpenses(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return request<InstallmentExpenseListResult>(`/api/installment-expenses${qs}`);
}

export function getInstallmentExpense(id: string) {
  return request<InstallmentExpense>(`/api/installment-expenses/${id}`);
}

export function createInstallmentExpense(data: CreateInstallmentExpensePayload) {
  return request<InstallmentExpense>("/api/installment-expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateInstallmentExpense(id: string, data: Partial<CreateInstallmentExpensePayload>) {
  return request<InstallmentExpense>(`/api/installment-expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteInstallmentExpense(id: string) {
  return request<void>(`/api/installment-expenses/${id}`, { method: "DELETE" });
}

export function updateInstallmentPaid(installmentId: string, paid: boolean) {
  return request<Installment>(`/api/installment-expenses/installments/${installmentId}/paid`, {
    method: "PATCH",
    body: JSON.stringify({ paid }),
  });
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  createdAt: string;
  updatedAt: string;
}

export function listCategories(type?: string) {
  const qs = type ? `?type=${type}` : "";
  return request<Category[]>(`/api/categories${qs}`);
}

export function createCategory(data: { name: string; type: "INCOME" | "EXPENSE" }) {
  return request<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: string, data: { name: string }) {
  return request<Category>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: string) {
  return request<void>(`/api/categories/${id}`, { method: "DELETE" });
}
