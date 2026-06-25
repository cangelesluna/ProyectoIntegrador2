import { Link } from 'react-router-dom';
import { AdminUsers } from './AdminUsers';
import { AdminBanners } from '../components/AdminBanners';
import { AdminCategories } from '../components/AdminCategories';
import { AdminSiteSettings } from '../components/AdminSiteSettings';
import { AdminNews } from '../components/AdminNews';

export function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Panel de administrador</h1>
        <p className="text-slate-600">
          Zona para administrar usuarios, negocios, categorias, productos y contenidos principales.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/admin/negocios"
            className="inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Administrar negocios
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver dashboard
          </Link>
        </div>
      </div>

      <AdminSiteSettings />
      <AdminNews />
      <AdminBanners />
      <AdminCategories />
      <AdminUsers />
    </div>
  );
}
