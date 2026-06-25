import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, signInWithGoogle, sendPasswordReset, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      await signIn(email, password);
    } catch (err) {
      setError('No se pudo iniciar sesión. Revisa tus credenciales.');
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('No se pudo iniciar sesión con Google.');
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Ingresa tu correo para restablecer la contraseña.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError('Error al enviar el correo de recuperación.');
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Iniciar sesión</h1>
      <p className="mt-2 text-slate-600">Accede como administrador o propietario de negocio.</p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {resetSent && <p className="text-sm text-emerald-600">Correo de recuperación enviado.</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        <button onClick={handleGoogle} className="w-full rounded-2xl border px-4 py-3 text-sm">
          Iniciar con Google
        </button>
        <div className="flex items-center justify-between">
          <button onClick={handleReset} className="text-sm text-brand-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
}
