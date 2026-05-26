const BASE = "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
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
  createdAt: string;
  updatedAt: string;
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

export function updateMyProfile(data: { name?: string; email?: string; password?: string }) {
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
