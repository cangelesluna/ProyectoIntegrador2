import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { BusinessCard } from '../components/BusinessCard';
import { SearchBar } from '../components/SearchBar';
import { sampleCategories } from '../data/sampleData';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import type { Business, Category } from '../types';

function businessCategoryIds(business: Business) {
  return business.categoryIds?.length ? business.categoryIds : [business.categoryId].filter(Boolean);
}

export function CategoryPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function loadCategory() {
      if (!slug) {
        setCategory(null);
        return;
      }

      try {
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoryData =
          categoriesSnapshot.docs
            .map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Category, 'id'>) }))
            .find((categoryItem) => categoryItem.slug === slug) ??
          sampleCategories.find((categoryItem) => categoryItem.slug === slug) ??
          null;

        setCategory(categoryData);
      } catch (error) {
        console.error('Error cargando categoria:', error);
        setCategory(sampleCategories.find((categoryItem) => categoryItem.slug === slug) ?? null);
      }
    }

    loadCategory();
  }, [slug]);

  useEffect(() => {
    if (!category) {
      setBusinesses([]);
      return;
    }

    addDoc(collection(db, 'analytics'), {
      type: 'category_view',
      categoryId: category.id,
      createdAt: new Date().toISOString(),
    }).catch((error) => console.error('Error registrando vista de categoria:', error));

    const mergeAndFilter = (publicItems: Business[], ownerItems: Business[] = []) => {
        const mergedBusinesses = new Map<string, Business>();

      publicItems.forEach((business) => {
        mergedBusinesses.set(business.id, business);
        });

      ownerItems.forEach((business) => {
        mergedBusinesses.set(business.id, business);
        });

        setBusinesses(
          Array.from(mergedBusinesses.values()).filter((business) =>
            businessCategoryIds(business).includes(category.id)
          )
        );
    };

    let latestPublic: Business[] = [];
    let latestOwner: Business[] = [];

    const unsubscribePublic = onSnapshot(
      query(collection(db, 'businesses'), where('published', '==', true)),
      (snapshot) => {
        latestPublic = snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Business, 'id'>) }));
        mergeAndFilter(latestPublic, latestOwner);
      },
      (error) => {
        console.error('Error cargando negocios publicados:', error);
      }
    );

    const unsubscribeOwner = user
      ? onSnapshot(
          query(collection(db, 'businesses'), where('ownerId', '==', user.id)),
          (snapshot) => {
            latestOwner = snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Omit<Business, 'id'>) }));
            mergeAndFilter(latestPublic, latestOwner);
          },
          (error) => {
            console.error('Error cargando negocios del owner:', error);
          }
        )
      : undefined;

    return () => {
      unsubscribePublic();
      unsubscribeOwner?.();
    };
  }, [category, user]);

  const filtered = useMemo(
    () =>
      businesses.filter((business) =>
        [business.name, business.description, business.address, business.district]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [businesses, search]
  );

  if (!category) {
    return <p className="text-slate-600">Categoria no encontrada.</p>;
  }

  const categoryBannerStyle: CSSProperties =
    category.bannerType === 'image' && category.bannerImage
      ? {
          backgroundImage: `linear-gradient(90deg, rgba(12, 102, 208, 0.86), rgba(15, 23, 42, 0.78)), url(${category.bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {
          background: `linear-gradient(120deg, ${category.bannerColor || '#0c66d0'}, #0f172a)`,
        };

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-[2rem] px-6 py-12 text-white shadow-soft sm:px-10"
        style={categoryBannerStyle}
      >
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.24em] text-brand-200">{category.name}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{category.name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-brand-100">
            Explora los negocios de esta categoria y encuentra lo que necesitas.
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Negocios en {category.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Se muestran en cuadros responsivos de tres columnas en pantallas amplias.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length > 0 ? (
          filtered.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))
        ) : (
          <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm sm:col-span-2 lg:col-span-3">
            No hay negocios publicados en esta categoria por ahora.
          </div>
        )}
      </section>
    </div>
  );
}
