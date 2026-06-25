import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { zoneLabel } from '../data/zones';
import type { Business } from '../types';

type AdminBusiness = Business & { docId: string };

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
  const baseSlug = slugify(name) || 'negocio';
  return `${baseSlug}-${businessId.slice(0, 6).toLowerCase()}`;
}

export function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        setBusinesses(
          snapshot.docs
            .map((docItem) => ({ docId: docItem.id, ...(docItem.data() as Business) }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando negocios:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const ensureSlug = async (business: AdminBusiness) => {
    if (business.slug) return business.slug;
    const nextSlug = businessSlug(business.name, business.docId);
    await updateDoc(doc(db, 'businesses', business.docId), { slug: nextSlug });
    return nextSlug;
  };

  const toggleVisibility = async (business: AdminBusiness) => {
    setWorkingId(business.docId);
    try {
      await updateDoc(doc(db, 'businesses', business.docId), {
        published: !(business.published ?? false),
        slug: business.slug || businessSlug(business.name, business.docId),
      });
    } catch (error) {
      console.error('Error cambiando visibilidad:', error);
      window.alert('Error cambiando visibilidad: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorkingId(null);
    }
  };

  const resetStats = async (business: AdminBusiness) => {
    const confirmed = window.confirm(`Reiniciar metricas de "${business.name}"?`);
    if (!confirmed) return;

    setWorkingId(business.docId);
    try {
      await setDoc(
        doc(db, 'statistics', business.docId),
        {
          businessId: business.docId,
          views: 0,
          whatsappClicks: 0,
          callClicks: 0,
          emailClicks: 0,
          socialClicks: 0,
          popularProductIds: [],
          lastInteractionAt: '',
          lastVisitAt: '',
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error reiniciando metricas:', error);
      window.alert('Error reiniciando metricas: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorkingId(null);
    }
  };

  const deleteBusiness = async (business: AdminBusiness) => {
    const confirmed = window.confirm(`Eliminar definitivamente "${business.name}" y sus productos/promociones?`);
    if (!confirmed) return;

    setWorkingId(business.docId);
    try {
      const [productsSnapshot, promotionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('businessId', '==', business.docId))),
        getDocs(query(collection(db, 'promotions'), where('businessId', '==', business.docId))),
      ]);

      const batch = writeBatch(db);
      productsSnapshot.docs.forEach((item) => batch.delete(doc(db, 'products', item.id)));
      promotionsSnapshot.docs.forEach((item) => batch.delete(doc(db, 'promotions', item.id)));
      batch.delete(doc(db, 'businesses', business.docId));
      await batch.commit();

      try {
        await deleteDoc(doc(db, 'statistics', business.docId));
      } catch {
        // Statistics may not exist yet.
      }
    } catch (error) {
      console.error('Error eliminando negocio:', error);
      window.alert('Error eliminando negocio: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Cargando negocios...</div>;
  }

  return (
    <div className="space-y-6 rounded-3xl bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Negocios</p>
        <h1 className="text-3xl font-semibold text-slate-900">Administrar paginas de owners</h1>
        <p className="mt-2 text-sm text-slate-500">
          Usa esta lista para abrir la edicion completa, ver la pagina publica, ocultar, reiniciar metricas o eliminar negocios.
        </p>
      </div>

      <div className="grid gap-4">
        {businesses.map((business) => (
          <article key={business.docId} className="grid gap-4 rounded-3xl border border-slate-200 p-5 lg:grid-cols-[96px_1fr_auto] lg:items-center">
            <div className="h-24 w-24 overflow-hidden rounded-2xl bg-slate-100">
              {business.thumbnail || business.coverImage || business.logo ? (
                <img src={business.thumbnail || business.coverImage || business.logo} alt={business.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand-700">
                  {business.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{business.name}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  business.published ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {business.published ? 'Visible' : 'Oculto'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Owner: {business.ownerId}</p>
              <p className="mt-1 text-sm text-slate-500">{zoneLabel(business.zoneId)} · {business.address || 'Sin direccion'}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{business.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                to={`/mi-negocio?business=${business.docId}`}
                className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
              >
                Editar pagina
              </Link>
              <button
                type="button"
                onClick={async () => {
                  const slug = await ensureSlug(business);
                  window.open(`/negocio/${slug}`, '_blank');
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver
              </button>
              <button
                type="button"
                onClick={() => toggleVisibility(business)}
                disabled={workingId === business.docId}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {business.published ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                onClick={() => resetStats(business)}
                disabled={workingId === business.docId}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                Reiniciar
              </button>
              <button
                type="button"
                onClick={() => deleteBusiness(business)}
                disabled={workingId === business.docId}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
