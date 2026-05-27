import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/theme-context";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import Navbar from "./components/navbar";
import LoginPage from "./pages/login";
import HomePage from "./pages/home";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings";
import TransactionsPage from "./pages/transactions";
import RecurringExpensesPage from "./pages/recurring-expenses";
import InstallmentExpensesPage from "./pages/installment-expenses";
import AdminUsersPage from "./pages/admin-users";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem("sidebarOpen") !== "false");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-400 dark:text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div
        className={`transition-all duration-300 md:pt-0 ${
          sidebarOpen ? "md:ml-56" : "md:ml-16"
        } pt-16`}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/transacoes" element={<TransactionsPage />} />
          <Route path="/despesas-fixas" element={<RecurringExpensesPage />} />
          <Route path="/despesas-parceladas" element={<InstallmentExpensesPage />} />
          {user.role === "ADMIN" && <Route path="/admin/usuarios" element={<AdminUsersPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
