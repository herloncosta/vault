import { useAuth } from "../contexts/auth-context";
import { User, Shield, Mail } from "lucide-react";
import ProfileEditor from "../components/profile-editor";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
          <User size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Perfil</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Gerencie suas informações pessoais
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <dl className="space-y-5 text-sm">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-slate-400 dark:text-gray-500" />
            <div>
              <dt className="text-xs text-slate-500 dark:text-gray-400">Email</dt>
              <dd className="text-slate-900 dark:text-gray-100">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-slate-400 dark:text-gray-500" />
            <div>
              <dt className="text-xs text-slate-500 dark:text-gray-400">Permissão</dt>
              <dd className="text-slate-900 dark:text-gray-100">{user.role}</dd>
            </div>
          </div>
        </dl>
      </div>

      <ProfileEditor />
    </main>
  );
}
