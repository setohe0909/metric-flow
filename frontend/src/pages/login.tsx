import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Database } from 'lucide-react';
import { useSetupStatus } from '@/features/setup/hooks/use-setup';

export default function Login() {
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const {
    data: setupStatus,
    isLoading: isLoadingSetup,
    isError: isSetupError,
  } = useSetupStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (setupStatus && !setupStatus.initialized) {
      navigate('/setup', { replace: true });
    }
  }, [navigate, setupStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password });
  };

  if (isLoadingSetup || setupStatus?.initialized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)]">
        <Loader2
          aria-label="Comprobando instalación"
          className="h-8 w-8 animate-spin text-[var(--color-ink)]"
        />
      </div>
    );
  }

  if (isSetupError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] px-4">
        <div
          role="alert"
          className="max-w-md rounded-xl border-2 border-[var(--color-ink)] bg-[var(--color-error-surface)] p-5 text-center font-semibold text-[var(--color-ink)]"
        >
          No fue posible consultar el estado de la instalación.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-dots flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-canvas)' }}>

      {/* Logo + título */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5">
          <div
            className="p-2 rounded-xl text-[var(--color-canvas)] flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-ink)',
              border: '2px solid var(--color-ink)',
              boxShadow: '3px 3px 0px 0px var(--color-accent)',
            }}
          >
            <Database className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
            Metric<span style={{ color: 'var(--color-accent)' }}>Flow</span>
          </span>
        </div>

        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-ink)' }}>
          Inicia sesión en tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: 'var(--color-subtle-text)' }}>
          Acceso para usuarios de esta instalación.
        </p>
      </div>

      {/* Card del formulario */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="py-8 px-4 sm:px-10 rounded-2xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-ink)',
            boxShadow: '5px 5px 0px 0px var(--color-ink)',
          }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 text-sm rounded-xl transition-all outline-none"
                style={{
                  color: 'var(--color-ink)',
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: 'none',
                }}
                placeholder="nombre@empresa.com"
                onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px var(--color-accent)')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 text-sm rounded-xl transition-all outline-none"
                style={{
                  color: 'var(--color-ink)',
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: 'none',
                }}
                placeholder="••••••••"
                onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px var(--color-accent)')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>

            {/* Error */}
            {loginError && (
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: 'var(--color-error-surface)',
                  border: '2px solid var(--color-ink)',
                  color: 'var(--color-ink)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                {((loginError as any).response?.data?.message) || 'Error de inicio de sesión. Revisa tus datos.'}
              </div>
            )}

            {/* Botón */}
            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn-retro-primary w-full py-2.5"
              >
                {isLoggingIn ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Iniciar Sesión
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
