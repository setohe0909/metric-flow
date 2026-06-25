import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOrgStore } from '@/store/use-org-store';

export default function ChangePassword() {
  const {
    user,
    changePassword,
    isChangingPassword,
    changePasswordError,
  } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const token = useOrgStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eeefe9]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user.mustChangePassword) {
    return <Navigate to="/dashboards" replace />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    changePassword({ currentPassword, newPassword });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#eeefe9] px-4">
      <section className="w-full max-w-md rounded-2xl border-2 border-[#23251d] bg-white p-8 shadow-[6px_6px_0_0_#23251d]">
        <KeyRound className="mx-auto mb-4 h-10 w-10 text-[#f7a501]" />
        <h1 className="text-center text-2xl font-extrabold text-[#23251d]">
          Cambia tu contraseña
        </h1>
        <p className="mt-2 text-center text-sm text-[#4d4f46]">
          La contraseña temporal debe reemplazarse antes de continuar.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <PasswordInput
            id="currentPassword"
            label="Contraseña temporal"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordInput
            id="newPassword"
            label="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
            minLength={8}
          />
          {changePasswordError && (
            <div role="alert" className="rounded-xl border-2 border-[#23251d] bg-red-100 p-3 text-sm">
              {(changePasswordError as { response?: { data?: { message?: string } } })
                .response?.data?.message ?? 'No fue posible cambiar la contraseña.'}
            </div>
          )}
          <button
            type="submit"
            disabled={isChangingPassword}
            className="btn-retro-primary w-full justify-center"
          >
            {isChangingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Guardar nueva contraseña'
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type="password"
        required
        minLength={minLength}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border-2 border-[#23251d] bg-[#eeefe9] px-3 py-2"
      />
    </div>
  );
}
