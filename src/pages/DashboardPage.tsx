import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sampleCategories } from '../data/sampleData';
import { zoneLabel } from '../data/zones';
import type { AnalyticsEvent, Business, Category, Product, Promotion, Statistic } from '../types';

type DateFilter = 'all' | 'today' | 'week' | 'month';

function categoryIdsForBusiness(business: Business) {
  return business.categoryIds?.length ? business.categoryIds : [business.categoryId].filter(Boolean);
}

function isInsideDateFilter(value: string | undefined, filter: DateFilter) {
  if (filter === 'all' || !value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 1000 * 60 * 60 * 24;

  if (filter === 'today') return date.toDateString() === now.toDateString();
  if (filter === 'week') return diff <= day * 7;
  if (filter === 'month') return diff <= day * 30;
  return true;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BarChart({ items }: { items: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="grid gap-2 sm:grid-cols-[220px_1fr_48px] sm:items-center">
          <p className="text-sm font-medium text-slate-700">{item.label}</p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${Math.max(4, (item.value / maxValue) * 100)}%` }}
            />
          </div>
          <p className="text-right text-sm font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [statistics, setStatistics] = useState<Array<Statistic & { id?: string }>>([]);
  const [analytics, setAnalytics] = useState<Array<AnalyticsEvent & { id?: string }>>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    const unsubBusinesses = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setBusinesses(snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Business, 'id'>) })));
    });
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Category, 'id'>) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setCategories(list.length > 0 ? list : sampleCategories);
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Product, 'id'>) })));
    });
    const unsubPromotions = onSnapshot(collection(db, 'promotions'), (snapshot) => {
      setPromotions(snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Promotion, 'id'>) })));
    });
    const unsubStats = onSnapshot(collection(db, 'statistics'), (snapshot) => {
      setStatistics(snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Statistic) })));
    });
    const unsubAnalytics = onSnapshot(collection(db, 'analytics'), (snapshot) => {
      setAnalytics(snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<AnalyticsEvent, 'id'>) })));
    });

    return () => {
      unsubBusinesses();
      unsubCategories();
      unsubProducts();
      unsubPromotions();
      unsubStats();
      unsubAnalytics();
    };
  }, []);

  const visibleBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesCategory = categoryFilter === 'all' || categoryIdsForBusiness(business).includes(categoryFilter);
      const matchesDate = isInsideDateFilter(business.createdAt, dateFilter);
      return matchesCategory && matchesDate;
    });
  }, [businesses, categoryFilter, dateFilter]);

  const visibleBusinessIds = useMemo(() => new Set(visibleBusinesses.map((business) => business.id)), [visibleBusinesses]);
  const visibleStats = statistics.filter((stat) => visibleBusinessIds.has(stat.businessId));
  const visibleProducts = products.filter((product) => visibleBusinessIds.has(product.businessId));
  const visiblePromotions = promotions.filter((promotion) => visibleBusinessIds.has(promotion.businessId));
  const visibleAnalytics = analytics.filter((event) => isInsideDateFilter(event.createdAt, dateFilter));

  const totals = {
    businesses: visibleBusinesses.length,
    published: visibleBusinesses.filter((business) => business.published).length,
    pending: visibleBusinesses.filter((business) => business.reviewStatus === 'pending').length,
    products: visibleProducts.length,
    promotions: visiblePromotions.length,
    visits: visibleStats.reduce((sum, stat) => sum + (stat.views ?? 0), 0),
    whatsapp: visibleStats.reduce((sum, stat) => sum + (stat.whatsappClicks ?? 0), 0),
    calls: visibleStats.reduce((sum, stat) => sum + (stat.callClicks ?? 0), 0),
    emails: visibleStats.reduce((sum, stat) => sum + (stat.emailClicks ?? 0), 0),
    socials: visibleStats.reduce((sum, stat) => sum + (stat.socialClicks ?? 0), 0),
    searches: visibleAnalytics.filter((event) => event.type === 'search').length,
  };
  const conversion = totals.visits > 0 ? Math.round((totals.whatsapp / totals.visits) * 100) : 0;

  const businessesByCategory = categories.map((category) => ({
    label: category.name,
    value: visibleBusinesses.filter((business) => categoryIdsForBusiness(business).includes(category.id)).length,
  }));

  const interactionChart = [
    { label: 'WhatsApp', value: totals.whatsapp },
    { label: 'Llamadas', value: totals.calls },
    { label: 'Correos', value: totals.emails },
    { label: 'Redes sociales', value: totals.socials },
  ];

  const topBusinesses = visibleBusinesses
    .map((business) => {
      const stats = statistics.find((stat) => stat.businessId === business.id);
      return { label: business.name, value: stats?.views ?? 0 };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const pendingBusinesses = businesses
    .filter((business) => business.reviewStatus === 'pending' || !business.published)
    .sort((a, b) => (b.lastOwnerUpdateAt || b.createdAt || '').localeCompare(a.lastOwnerUpdateAt || a.createdAt || ''))
    .slice(0, 8);

  const searchTerms = Object.entries(
    visibleAnalytics
      .filter((event) => event.type === 'search' && event.term)
      .reduce<Record<string, number>>((acc, event) => {
        const term = event.term?.toLowerCase().trim() || '';
        if (term) acc[term] = (acc[term] ?? 0) + 1;
        return acc;
      }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const categoryViews = categories.map((category) => ({
    label: category.name,
    value: visibleAnalytics.filter((event) => event.type === 'category_view' && event.categoryId === category.id).length,
  }));

  const businessesByZone = Object.entries(
    visibleBusinesses.reduce<Record<string, number>>((acc, business) => {
      const label = zoneLabel(business.zoneId);
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const peakHours = Object.entries(
    visibleStats.reduce<Record<string, number>>((acc, stat) => {
      if (!stat.lastVisitAt) return acc;
      const hour = new Date(stat.lastVisitAt).getHours();
      const label = `${String(hour).padStart(2, '0')}:00`;
      acc[label] = (acc[label] ?? 0) + (stat.views ?? 0);
      return acc;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const recentActivity = [
    ...businesses.map((business) => ({
      label: `Negocio: ${business.name}`,
      date: business.lastOwnerUpdateAt || business.createdAt,
      detail: business.published ? 'Publicado' : business.reviewStatus === 'pending' ? 'Pendiente de revision' : 'No publicado',
    })),
    ...promotions.map((promotion) => ({
      label: `Promocion: ${promotion.title}`,
      date: promotion.startDate,
      detail: promotion.businessId,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Dashboard administrativo</h1>
            <p className="mt-2 text-slate-600">
              Datos actualizados automaticamente desde negocios, categorias, productos, promociones e interacciones.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="all">Todas las categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="week">Ultimos 7 dias</option>
              <option value="month">Ultimos 30 dias</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Negocios" value={totals.businesses} />
        <MetricCard label="Publicados" value={totals.published} />
        <MetricCard label="Por revisar" value={totals.pending} />
        <MetricCard label="Productos" value={totals.products} />
        <MetricCard label="Promociones" value={totals.promotions} />
        <MetricCard label="Visitas" value={totals.visits} />
        <MetricCard label="WhatsApp" value={totals.whatsapp} />
        <MetricCard label="Llamadas" value={totals.calls} />
        <MetricCard label="Correos" value={totals.emails} />
        <MetricCard label="Redes" value={totals.socials} />
        <MetricCard label="Busquedas" value={totals.searches} />
        <MetricCard label="Conversion WhatsApp (%)" value={conversion} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Negocios por categoria</h2>
          <div className="mt-6">
            <BarChart items={businessesByCategory} />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Interacciones</h2>
          <div className="mt-6">
            <BarChart items={interactionChart} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Negocios con mas visitas</h2>
        <div className="mt-6">
          <BarChart items={topBusinesses.length > 0 ? topBusinesses : [{ label: 'Sin visitas registradas', value: 0 }]} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Busquedas mas usadas</h2>
          <div className="mt-6">
            <BarChart items={searchTerms.length > 0 ? searchTerms : [{ label: 'Sin busquedas registradas', value: 0 }]} />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Categorias mas visitadas</h2>
          <div className="mt-6">
            <BarChart items={categoryViews} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Zonas con mas negocios</h2>
          <div className="mt-6">
            <BarChart items={businessesByZone.length > 0 ? businessesByZone : [{ label: 'Sin negocios', value: 0 }]} />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Horarios de mayor trafico</h2>
          <div className="mt-6">
            <BarChart items={peakHours.length > 0 ? peakHours : [{ label: 'Sin visitas', value: 0 }]} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Negocios pendientes de revision</h2>
          <div className="mt-5 space-y-3">
            {pendingBusinesses.length > 0 ? pendingBusinesses.map((business) => (
              <div key={business.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{business.name}</p>
                <p className="mt-1 text-sm text-slate-500">{business.published ? 'Publicado' : business.reviewStatus === 'pending' ? 'Pendiente de revision' : 'No publicado'}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No hay negocios pendientes.</p>}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Actividad reciente</h2>
          <div className="mt-5 space-y-3">
            {recentActivity.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail} · {new Date(item.date).toLocaleDateString('es-PE')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
