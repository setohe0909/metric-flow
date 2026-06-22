import React, { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Link } from 'react-router-dom';
import { LogIn, Loader2, Database } from 'lucide-react';

export default function Login() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password });
  };

  return (
    <div className="min-h-screen bg-grid-dots flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#eeefe9' }}>

      {/* Logo + título */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5">
          <div
            className="p-2 rounded-xl text-white flex items-center justify-center"
            style={{
              backgroundColor: '#23251d',
              border: '2px solid #23251d',
              boxShadow: '3px 3px 0px 0px #f7a501',
            }}
          >
            <Database className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: '#23251d' }}>
            Metric<span style={{ color: '#f7a501' }}>Flow</span>
          </span>
        </div>

        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight" style={{ color: '#23251d' }}>
          Inicia sesión en tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: '#6b6e62' }}>
          ¿No tienes cuenta?{' '}
          <Link
            to="/signup"
            className="font-semibold underline underline-offset-2 transition-colors"
            style={{ color: '#23251d' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f7a501')}
            onMouseLeave={e => (e.currentTarget.style.color = '#23251d')}
          >
            Crea una cuenta gratis
          </Link>
        </p>
      </div>

      {/* Card del formulario */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="py-8 px-4 sm:px-10 rounded-2xl"
          style={{
            backgroundColor: '#f4f4f0',
            border: '2px solid #23251d',
            boxShadow: '5px 5px 0px 0px #23251d',
          }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1" style={{ color: '#23251d' }}>
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
                  color: '#23251d',
                  backgroundColor: '#eeefe9',
                  border: '2px solid #23251d',
                  boxShadow: 'none',
                }}
                placeholder="nombre@empresa.com"
                onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px #f7a501')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1" style={{ color: '#23251d' }}>
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
                  color: '#23251d',
                  backgroundColor: '#eeefe9',
                  border: '2px solid #23251d',
                  boxShadow: 'none',
                }}
                placeholder="••••••••"
                onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px #f7a501')}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>

            {/* Error */}
            {loginError && (
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: '#ffdada',
                  border: '2px solid #23251d',
                  color: '#23251d',
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
