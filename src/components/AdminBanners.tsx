import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Banner } from '../types';

type EditableBanner = Banner & { docId: string };

const emptyBanner: Omit<Banner, 'id'> = {
  title: '',
  description: '',
  image: '',
  buttonLabel: 'Ver mas',
  buttonLink: '/',
  active: true,
  order: 1,
};

export function AdminBanners() {
  const [banners, setBanners] = useState<EditableBanner[]>([]);
  const [newBanner, setNewBanner] = useState<Omit<Banner, 'id'>>(emptyBanner);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [banners]
  );

  async function loadBanners() {
    try {
      const bannerSnapshot = await getDocs(collection(db, 'banners'));
      setBanners(
        bannerSnapshot.docs.map((docItem) => ({
          docId: docItem.id,
          id: docItem.id,
          ...(docItem.data() as Omit<Banner, 'id'>),
        }))
      );
    } catch (error) {
      console.error('Error cargando banners:', error);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  const handleBannerChange = (docId: string, field: keyof Banner, value: string | boolean | number) => {
    setBanners((current) =>
      current.map((banner) =>
        banner.docId === docId ? { ...banner, [field]: value } : banner
      )
    );
  };

  const saveBanner = async (banner: EditableBanner) => {
    setSavingId(banner.docId);
    try {
      await updateDoc(doc(db, 'banners', banner.docId), {
        title: banner.title,
        description: banner.description,
        image: banner.image,
        buttonLabel: banner.buttonLabel,
        buttonLink: banner.buttonLink,
        active: banner.active ?? true,
        order: Number(banner.order ?? 0),
      });
      window.alert('Banner actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando banner:', error);
      window.alert('Error actualizando banner: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSavingId(null);
    }
  };

  const createBanner = async () => {
    if (!newBanner.title.trim() || !newBanner.image.trim()) {
      window.alert('Agrega al menos un titulo y una imagen para el banner.');
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'banners'), {
        ...newBanner,
        order: Number(newBanner.order ?? sortedBanners.length + 1),
      });
      setNewBanner({ ...emptyBanner, order: sortedBanners.length + 2 });
      await loadBanners();
      window.alert('Banner creado correctamente.');
    } catch (error) {
      console.error('Error creando banner:', error);
      window.alert('Error creando banner: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCreating(false);
    }
  };

  const removeBanner = async (banner: EditableBanner) => {
    const confirmed = window.confirm(`Eliminar el banner "${banner.title}"?`);
    if (!confirmed) return;

    setSavingId(banner.docId);
    try {
      await deleteDoc(doc(db, 'banners', banner.docId));
      setBanners((current) => current.filter((item) => item.docId !== banner.docId));
    } catch (error) {
      console.error('Error eliminando banner:', error);
      window.alert('Error eliminando banner: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Pantalla principal</p>
        <h2 className="text-2xl font-semibold text-slate-900">Carrusel de banners</h2>
        <p className="mt-2 text-sm text-slate-500">
          Estas imagenes aparecen en el banner grande del inicio. Usa URLs publicas de imagen.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_1fr]">
        <input
          value={newBanner.title}
          onChange={(event) => setNewBanner((current) => ({ ...current, title: event.target.value }))}
          placeholder="Titulo"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={newBanner.image}
          onChange={(event) => setNewBanner((current) => ({ ...current, image: event.target.value }))}
          placeholder="URL de imagen"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={newBanner.description}
          onChange={(event) => setNewBanner((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descripcion"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_96px]">
          <input
            value={newBanner.buttonLabel}
            onChange={(event) => setNewBanner((current) => ({ ...current, buttonLabel: event.target.value }))}
            placeholder="Texto del boton"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={newBanner.buttonLink}
            onChange={(event) => setNewBanner((current) => ({ ...current, buttonLink: event.target.value }))}
            placeholder="/ruta"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            type="number"
            value={newBanner.order}
            onChange={(event) => setNewBanner((current) => ({ ...current, order: Number(event.target.value) }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center justify-between gap-4 lg:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newBanner.active ?? true}
              onChange={(event) => setNewBanner((current) => ({ ...current, active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Activo
          </label>
          <button
            type="button"
            onClick={createBanner}
            disabled={creating}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {creating ? 'Creando...' : 'Crear banner'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedBanners.map((banner) => (
          <article key={banner.docId} className="grid gap-4 rounded-3xl border border-slate-200 p-4 lg:grid-cols-[180px_1fr]">
            <img src={banner.image} alt={banner.title} className="h-32 w-full rounded-2xl object-cover" />
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                <input
                  value={banner.title}
                  onChange={(event) => handleBannerChange(banner.docId, 'title', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <input
                  type="number"
                  value={banner.order ?? 0}
                  onChange={(event) => handleBannerChange(banner.docId, 'order', Number(event.target.value))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <input
                value={banner.image}
                onChange={(event) => handleBannerChange(banner.docId, 'image', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={banner.description}
                onChange={(event) => handleBannerChange(banner.docId, 'description', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                <input
                  value={banner.buttonLabel}
                  onChange={(event) => handleBannerChange(banner.docId, 'buttonLabel', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <input
                  value={banner.buttonLink}
                  onChange={(event) => handleBannerChange(banner.docId, 'buttonLink', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={banner.active ?? true}
                    onChange={(event) => handleBannerChange(banner.docId, 'active', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  Activo
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveBanner(banner)}
                    disabled={savingId === banner.docId}
                    className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
                  >
                    {savingId === banner.docId ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBanner(banner)}
                    disabled={savingId === banner.docId}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
