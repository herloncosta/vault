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

export function updateUser(id: string, data: { name?: string; email?: string }) {
  return request<User>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
