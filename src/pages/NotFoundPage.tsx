import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <p className="text-sm uppercase tracking-[0.24em] text-brand-500">404 Error</p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-900">Página no encontrada</h1>
      <p className="mt-4 text-slate-600">Lo sentimos, no pudimos encontrar la página que buscas.</p>
      <Link to="/" className="mt-8 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500">
        Volver al inicio
      </Link>
    </div>
  );
}
