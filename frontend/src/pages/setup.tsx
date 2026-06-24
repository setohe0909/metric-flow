import { useEffect, useState, type FormEvent } from 'react';
import { Database, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBootstrap, useSetupStatus } from '@/features/setup/hooks/use-setup';

export default function Setup() {
  const navigate = useNavigate();
  const {
    data: status,
    isLoading: isLoadingStatus,
    isError: isStatusError,
  } = useSetupStatus();
  const bootstrap = useBootstrap();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  useEffect(() => {
    if (status?.initialized) {
      navigate('/login', { replace: true });
    }
  }, [navigate, status]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    bootstrap.mutate({
      email,
      password,
      firstName,
      lastName,
      organizationName,
    });
  };

  if (isLoadingStatus || status?.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eeefe9]">
        <Loader2
          aria-label="Comprobando instalación"
          className="h-8 w-8 animate-spin text-[#23251d]"
        />
      </div>
    );
  }

  if (isStatusError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeefe9] px-4">
        <div
          role="alert"
          className="max-w-md rounded-xl border-2 border-[#23251d] bg-red-100 p-5 text-center font-semibold text-[#23251d]"
        >
          No fue posible consultar el estado de la instalación. Verifica que el
          backend esté disponible.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-grid-dots flex items-center justify-center px-4 py-12 bg-[#eeefe9]">
      <section
        className="w-full max-w-xl rounded-2xl border-2 border-[#23251d] bg-[#f4f4f0] p-8"
        style={{ boxShadow: '6px 6px 0 0 #23251d' }}
      >
        <header className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#23251d] bg-[#f7a501]">
            <Database aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#23251d]">
            Configurar MetricFlow
          </h1>
          <p className="mt-2 text-sm text-[#6b6e62]">
            Crea la organización y el primer administrador de esta instalación.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SetupInput
              id="firstName"
              label="Nombre"
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
            />
            <SetupInput
              id="lastName"
              label="Apellido"
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
            />
          </div>
          <SetupInput
            id="organizationName"
            label="Organización"
            value={organizationName}
            onChange={setOrganizationName}
            autoComplete="organization"
          />
          <SetupInput
            id="email"
            label="Correo del administrador"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <SetupInput
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
          />

          {bootstrap.error && (
            <div
              role="alert"
              className="rounded-xl border-2 border-[#23251d] bg-red-100 p-3 text-sm font-semibold text-[#23251d]"
            >
              {(bootstrap.error as { response?: { data?: { message?: string } } })
                .response?.data?.message ??
                'No fue posible configurar la instalación.'}
            </div>
          )}

          <button
            type="submit"
            disabled={bootstrap.isPending}
            className="btn-retro-primary w-full justify-center py-3"
          >
            {bootstrap.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Crear instalación
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

interface SetupInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  minLength?: number;
}

function SetupInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  minLength,
}: SetupInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-semibold text-[#23251d]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-xl border-2 border-[#23251d] bg-[#eeefe9] px-3 py-2 text-sm text-[#23251d] outline-none focus:shadow-[3px_3px_0_0_#f7a501]"
      />
    </div>
  );
}
