import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Eye, Image as ImageIcon, LayoutTemplate, MapPin, Megaphone, Palette, Share2, Store, Tags, X } from 'lucide-react';
import { sampleCategories } from '../data/sampleData';
import { sjlZones } from '../data/zones';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import type { Business, BusinessSection, Category, Product, Promotion } from '../types';

type EditorTab = 'info' | 'images' | 'location' | 'social' | 'products' | 'promotions' | 'design';

interface BusinessProduct {
  id: string;
  docId?: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

interface BusinessPromotion {
  id: string;
  docId?: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
}

interface BusinessForm {
  name: string;
  slug: string;
  categoryId: string;
  categoryIds: string[];
  description: string;
  openingHours: string;
  address: string;
  district: string;
  zoneId: string;
  googleMapsUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  coverImage: string;
  logo: string;
  thumbnail: string;
  featuredImages: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  pageThemeMode: 'light' | 'dark';
  pagePrimaryColor: string;
  pageBackgroundColor: string;
  pageSurfaceColor: string;
  pageTextColor: string;
  pageRadiusStyle: 'square' | 'soft' | 'rounded';
  sections: BusinessSection[];
}

const tabs: Array<{ id: EditorTab; label: string; icon: typeof Store }> = [
  { id: 'info', label: 'Informacion', icon: Store },
  { id: 'images', label: 'Imagenes', icon: ImageIcon },
  { id: 'location', label: 'Ubicacion', icon: MapPin },
  { id: 'social', label: 'Redes', icon: Share2 },
  { id: 'products', label: 'Productos', icon: Tags },
  { id: 'promotions', label: 'Promociones', icon: Megaphone },
  { id: 'design', label: 'Diseno', icon: Palette },
];

const emptyForm: BusinessForm = {
  name: '',
  slug: '',
  categoryId: 'gastronomia-alimentacion',
  categoryIds: ['gastronomia-alimentacion'],
  description: '',
  openingHours: 'Lunes a sabado: 9:00 am a 8:00 pm',
  address: '',
  district: 'San Juan de Lurigancho',
  zoneId: 'zona-1',
  googleMapsUrl: '',
  phone: '',
  whatsapp: '',
  email: '',
  website: '',
  coverImage: '',
  logo: '',
  thumbnail: '',
  featuredImages: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  pageThemeMode: 'light',
  pagePrimaryColor: '#0c66d0',
  pageBackgroundColor: '#f8fafc',
  pageSurfaceColor: '#ffffff',
  pageTextColor: '#0f172a',
  pageRadiusStyle: 'rounded',
  sections: [],
};

function generateId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

function createSection(): BusinessSection {
  return { id: generateId(), title: '', content: '' };
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function businessSlug(name: string, businessId: string) {
  return `${slugify(name) || 'negocio'}-${businessId.slice(0, 6).toLowerCase()}`;
}

function featuredImagesFromText(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function businessStatus(business: (Business & { docId: string }) | null) {
  if (!business) return { label: 'Nuevo negocio', tone: 'bg-slate-100 text-slate-700', help: 'Completa la informacion y guarda para crear tu pagina.' };
  if (business.published) return { label: 'Visible para clientes', tone: 'bg-emerald-100 text-emerald-700', help: 'Tu pagina publica esta publicada y puede recibir visitas.' };
  if (business.reviewStatus === 'pending') return { label: 'Pendiente de revision', tone: 'bg-amber-100 text-amber-700', help: 'El administrador debe revisar los cambios antes de publicarlos.' };
  return { label: 'No publicado', tone: 'bg-slate-100 text-slate-700', help: 'La pagina aun no esta visible para clientes.' };
}

export function OwnerBusinessPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedBusinessId = searchParams.get('business');
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<EditorTab>('info');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Array<Business & { docId: string }>>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [form, setForm] = useState<BusinessForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [promotions, setPromotions] = useState<BusinessPromotion[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);
  const [deletedPromotionIds, setDeletedPromotionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.docId === selectedDocId) ?? null,
    [businesses, selectedDocId]
  );
  const currentStatus = businessStatus(selectedBusiness);
  const publicPath = selectedBusiness ? `/negocio/${selectedBusiness.slug || selectedBusiness.docId}` : '';

  useEffect(() => {
    async function loadBusinesses() {
      if (!user) return;
      setLoading(true);
      try {
        const snapshot = isAdmin
          ? await getDocs(collection(db, 'businesses'))
          : await getDocs(query(collection(db, 'businesses'), where('ownerId', '==', user.id)));
        const list = snapshot.docs.map((docItem) => ({ docId: docItem.id, ...(docItem.data() as Business) }));
        setBusinesses(list);
        if (list.length > 0) {
          setSelectedDocId((current) => requestedBusinessId || current || list[0].docId);
        } else {
          setSelectedDocId('');
          setForm(emptyForm);
        }
      } catch (error) {
        console.error('Error cargando negocios:', error);
        setStatus('No se pudieron cargar tus negocios. Revisa permisos o conexion.');
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, [user, isAdmin, requestedBusinessId]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        const list = snapshot.docs
          .map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Category, 'id'>) }))
          .filter((category) => category.active !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCategories(list.length > 0 ? list : sampleCategories);
      } catch (error) {
        console.error('Error cargando categorias:', error);
        setCategories(sampleCategories);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      setForm({
        name: selectedBusiness.name ?? '',
        slug: selectedBusiness.slug ?? '',
        categoryId: selectedBusiness.categoryId ?? 'gastronomia-alimentacion',
        categoryIds: selectedBusiness.categoryIds?.length ? selectedBusiness.categoryIds : [selectedBusiness.categoryId],
        description: selectedBusiness.description ?? '',
        openingHours: selectedBusiness.openingHours ?? emptyForm.openingHours,
        address: selectedBusiness.address ?? '',
        district: selectedBusiness.district ?? 'San Juan de Lurigancho',
        zoneId: selectedBusiness.zoneId ?? 'zona-1',
        googleMapsUrl: selectedBusiness.googleMapsUrl ?? '',
        phone: selectedBusiness.phone ?? '',
        whatsapp: selectedBusiness.whatsapp ?? '',
        email: selectedBusiness.email ?? '',
        website: selectedBusiness.website ?? '',
        coverImage: selectedBusiness.coverImage ?? '',
        logo: selectedBusiness.logo ?? '',
        thumbnail: selectedBusiness.thumbnail ?? '',
        featuredImages: (selectedBusiness.featuredImageUrls ?? []).join('\n'),
        facebook: selectedBusiness.facebook ?? '',
        instagram: selectedBusiness.instagram ?? '',
        tiktok: selectedBusiness.tiktok ?? '',
        pageThemeMode: selectedBusiness.pageThemeMode ?? 'light',
        pagePrimaryColor: selectedBusiness.pagePrimaryColor ?? '#0c66d0',
        pageBackgroundColor: selectedBusiness.pageBackgroundColor ?? '#f8fafc',
        pageSurfaceColor: selectedBusiness.pageSurfaceColor ?? '#ffffff',
        pageTextColor: selectedBusiness.pageTextColor ?? '#0f172a',
        pageRadiusStyle: selectedBusiness.pageRadiusStyle ?? 'rounded',
        sections: selectedBusiness.sections ?? [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    async function loadAssets() {
      if (!selectedBusiness) {
        setProducts([]);
        setPromotions([]);
        setDeletedProductIds([]);
        setDeletedPromotionIds([]);
        return;
      }

      try {
        const [productsSnapshot, promotionsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'products'), where('businessId', '==', selectedBusiness.docId))),
          getDocs(query(collection(db, 'promotions'), where('businessId', '==', selectedBusiness.docId))),
        ]);
        setProducts(
          productsSnapshot.docs.map((docItem) => ({
            docId: docItem.id,
            id: docItem.id,
            ...(docItem.data() as Omit<Product, 'id'>),
            price: String((docItem.data() as Product).price ?? 0),
          }))
        );
        setPromotions(
          promotionsSnapshot.docs.map((docItem) => ({
            docId: docItem.id,
            id: docItem.id,
            ...(docItem.data() as Omit<Promotion, 'id'>),
          }))
        );
        setDeletedProductIds([]);
        setDeletedPromotionIds([]);
      } catch (error) {
        console.error('Error cargando productos/promociones:', error);
      }
    }

    loadAssets();
  }, [selectedBusiness]);

  const handleChange = (field: keyof BusinessForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setForm((current) => {
      const nextCategoryIds = checked
        ? Array.from(new Set([...current.categoryIds, categoryId]))
        : current.categoryIds.filter((id) => id !== categoryId);
      const finalCategoryIds = nextCategoryIds.length > 0 ? nextCategoryIds : [current.categoryId];

      return { ...current, categoryIds: finalCategoryIds, categoryId: finalCategoryIds[0] };
    });
  };

  const handleSectionChange = (sectionId: string, field: keyof BusinessSection, value: string) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)),
    }));
  };

  const addSection = () => setForm((current) => ({ ...current, sections: [...current.sections, createSection()] }));
  const removeSection = (sectionId: string) =>
    setForm((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== sectionId) }));

  const handleProductChange = (productId: string, field: keyof BusinessProduct, value: string) => {
    setProducts((current) => current.map((product) => (product.id === productId ? { ...product, [field]: value } : product)));
  };

  const addProduct = () => {
    setProducts((current) => [...current, { id: generateId(), name: '', description: '', price: '0', image: '' }]);
  };

  const removeProduct = (productId: string) => {
    const existing = products.find((product) => product.id === productId);
    if (existing?.docId) setDeletedProductIds((current) => [...current, existing.docId as string]);
    setProducts((current) => current.filter((product) => product.id !== productId));
  };

  const handlePromotionChange = (promotionId: string, field: keyof BusinessPromotion, value: string) => {
    setPromotions((current) => current.map((promotion) => (promotion.id === promotionId ? { ...promotion, [field]: value } : promotion)));
  };

  const addPromotion = () => {
    setPromotions((current) => [
      ...current,
      {
        id: generateId(),
        title: '',
        description: '',
        image: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      },
    ]);
  };

  const removePromotion = (promotionId: string) => {
    const existing = promotions.find((promotion) => promotion.id === promotionId);
    if (existing?.docId) setDeletedPromotionIds((current) => [...current, existing.docId as string]);
    setPromotions((current) => current.filter((promotion) => promotion.id !== promotionId));
  };

  const saveProductsAndPromotions = async (businessId: string) => {
    const batch = writeBatch(db);

    deletedProductIds.forEach((productId) => batch.delete(doc(db, 'products', productId)));
    deletedPromotionIds.forEach((promotionId) => batch.delete(doc(db, 'promotions', promotionId)));

    products.forEach((product) => {
      if (!product.name.trim() && !product.description.trim()) return;
      const payload = {
        businessId,
        name: product.name.trim(),
        description: product.description.trim(),
        price: Number(product.price) || 0,
        image: product.image.trim(),
      };
      if (product.docId) batch.set(doc(db, 'products', product.docId), payload, { merge: true });
      else batch.set(doc(collection(db, 'products')), payload);
    });

    promotions.forEach((promotion) => {
      if (!promotion.title.trim() && !promotion.description.trim()) return;
      const payload = {
        businessId,
        title: promotion.title.trim(),
        description: promotion.description.trim(),
        image: promotion.image.trim(),
        startDate: promotion.startDate,
        endDate: promotion.endDate,
      };
      if (promotion.docId) batch.set(doc(db, 'promotions', promotion.docId), payload, { merge: true });
      else batch.set(doc(collection(db, 'promotions')), payload);
    });

    await batch.commit();
  };

  const reloadBusinesses = async () => {
    if (!user) return;
    const snapshot = isAdmin
      ? await getDocs(collection(db, 'businesses'))
      : await getDocs(query(collection(db, 'businesses'), where('ownerId', '==', user.id)));
    setBusinesses(snapshot.docs.map((docItem) => ({ docId: docItem.id, ...(docItem.data() as Business) })));
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatus('Necesitas iniciar sesion para guardar.');
      return;
    }
    if (!form.name.trim()) {
      setStatus('Agrega el nombre del negocio antes de guardar.');
      setActiveTab('info');
      return;
    }

    setSaving(true);
    setStatus('');

    const buildPayload = (businessId?: string) => ({
      ownerId: isAdmin && selectedBusiness ? selectedBusiness.ownerId : user.id,
      categoryId: form.categoryIds[0] ?? form.categoryId,
      categoryIds: form.categoryIds.length > 0 ? form.categoryIds : [form.categoryId],
      name: form.name.trim(),
      slug: isAdmin
        ? form.slug.trim() || (businessId ? businessSlug(form.name, businessId) : '')
        : selectedBusiness?.slug || (businessId ? businessSlug(form.name, businessId) : ''),
      description: form.description.trim(),
      openingHours: form.openingHours.trim(),
      address: form.address.trim(),
      district: 'San Juan de Lurigancho',
      zoneId: form.zoneId,
      googleMapsUrl: form.googleMapsUrl.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      coverImage: form.coverImage.trim(),
      logo: form.logo.trim(),
      thumbnail: form.thumbnail.trim(),
      featuredImageUrls: featuredImagesFromText(form.featuredImages),
      latitude: 0,
      longitude: 0,
      facebook: form.facebook.trim(),
      instagram: form.instagram.trim(),
      tiktok: form.tiktok.trim(),
      pageThemeMode: form.pageThemeMode,
      pagePrimaryColor: form.pagePrimaryColor,
      pageBackgroundColor: form.pageBackgroundColor,
      pageSurfaceColor: form.pageSurfaceColor,
      pageTextColor: form.pageTextColor,
      pageRadiusStyle: form.pageRadiusStyle,
      sections: form.sections,
      published: selectedBusiness?.published ?? false,
      reviewStatus: isAdmin
        ? selectedBusiness?.reviewStatus ?? (selectedBusiness?.published ? 'approved' : 'draft')
        : 'pending',
      adminNotes: selectedBusiness?.adminNotes ?? '',
      lastOwnerUpdateAt: new Date().toISOString(),
      createdAt: selectedBusiness?.createdAt ?? new Date().toISOString(),
    });

    try {
      let businessId = selectedBusiness?.docId;

      if (selectedBusiness) {
        businessId = selectedBusiness.docId;
        await updateDoc(doc(db, 'businesses', businessId), buildPayload(businessId));
        setStatus(isAdmin ? 'Negocio actualizado correctamente.' : 'Cambios enviados. Quedaran pendientes de revision si la pagina no esta publicada.');
      } else {
        const newBusinessRef = await addDoc(collection(db, 'businesses'), { ...buildPayload(undefined), slug: '' });
        businessId = newBusinessRef.id;
        await updateDoc(doc(db, 'businesses', businessId), buildPayload(businessId));
        setSelectedDocId(newBusinessRef.id);
        setStatus('Negocio creado. Ahora puedes completar imagenes, productos y promociones.');
      }

      if (businessId) await saveProductsAndPromotions(businessId);
      await reloadBusinesses();
    } catch (error) {
      console.error('Error guardando negocio:', error);
      setStatus(`Error guardando el negocio: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Cargando tu negocio...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{isAdmin ? 'Editor de negocios' : 'Mi negocio'}</h1>
            <p className="mt-2 text-slate-600">
              {isAdmin ? 'Puedes editar, corregir y revisar cualquier pagina de negocio.' : 'Actualiza tu pagina con pasos simples. No necesitas tocar datos tecnicos.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${currentStatus.tone}`}>{currentStatus.label}</span>
            {publicPath ? (
              <Link to={publicPath} target="_blank" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Eye className="h-4 w-4" />
                Ver pagina
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              <LayoutTemplate className="h-4 w-4" />
              Vista previa
            </button>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{currentStatus.help}</p>
        {(businesses.length > 1 || isAdmin) && (
          <div className="mt-5 grid gap-2 sm:max-w-md">
            <label className="text-sm font-medium text-slate-700">{isAdmin ? 'Negocio a editar' : 'Seleccionar negocio'}</label>
            <select value={selectedDocId} onChange={(event) => setSelectedDocId(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              {businesses.map((business) => (
                <option key={business.docId} value={business.docId}>
                  {business.name || 'Negocio sin nombre'}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {activeTab === 'info' ? (
            <div className="grid gap-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Nombre del negocio">
                  <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} className="input" required />
                </Field>
                {isAdmin ? (
                  <Field label="Slug publico">
                    <input value={form.slug} onChange={(event) => handleChange('slug', slugify(event.target.value))} className="input" placeholder="ruta-publica" />
                  </Field>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    La ruta publica se genera automaticamente. Asi evitamos errores al compartir tu pagina.
                  </div>
                )}
              </div>
              <Field label="Descripcion principal">
                <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} className="input min-h-32" required />
              </Field>
              <Field label="Horario de atencion">
                <input value={form.openingHours} onChange={(event) => handleChange('openingHours', event.target.value)} className="input" placeholder="Lunes a sabado: 9:00 am a 8:00 pm" />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(category.id)}
                      onChange={(event) => handleCategoryToggle(category.id, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
              <SectionsEditor sections={form.sections} onAdd={addSection} onRemove={removeSection} onChange={handleSectionChange} />
            </div>
          ) : null}

          {activeTab === 'images' ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="URL del banner principal">
                <input value={form.coverImage} onChange={(event) => handleChange('coverImage', event.target.value)} className="input" placeholder="https://..." />
              </Field>
              <Field label="URL de miniatura">
                <input value={form.thumbnail} onChange={(event) => handleChange('thumbnail', event.target.value)} className="input" placeholder="https://..." />
              </Field>
              <Field label="URL del logo">
                <input value={form.logo} onChange={(event) => handleChange('logo', event.target.value)} className="input" placeholder="https://..." />
              </Field>
              <Field label="Fotos destacadas opcionales">
                <textarea value={form.featuredImages} onChange={(event) => handleChange('featuredImages', event.target.value)} className="input min-h-32" placeholder="Pega una URL por linea" />
              </Field>
            </div>
          ) : null}

          {activeTab === 'location' ? (
            <div className="grid gap-5">
              <Field label="Zona de San Juan de Lurigancho">
                <select value={form.zoneId} onChange={(event) => handleChange('zoneId', event.target.value)} className="input">
                  {sjlZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - {zone.description}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Direccion del negocio">
                  <input value={form.address} onChange={(event) => handleChange('address', event.target.value)} className="input" placeholder="Av., calle, referencia o local" />
                </Field>
                <Field label="Enlace de Google Maps">
                  <input value={form.googleMapsUrl} onChange={(event) => handleChange('googleMapsUrl', event.target.value)} className="input" placeholder="https://maps.google.com/..." />
                </Field>
              </div>
            </div>
          ) : null}

          {activeTab === 'social' ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Telefono">
                <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} className="input" />
              </Field>
              <Field label="WhatsApp">
                <input value={form.whatsapp} onChange={(event) => handleChange('whatsapp', event.target.value)} className="input" />
              </Field>
              <Field label="Correo">
                <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} className="input" />
              </Field>
              <Field label="Sitio web">
                <input value={form.website} onChange={(event) => handleChange('website', event.target.value)} className="input" />
              </Field>
              <Field label="Facebook">
                <input value={form.facebook} onChange={(event) => handleChange('facebook', event.target.value)} className="input" placeholder="usuario o URL completa" />
              </Field>
              <Field label="Instagram">
                <input value={form.instagram} onChange={(event) => handleChange('instagram', event.target.value)} className="input" placeholder="usuario o URL completa" />
              </Field>
              <Field label="TikTok">
                <input value={form.tiktok} onChange={(event) => handleChange('tiktok', event.target.value)} className="input" placeholder="usuario o URL completa" />
              </Field>
            </div>
          ) : null}

          {activeTab === 'products' ? (
            <ProductsEditor products={products} onAdd={addProduct} onRemove={removeProduct} onChange={handleProductChange} />
          ) : null}

          {activeTab === 'promotions' ? (
            <PromotionsEditor promotions={promotions} onAdd={addPromotion} onRemove={removePromotion} onChange={handlePromotionChange} />
          ) : null}

          {activeTab === 'design' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Vista">
                <select value={form.pageThemeMode} onChange={(event) => handleChange('pageThemeMode', event.target.value)} className="input">
                  <option value="light">Clara</option>
                  <option value="dark">Oscura</option>
                </select>
              </Field>
              <Field label="Forma">
                <select value={form.pageRadiusStyle} onChange={(event) => handleChange('pageRadiusStyle', event.target.value)} className="input">
                  <option value="square">Recta</option>
                  <option value="soft">Suave</option>
                  <option value="rounded">Redondeada</option>
                </select>
              </Field>
              {[
                ['pagePrimaryColor', 'Color principal'],
                ['pageBackgroundColor', 'Fondo'],
                ['pageSurfaceColor', 'Tarjetas'],
                ['pageTextColor', 'Texto'],
              ].map(([field, label]) => (
                <Field key={field} label={label}>
                  <div className="grid grid-cols-[52px_1fr] gap-2">
                    <input type="color" value={form[field as keyof BusinessForm] as string} onChange={(event) => handleChange(field as keyof BusinessForm, event.target.value)} className="h-12 w-13 rounded-xl border border-slate-200 bg-white p-1" />
                    <input value={form[field as keyof BusinessForm] as string} onChange={(event) => handleChange(field as keyof BusinessForm, event.target.value)} className="input" />
                  </div>
                </Field>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{isAdmin ? 'Los cambios del administrador se aplican directamente.' : 'Tus cambios quedaran registrados para revision cuando corresponda.'}</p>
          <button type="submit" disabled={saving} className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Guardando...' : selectedBusiness ? 'Guardar cambios' : 'Crear negocio'}
          </button>
        </div>
        {status ? <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{status}</p> : null}
      </form>

      {previewOpen ? (
        <PreviewModal form={form} products={products} promotions={promotions} onClose={() => setPreviewOpen(false)} />
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function SectionsEditor({
  sections,
  onAdd,
  onRemove,
  onChange,
}: {
  sections: BusinessSection[];
  onAdd: () => void;
  onRemove: (sectionId: string) => void;
  onChange: (sectionId: string, field: keyof BusinessSection, value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Secciones destacadas</h2>
          <p className="text-sm text-slate-600">Agrega mensajes importantes, novedades o informacion especial del negocio.</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Agregar seccion
        </button>
      </div>
      {sections.length === 0 ? <p className="text-sm text-slate-500">Aun no hay secciones.</p> : null}
      {sections.map((section) => (
        <div key={section.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={section.title} onChange={(event) => onChange(section.id, 'title', event.target.value)} className="input" placeholder="Titulo de seccion" />
            <button type="button" onClick={() => onRemove(section.id)} className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
              Eliminar
            </button>
          </div>
          <textarea value={section.content} onChange={(event) => onChange(section.id, 'content', event.target.value)} className="input min-h-28" placeholder="Contenido" />
        </div>
      ))}
    </div>
  );
}

function ProductsEditor({
  products,
  onAdd,
  onRemove,
  onChange,
}: {
  products: BusinessProduct[];
  onAdd: () => void;
  onRemove: (productId: string) => void;
  onChange: (productId: string, field: keyof BusinessProduct, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Productos y servicios</h2>
          <p className="text-sm text-slate-600">Cada producto puede mostrarse con boton directo a WhatsApp.</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Agregar producto
        </button>
      </div>
      {products.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Aun no hay productos.</p> : null}
      {products.map((product) => (
        <div key={product.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_140px_auto]">
            <input value={product.name} onChange={(event) => onChange(product.id, 'name', event.target.value)} className="input" placeholder="Nombre" />
            <input value={product.price} onChange={(event) => onChange(product.id, 'price', event.target.value)} className="input" placeholder="Precio" />
            <button type="button" onClick={() => onRemove(product.id)} className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
              Eliminar
            </button>
          </div>
          <textarea value={product.description} onChange={(event) => onChange(product.id, 'description', event.target.value)} className="input min-h-24" placeholder="Descripcion" />
          <input value={product.image} onChange={(event) => onChange(product.id, 'image', event.target.value)} className="input" placeholder="URL de imagen" />
        </div>
      ))}
    </div>
  );
}

function PromotionsEditor({
  promotions,
  onAdd,
  onRemove,
  onChange,
}: {
  promotions: BusinessPromotion[];
  onAdd: () => void;
  onRemove: (promotionId: string) => void;
  onChange: (promotionId: string, field: keyof BusinessPromotion, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Promociones</h2>
          <p className="text-sm text-slate-600">Publica ofertas con fecha de inicio y fin.</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Agregar promocion
        </button>
      </div>
      {promotions.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Aun no hay promociones.</p> : null}
      {promotions.map((promotion) => (
        <div key={promotion.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_150px_150px_auto]">
            <input value={promotion.title} onChange={(event) => onChange(promotion.id, 'title', event.target.value)} className="input" placeholder="Titulo" />
            <input type="date" value={promotion.startDate} onChange={(event) => onChange(promotion.id, 'startDate', event.target.value)} className="input" />
            <input type="date" value={promotion.endDate} onChange={(event) => onChange(promotion.id, 'endDate', event.target.value)} className="input" />
            <button type="button" onClick={() => onRemove(promotion.id)} className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
              Eliminar
            </button>
          </div>
          <textarea value={promotion.description} onChange={(event) => onChange(promotion.id, 'description', event.target.value)} className="input min-h-24" placeholder="Descripcion" />
          <input value={promotion.image} onChange={(event) => onChange(promotion.id, 'image', event.target.value)} className="input" placeholder="URL de imagen" />
        </div>
      ))}
    </div>
  );
}

function PreviewModal({
  form,
  products,
  promotions,
  onClose,
}: {
  form: BusinessForm;
  products: BusinessProduct[];
  promotions: BusinessPromotion[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Vista previa antes de guardar</h2>
            <p className="text-sm text-slate-500">Esta vista es aproximada para revisar datos principales.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 p-6">
          <div className="overflow-hidden rounded-3xl bg-slate-900">
            {form.coverImage ? <img src={form.coverImage} alt={form.name} className="h-64 w-full object-cover opacity-80" /> : <div className="h-64" />}
            <div className="p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">{form.openingHours}</p>
              <h3 className="mt-2 text-3xl font-semibold">{form.name || 'Nombre del negocio'}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80">{form.description || 'Descripcion del negocio'}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <h4 className="font-semibold text-slate-900">Contacto</h4>
              <p className="mt-2 text-sm text-slate-600">{form.whatsapp || form.phone || form.email || 'Sin contacto aun'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <h4 className="font-semibold text-slate-900">Ubicacion</h4>
              <p className="mt-2 text-sm text-slate-600">{form.address || 'Sin direccion aun'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <h4 className="font-semibold text-slate-900">Contenido</h4>
              <p className="mt-2 text-sm text-slate-600">{products.length} productos, {promotions.length} promociones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
