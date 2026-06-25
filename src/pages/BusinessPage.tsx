import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AtSign, Clock3, Globe2, Mail, MapPin, MessageCircle, Music2, Navigation, Phone, Share2 } from 'lucide-react';
import { collection, doc, getDoc, getDocs, increment, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { sampleBusinesses, sampleProducts, samplePromotions } from '../data/sampleData';
import { zoneLabel } from '../data/zones';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import type { Business, Product, Promotion } from '../types';

function normalizeSocialUrl(value: string | undefined, base: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.replace(/^@/, '')}`;
}

function parseHour(value: string, meridian?: string) {
  const [hourText, minuteText = '0'] = value.split(':');
  let hour = Number(hourText);
  const minute = Number(minuteText);
  const normalizedMeridian = meridian?.toLowerCase();

  if (normalizedMeridian?.includes('p') && hour < 12) hour += 12;
  if (normalizedMeridian?.includes('a') && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function openingStatus(openingHours?: string) {
  if (!openingHours) return { label: 'Horario no indicado', tone: 'bg-slate-100 text-slate-700' };
  const match = openingHours.match(/(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*(?:a|-|hasta)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i);
  if (!match) return { label: 'Consulta horario', tone: 'bg-amber-100 text-amber-700' };

  const start = parseHour(match[1], match[2] || match[4]);
  const end = parseHour(match[3], match[4] || match[2]);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const open = end >= start ? current >= start && current <= end : current >= start || current <= end;
  return open
    ? { label: 'Abierto ahora', tone: 'bg-emerald-100 text-emerald-700' }
    : { label: 'Cerrado ahora', tone: 'bg-rose-100 text-rose-700' };
}

export function BusinessPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeBusiness: (() => void) | undefined;

    async function loadBusiness() {
      setLoading(true);
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const businessQuery = user
          ? query(collection(db, 'businesses'), where('slug', '==', slug))
          : query(collection(db, 'businesses'), where('slug', '==', slug), where('published', '==', true));
        const snapshot = await getDocs(businessQuery);
        let businessId = !snapshot.empty ? snapshot.docs[0].id : '';

        if (!businessId && user) {
          const directDoc = await getDoc(doc(db, 'businesses', slug));
          if (directDoc.exists()) {
            businessId = directDoc.id;
          }
        }

        if (businessId) {
          unsubscribeBusiness = onSnapshot(
            doc(db, 'businesses', businessId),
            async (businessDoc) => {
              if (!businessDoc.exists()) {
                setBusiness(null);
                setLoading(false);
                return;
              }

              const businessData = { id: businessDoc.id, ...(businessDoc.data() as Omit<Business, 'id'>) };
              setBusiness(businessData);

              const [productsSnapshot, promotionsSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'products'), where('businessId', '==', businessData.id))),
                getDocs(query(collection(db, 'promotions'), where('businessId', '==', businessData.id))),
              ]);

              setProducts(productsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Product, 'id'>) })));
              setPromotions(promotionsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Promotion, 'id'>) })));

              await setDoc(
                doc(db, 'statistics', businessData.id),
                {
                  businessId: businessData.id,
                  views: increment(1),
                  lastVisitAt: new Date().toISOString(),
                },
                { merge: true }
              );
              setLoading(false);
            },
            (error) => {
              console.error('Error escuchando negocio:', error);
              setBusiness(null);
              setLoading(false);
            }
          );
        } else {
          const fallback = sampleBusinesses.find((item) => item.slug === slug) ?? null;
          setBusiness(fallback);
          setProducts(fallback ? sampleProducts.filter((product) => product.businessId === fallback.id) : []);
          setPromotions(fallback ? samplePromotions.filter((promo) => promo.businessId === fallback.id) : []);
        }
      } catch (error) {
        console.error('Error cargando negocio:', error);
        const fallback = sampleBusinesses.find((item) => item.slug === slug) ?? null;
        setBusiness(fallback);
        setProducts(fallback ? sampleProducts.filter((product) => product.businessId === fallback.id) : []);
        setPromotions(fallback ? samplePromotions.filter((promo) => promo.businessId === fallback.id) : []);
      } finally {
        if (!unsubscribeBusiness) setLoading(false);
      }
    }

    loadBusiness();
    return () => unsubscribeBusiness?.();
  }, [slug, user]);

  const trackInteraction = async (field: 'whatsappClicks' | 'callClicks' | 'emailClicks' | 'socialClicks') => {
    if (!business) return;

    try {
      await setDoc(
        doc(db, 'statistics', business.id),
        {
          businessId: business.id,
          [field]: increment(1),
          lastInteractionAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error registrando interaccion:', error);
    }
  };

  const socialLinks = useMemo(() => {
    if (!business) return [];

    return [
      { label: 'Facebook', href: normalizeSocialUrl(business.facebook, 'https://facebook.com/'), icon: Share2 },
      { label: 'Instagram', href: normalizeSocialUrl(business.instagram, 'https://instagram.com/'), icon: AtSign },
      { label: 'TikTok', href: normalizeSocialUrl(business.tiktok, 'https://tiktok.com/@'), icon: Music2 },
      { label: 'Web', href: business.website, icon: Globe2 },
    ].filter((item) => item.href);
  }, [business]);

  if (loading) {
    return <p className="text-slate-600">Cargando negocio...</p>;
  }

  if (!business) {
    return <p className="text-slate-600">Negocio no encontrado.</p>;
  }

  const canEdit = user?.role === 'ADMIN' || user?.id === business.ownerId;
  const radius =
    business.pageRadiusStyle === 'square'
      ? '1rem'
      : business.pageRadiusStyle === 'soft'
        ? '1.5rem'
        : '2rem';
  const pageStyle = {
    '--business-primary': business.pagePrimaryColor || '#0c66d0',
    '--business-bg': business.pageBackgroundColor || (business.pageThemeMode === 'dark' ? '#0f172a' : '#f8fafc'),
    '--business-surface': business.pageSurfaceColor || (business.pageThemeMode === 'dark' ? '#111827' : '#ffffff'),
    '--business-text': business.pageTextColor || (business.pageThemeMode === 'dark' ? '#f8fafc' : '#0f172a'),
    '--business-muted': business.pageThemeMode === 'dark' ? '#cbd5e1' : '#475569',
    '--business-border': business.pageThemeMode === 'dark' ? '#334155' : '#e2e8f0',
    '--business-radius': radius,
  } as CSSProperties;
  const customSections = business.sections?.filter((section) => section.title.trim() || section.content.trim()) ?? [];
  const status = openingStatus(business.openingHours);
  const featuredImages = [
    ...(business.featuredImageUrls ?? []),
    business.coverImage,
    business.logo,
  ].filter(Boolean);
  const whatsappUrl = business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}` : '';

  return (
    <div className="business-public-page space-y-10 rounded-[var(--business-radius)]" style={pageStyle}>
      <section className="overflow-hidden rounded-[var(--business-radius)] shadow-soft">
        <div className="relative h-[380px] bg-slate-900">
          {business.coverImage ? (
            <img src={business.coverImage} alt={business.name} className="h-full w-full object-cover opacity-80" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-300">{zoneLabel(business.zoneId)}</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{business.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100 sm:text-lg">{business.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.tone}`}>
                <Clock3 className="h-4 w-4" />
                {status.label}
              </span>
              {business.openingHours ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                  {business.openingHours}
                </span>
              ) : null}
            </div>
            {canEdit ? (
              <Link
                to={`/mi-negocio?business=${business.id}`}
                className="mt-5 inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Editar negocio
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-7 rounded-3xl bg-white p-7 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Informacion general</h2>
              <p className="mt-3 text-base leading-8 text-slate-600">{business.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Contacto</h3>
              <ul className="mt-4 space-y-3 text-base leading-7 text-slate-600">
                {business.phone ? <li>Telefono: {business.phone}</li> : null}
                {business.whatsapp ? <li>WhatsApp: {business.whatsapp}</li> : null}
                {business.email ? <li>Email: {business.email}</li> : null}
                {business.website ? (
                  <li>
                    Sitio web:{' '}
                    <a href={business.website} className="text-brand-600 hover:text-brand-500" target="_blank" rel="noreferrer">
                      {business.website}
                    </a>
                  </li>
                ) : null}
                {business.openingHours ? <li>Horario: {business.openingHours}</li> : null}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">Direccion</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{business.address}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">Ubicacion</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{zoneLabel(business.zoneId)}</p>
              {business.googleMapsUrl ? (
                <a href={business.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                  <MapPin className="h-4 w-4" />
                  Ver en Google Maps
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-900">Redes y enlaces</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    onClick={() => trackInteraction('socialClicks')}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">Este negocio aun no agrego redes sociales.</p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Acciones rapidas</h2>
          <div className="mt-4 grid gap-3">
            {business.whatsapp ? (
              <a onClick={() => trackInteraction('whatsappClicks')} href={whatsappUrl} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-base font-semibold text-white hover:bg-green-700">
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            ) : null}
            {business.phone ? (
              <a onClick={() => trackInteraction('callClicks')} href={`tel:${business.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white hover:bg-slate-800">
                <Phone className="h-5 w-5" />
                Llamar
              </a>
            ) : null}
            {business.email ? (
              <a onClick={() => trackInteraction('emailClicks')} href={`mailto:${business.email}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-base font-semibold text-slate-900 hover:bg-slate-200">
                <Mail className="h-5 w-5" />
                Correo
              </a>
            ) : null}
            {business.googleMapsUrl ? (
              <a href={business.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 text-base font-semibold text-white hover:bg-brand-500">
                <Navigation className="h-5 w-5" />
                Como llegar
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {featuredImages.length > 0 ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Fotos destacadas</h2>
          <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
            {featuredImages.slice(0, 8).map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`${business.name} ${index + 1}`}
                className="h-52 w-80 shrink-0 snap-start rounded-3xl object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      {customSections.length > 0 ? (
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Contenido del negocio</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Secciones destacadas</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {customSections.map((section) => (
              <article key={section.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                {section.title ? <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3> : null}
                {section.content ? <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">{section.content}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        {products.length > 0 ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Productos y servicios</h2>
            <div className="mt-6 grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="grid gap-3 rounded-3xl border border-slate-200 p-4 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                  {product.image ? <img src={product.image} alt={product.name} className="h-20 w-20 rounded-3xl object-cover" /> : null}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
                    {whatsappUrl ? (
                      <a
                        onClick={() => trackInteraction('whatsappClicks')}
                        href={`${whatsappUrl}?text=${encodeURIComponent(`Hola, me interesa: ${product.name}`)}`}
                        className="mt-3 inline-flex rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Consultar por WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-brand-600">S/ {product.price}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {promotions.length > 0 ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Promociones</h2>
            <div className="mt-6 space-y-4">
              {promotions.map((promo) => (
                <div key={promo.id} className="overflow-hidden rounded-3xl border border-slate-200">
                  {promo.image ? <img src={promo.image} alt={promo.title} className="h-44 w-full object-cover" /> : null}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-slate-900">{promo.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{promo.description}</p>
                    {whatsappUrl ? (
                      <a
                        onClick={() => trackInteraction('whatsappClicks')}
                        href={`${whatsappUrl}?text=${encodeURIComponent(`Hola, quiero informacion sobre la promocion: ${promo.title}`)}`}
                        className="mt-4 inline-flex rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Consultar promocion
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
