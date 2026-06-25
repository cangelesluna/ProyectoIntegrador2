import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sampleCategories } from '../data/sampleData';
import type { Category } from '../types';

type EditableCategory = Category & { docId: string };

const emptyCategory: Omit<Category, 'id'> = {
  name: '',
  slug: '',
  icon: 'Store',
  image: '',
  bannerType: 'color',
  bannerColor: '#0c66d0',
  bannerImage: '',
  businessCount: 0,
  active: true,
  order: 1,
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminCategories() {
  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id'>>(emptyCategory);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories]
  );

  const selectedCategory = sortedCategories.find((category) => category.docId === selectedId) ?? sortedCategories[0] ?? null;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map((docItem) => ({
        docId: docItem.id,
        id: docItem.id,
        ...(docItem.data() as Omit<Category, 'id'>),
      }));
      setCategories(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedId]);

  const handleCategoryChange = (docId: string, field: keyof Category, value: string | boolean | number) => {
    setCategories((current) =>
      current.map((category) =>
        category.docId === docId ? { ...category, [field]: value } : category
      )
    );
  };

  const saveCategory = async (category: EditableCategory) => {
    setSavingId(category.docId);
    try {
      await updateDoc(doc(db, 'categories', category.docId), {
        name: category.name.trim(),
        slug: slugify(category.slug || category.name),
        icon: category.icon.trim() || 'Store',
        image: category.image.trim(),
        bannerType: category.bannerType ?? 'color',
        bannerColor: category.bannerColor || '#0c66d0',
        bannerImage: category.bannerImage?.trim() ?? '',
        businessCount: Number(category.businessCount ?? 0),
        active: category.active ?? true,
        order: Number(category.order ?? 0),
      });
      window.alert('Categoria actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando categoria:', error);
      window.alert('Error actualizando categoria: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSavingId(null);
    }
  };

  const createCategory = async () => {
    if (!newCategory.name.trim()) {
      window.alert('Agrega el nombre de la categoria.');
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'categories'), {
        ...newCategory,
        slug: slugify(newCategory.slug || newCategory.name),
        businessCount: Number(newCategory.businessCount ?? 0),
        order: Number(newCategory.order ?? sortedCategories.length + 1),
      });
      setNewCategory({ ...emptyCategory, order: sortedCategories.length + 2 });
      window.alert('Categoria creada correctamente.');
    } catch (error) {
      console.error('Error creando categoria:', error);
      window.alert('Error creando categoria: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCreating(false);
    }
  };

  const removeCategory = async (category: EditableCategory) => {
    const confirmed = window.confirm(`Eliminar la categoria "${category.name}"?`);
    if (!confirmed) return;

    setSavingId(category.docId);
    try {
      await deleteDoc(doc(db, 'categories', category.docId));
      setSelectedId('');
    } catch (error) {
      console.error('Error eliminando categoria:', error);
      window.alert('Error eliminando categoria: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSavingId(null);
    }
  };

  const seedDefaultCategories = async () => {
    const confirmed = window.confirm('Esto reemplazara todas las categorias actuales por las 10 categorias predeterminadas. Continuar?');
    if (!confirmed) return;

    setSeeding(true);
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      const batch = writeBatch(db);

      snapshot.docs.forEach((docItem) => {
        batch.delete(doc(db, 'categories', docItem.id));
      });

      sampleCategories.forEach((category) => {
        const categoryRef = doc(db, 'categories', category.id);
        const { id, ...payload } = category;
        batch.set(categoryRef, payload);
      });

      await batch.commit();
      setSelectedId(sampleCategories[0].id);
      window.alert('Categorias predeterminadas aplicadas correctamente.');
    } catch (error) {
      console.error('Error sembrando categorias:', error);
      window.alert('Error sembrando categorias: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Categorias</p>
          <h2 className="text-2xl font-semibold text-slate-900">Miniaturas y categorias del inicio</h2>
          <p className="mt-2 text-sm text-slate-500">
            Selecciona una categoria de la grilla para actualizar su miniatura, nombre, orden y visibilidad.
          </p>
        </div>
        <button
          type="button"
          onClick={seedDefaultCategories}
          disabled={seeding}
          className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
        >
          {seeding ? 'Aplicando...' : 'Aplicar categorias base'}
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-3 gap-x-5 gap-y-8">
            {sortedCategories.map((category) => (
              <button
                key={category.docId}
                type="button"
                onClick={() => setSelectedId(category.docId)}
                className={`group flex flex-col items-center gap-3 text-center transition ${
                  selectedCategory?.docId === category.docId ? 'text-brand-700' : 'text-slate-900'
                }`}
              >
                <span
                  className={`h-20 w-20 overflow-hidden rounded-full border-2 bg-slate-100 transition group-hover:scale-105 ${
                    selectedCategory?.docId === category.docId ? 'border-brand-500' : 'border-transparent'
                  }`}
                >
                  <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                </span>
                <span className="text-xs font-semibold leading-4">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          {selectedCategory ? (
            <>
              <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                <img src={selectedCategory.image} alt={selectedCategory.name} className="h-44 w-full rounded-3xl object-cover" />
                <div className="grid gap-3">
                  <input
                    value={selectedCategory.name}
                    onChange={(event) => handleCategoryChange(selectedCategory.docId, 'name', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                    placeholder="Nombre"
                  />
                  <input
                    value={selectedCategory.image}
                    onChange={(event) => handleCategoryChange(selectedCategory.docId, 'image', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                    placeholder="URL de miniatura"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto] sm:items-center">
                    <input
                      value={selectedCategory.slug}
                      onChange={(event) => handleCategoryChange(selectedCategory.docId, 'slug', slugify(event.target.value))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                      placeholder="slug"
                    />
                    <input
                      type="number"
                      value={selectedCategory.order ?? 0}
                      onChange={(event) => handleCategoryChange(selectedCategory.docId, 'order', Number(event.target.value))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedCategory.active ?? true}
                        onChange={(event) => handleCategoryChange(selectedCategory.docId, 'active', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      />
                      Activa
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <select
                      value={selectedCategory.bannerType ?? 'color'}
                      onChange={(event) => handleCategoryChange(selectedCategory.docId, 'bannerType', event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="color">Color solido</option>
                      <option value="image">Imagen</option>
                    </select>
                    {selectedCategory.bannerType === 'image' ? (
                      <input
                        value={selectedCategory.bannerImage ?? ''}
                        onChange={(event) => handleCategoryChange(selectedCategory.docId, 'bannerImage', event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                        placeholder="URL publica del banner"
                      />
                    ) : (
                      <div className="grid grid-cols-[56px_1fr] gap-3">
                        <input
                          type="color"
                          value={selectedCategory.bannerColor ?? '#0c66d0'}
                          onChange={(event) => handleCategoryChange(selectedCategory.docId, 'bannerColor', event.target.value)}
                          className="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1"
                        />
                        <input
                          value={selectedCategory.bannerColor ?? '#0c66d0'}
                          onChange={(event) => handleCategoryChange(selectedCategory.docId, 'bannerColor', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                          placeholder="#0c66d0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => saveCategory(selectedCategory)}
                  disabled={savingId === selectedCategory.docId}
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
                >
                  {savingId === selectedCategory.docId ? 'Guardando...' : 'Guardar miniatura'}
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(selectedCategory)}
                  disabled={savingId === selectedCategory.docId}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  Eliminar
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No hay categorias creadas.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_1fr]">
        <input
          value={newCategory.name}
          onChange={(event) => setNewCategory((current) => ({ ...current, name: event.target.value, slug: slugify(event.target.value) }))}
          placeholder="Nueva categoria"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={newCategory.image}
          onChange={(event) => setNewCategory((current) => ({ ...current, image: event.target.value }))}
          placeholder="URL de miniatura"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <div className="flex justify-end lg:col-span-2">
          <button
            type="button"
            onClick={createCategory}
            disabled={creating}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {creating ? 'Creando...' : 'Crear categoria'}
          </button>
        </div>
      </div>
    </section>
  );
}
