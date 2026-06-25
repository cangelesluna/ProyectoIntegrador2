import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, MapPin, Search } from 'lucide-react';
import { addDoc, collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SearchBar } from '../components/SearchBar';
import { CategoryCard } from '../components/CategoryCard';
import { BusinessCard } from '../components/BusinessCard';
import { sampleBanners, sampleCategories } from '../data/sampleData';
import { defaultSiteSettings } from '../data/siteSettings';
import { sjlZones } from '../data/zones';
import { NewsletterSubscribe } from '../components/NewsletterSubscribe';
import type { Banner, Business, Category, NewsPost, Product, Promotion, SiteSettings, Statistic } from '../types';

type SearchSort = 'recent' | 'visited' | 'featured';

function businessCategoryIds(business: Business) {
  return business.categoryIds?.length ? business.categoryIds : [business.categoryId].filter(Boolean);
}

function isBusinessOpen(openingHours?: string) {
  if (!openingHours) return false;
  const match = openingHours.match(/(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*(?:a|-|hasta)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i);
  if (!match) return false;

  const toMinutes = (value: string, meridian?: string) => {
    const [hourText, minuteText = '0'] = value.split(':');
    let hour = Number(hourText);
    const minute = Number(minuteText);
    const normalized = meridian?.toLowerCase();
    if (normalized?.includes('p') && hour < 12) hour += 12;
    if (normalized?.includes('a') && hour === 12) hour = 0;
    return hour * 60 + minute;
  };

  const start = toMinutes(match[1], match[2] || match[4]);
  const end = toMinutes(match[3], match[4] || match[2]);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return end >= start ? current >= start && current <= end : current >= start || current <= end;
}

function HomeBannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    setIndex(0);
  }, [banners]);

  if (banners.length === 0) return null;

  const banner = banners[index];

  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-slate-900 shadow-sm lg:min-h-[620px]">
      <img
        src={banner.image}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

      <div className="relative z-10 flex min-h-[420px] flex-col justify-end p-6 sm:p-8 lg:min-h-[620px]">
        <div className="max-w-md text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Eventos y promociones</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">{banner.title}</h1>
          {banner.description ? <p className="mt-4 text-sm leading-6 text-white/85 sm:text-base">{banner.description}</p> : null}
          <Link
            to={banner.buttonLink || '/'}
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-white/70 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-slate-900"
          >
            {banner.buttonLabel || 'Ver mas'}
          </Link>
        </div>

        {banners.length > 1 ? (
          <div className="mt-8 flex items-center gap-2">
            {banners.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ver banner ${itemIndex + 1}`}
                onClick={() => setIndex(itemIndex)}
                className={`h-2.5 rounded-full transition ${
                  itemIndex === index ? 'w-10 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function HomePage() {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>(sampleBanners);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [statistics, setStatistics] = useState<Array<Statistic & { id?: string }>>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [selectedZoneId, setSelectedZoneId] = useState('all');
  const [searchCategoryId, setSearchCategoryId] = useState('all');
  const [searchZoneId, setSearchZoneId] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyPromotions, setOnlyPromotions] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [searchSort, setSearchSort] = useState<SearchSort>('recent');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSiteSettings, ...(snapshot.data() as Partial<SiteSettings>) });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [businessSnapshot, categorySnapshot, bannerSnapshot, productsSnapshot, promotionsSnapshot, statisticsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'businesses'), where('published', '==', true))),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'banners')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'promotions')),
          getDocs(collection(db, 'statistics')),
        ]);

        const businessesList = businessSnapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Business, 'id'>) }));
        setBusinesses(businessesList);

        const categoryList = categorySnapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Category, 'id'>) }))
          .filter((category) => category.active !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((category) => ({
            ...category,
            businessCount: businessesList.filter((business) =>
              (business.categoryIds?.length ? business.categoryIds : [business.categoryId]).includes(category.id)
            ).length,
          }));
        setCategories(categoryList);

        const bannerList = bannerSnapshot.docs
          .map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Banner, 'id'>) }))
          .filter((banner) => banner.active !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        if (bannerList.length > 0) {
          setBanners(bannerList);
        }

        setProducts(productsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Product, 'id'>) })));
        setPromotions(promotionsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Promotion, 'id'>) })));
        setStatistics(statisticsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Statistic) })));
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      const list = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<NewsPost, 'id'>) }))
        .filter((post) => post.published !== false)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNewsPosts(list);
    });

    return () => unsubscribe();
  }, []);

  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((business) =>
        [business.name, business.description, business.address, business.district]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (selectedZoneId === 'all' || business.zoneId === selectedZoneId)
      ),
    [businesses, search, selectedZoneId]
  );

  const searchResults = useMemo(() => {
    const term = search.toLowerCase().trim();
    const statsByBusiness = new Map(statistics.map((stat) => [stat.businessId, stat]));

    return businesses
      .filter((business) => {
        const categoryNames = categories
          .filter((category) => businessCategoryIds(business).includes(category.id))
          .map((category) => category.name)
          .join(' ');
        const businessProducts = products.filter((product) => product.businessId === business.id);
        const businessPromotions = promotions.filter((promotion) => promotion.businessId === business.id);
        const haystack = [
          business.name,
          business.description,
          business.address,
          business.district,
          business.openingHours,
          categoryNames,
          businessProducts.map((product) => `${product.name} ${product.description}`).join(' '),
          businessPromotions.map((promotion) => `${promotion.title} ${promotion.description}`).join(' '),
        ].join(' ').toLowerCase();

        const matchesTerm = !term || haystack.includes(term);
        const matchesCategory = searchCategoryId === 'all' || businessCategoryIds(business).includes(searchCategoryId);
        const matchesZone = searchZoneId === 'all' || business.zoneId === searchZoneId;
        const matchesOpen = !onlyOpen || isBusinessOpen(business.openingHours);
        const matchesPromotions = !onlyPromotions || businessPromotions.length > 0;
        const matchesFeatured = !onlyFeatured || business.featured;

        return matchesTerm && matchesCategory && matchesZone && matchesOpen && matchesPromotions && matchesFeatured;
      })
      .sort((a, b) => {
        if (searchSort === 'visited') return (statsByBusiness.get(b.id)?.views ?? 0) - (statsByBusiness.get(a.id)?.views ?? 0);
        if (searchSort === 'featured') return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [businesses, categories, onlyFeatured, onlyOpen, onlyPromotions, products, promotions, search, searchCategoryId, searchSort, searchZoneId, statistics]);

  const trackSearch = async () => {
    const term = search.trim();
    if (!term && searchCategoryId === 'all' && searchZoneId === 'all' && !onlyOpen && !onlyPromotions && !onlyFeatured) return;

    try {
      await addDoc(collection(db, 'analytics'), {
        type: 'search',
        term,
        categoryId: searchCategoryId !== 'all' ? searchCategoryId : '',
        zoneId: searchZoneId !== 'all' ? searchZoneId : '',
        onlyOpen,
        onlyPromotions,
        onlyFeatured,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error registrando busqueda:', error);
    }
  };

  const homeCategories = categories.length > 0 ? categories : sampleCategories;
  const featuredBusinesses = businesses.filter((business) => business.featured);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.75fr)] lg:items-stretch">
        <HomeBannerCarousel banners={banners} />

        <aside className="flex flex-col justify-center rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{settings.welcomeTitle || `Bienvenido a ${settings.siteName}`}</h2>
            <label
              className="mt-5 flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left text-sm font-medium text-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
            >
              <span className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-slate-900" />
                Zona
              </span>
              <select
                value={selectedZoneId}
                onChange={(event) => setSelectedZoneId(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-right outline-none"
              >
                <option value="all">Todas las zonas</option>
                {sjlZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-5 w-5 text-slate-500" />
            </label>
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold text-slate-900">Lo tenemos todo</p>
            <label className="mt-4 flex items-center rounded-full bg-slate-100 px-5 py-3 focus-within:ring-2 focus-within:ring-brand-100">
              <input
                type="search"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onClick={() => setSearchOpen(true)}
                readOnly
                placeholder="Busca aqui lo que necesites."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
              />
              <Search className="h-5 w-5 text-slate-900" />
            </label>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-x-5 gap-y-7">
            {homeCategories.slice(0, 9).map((category) => (
              <Link key={category.id} to={`/categoria/${category.slug}`} className="group flex flex-col items-center gap-3 text-center">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 transition group-hover:scale-105">
                  <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                </span>
                <span className="text-xs font-medium text-slate-700">{category.name}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-500">Categorias</p>
              <h2 className="text-3xl font-semibold text-slate-900">Explora por rubro</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {homeCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {featuredBusinesses.length > 0 ? (
        <section>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-500">Negocios destacados</p>
              <h2 className="text-3xl font-semibold text-slate-900">Recomendados para ti</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      ) : null}

      {newsPosts.length > 0 ? (
        <section>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-brand-500">Novedades</p>
                <h2 className="text-3xl font-semibold text-slate-900">Noticias recientes</h2>
              </div>
              <p className="max-w-md text-sm text-slate-500">
                Informacion, comunicados y publicaciones para la comunidad.
              </p>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {newsPosts.slice(0, 6).map((post) => (
                <article key={post.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                  <div className="aspect-[16/10] bg-slate-100">
                    {post.image ? (
                      <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
                        Novedad
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-500">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-PE') : 'Reciente'}
                    </p>
                    <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{post.title}</h3>
                    <p className="line-clamp-4 text-sm leading-6 text-slate-600">{post.description}</p>
                    {post.link ? (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-500"
                      >
                        {post.linkLabel || 'Leer mas'}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-500">Ultimos negocios</p>
              <h2 className="text-3xl font-semibold text-slate-900">Nuevas empresas</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <NewsletterSubscribe />
      </section>

      {searchOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-6">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Buscar</h3>
              <button onClick={() => setSearchOpen(false)} className="rounded px-3 py-1">Cerrar</button>
            </div>
            <div className="mt-4">
              <SearchBar value={search} onChange={setSearch} />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <select value={searchCategoryId} onChange={(event) => setSearchCategoryId(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option value="all">Todos los rubros</option>
                  {homeCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <select value={searchZoneId} onChange={(event) => setSearchZoneId(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option value="all">Todas las zonas</option>
                  {sjlZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
                <select value={searchSort} onChange={(event) => setSearchSort(event.target.value as SearchSort)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option value="recent">Mas recientes</option>
                  <option value="visited">Mas visitados</option>
                  <option value="featured">Destacados primero</option>
                </select>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} />
                  Abiertos ahora
                </label>
                <label className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={onlyPromotions} onChange={(event) => setOnlyPromotions(event.target.checked)} />
                  Con promociones
                </label>
                <label className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={onlyFeatured} onChange={(event) => setOnlyFeatured(event.target.checked)} />
                  Destacados
                </label>
                <button type="button" onClick={trackSearch} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                  Aplicar busqueda
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                {search.trim().length === 0 && searchCategoryId === 'all' && searchZoneId === 'all' && !onlyOpen && !onlyPromotions && !onlyFeatured ? (
                  <p className="text-sm text-slate-500">Escribe una palabra clave o usa los filtros para encontrar negocios.</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((business) => (
                    <Link
                      key={business.id}
                      to={`/negocio/${business.slug || business.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:bg-slate-50"
                    >
                      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        {business.thumbnail || business.coverImage || business.logo ? (
                          <img src={business.thumbnail || business.coverImage || business.logo} alt={business.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-brand-700">{business.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{business.name}</span>
                        <span className="block text-xs text-slate-500">{business.address}</span>
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No encontramos negocios con ese nombre.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
