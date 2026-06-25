import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { db } from '../services/firebase';
import type { NewsPost } from '../types';

type EditableNewsPost = NewsPost & { docId: string };

const emptyPost: Omit<NewsPost, 'id'> = {
  title: '',
  description: '',
  image: '',
  link: '',
  linkLabel: 'Leer mas',
  published: true,
  createdAt: '',
};

export function AdminNews() {
  const [posts, setPosts] = useState<EditableNewsPost[]>([]);
  const [newPost, setNewPost] = useState<Omit<NewsPost, 'id'>>(emptyPost);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [posts]
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      setPosts(
        snapshot.docs.map((docItem) => ({
          docId: docItem.id,
          id: docItem.id,
          ...(docItem.data() as Omit<NewsPost, 'id'>),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  const handlePostChange = (docId: string, field: keyof NewsPost, value: string | boolean) => {
    setPosts((current) =>
      current.map((post) =>
        post.docId === docId ? { ...post, [field]: value } : post
      )
    );
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.description.trim()) {
      window.alert('Agrega al menos titulo y descripcion.');
      return;
    }

    setCreating(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'news'), {
        title: newPost.title.trim(),
        description: newPost.description.trim(),
        image: newPost.image.trim(),
        link: newPost.link.trim(),
        linkLabel: newPost.linkLabel.trim() || 'Leer mas',
        published: newPost.published,
        createdAt: now,
        updatedAt: now,
      });
      setNewPost(emptyPost);
      window.alert('Novedad creada correctamente.');
    } catch (error) {
      console.error('Error creando novedad:', error);
      window.alert('Error creando novedad: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCreating(false);
    }
  };

  const savePost = async (post: EditableNewsPost) => {
    setSavingId(post.docId);
    try {
      await updateDoc(doc(db, 'news', post.docId), {
        title: post.title.trim(),
        description: post.description.trim(),
        image: post.image.trim(),
        link: post.link.trim(),
        linkLabel: post.linkLabel.trim() || 'Leer mas',
        published: post.published,
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      window.alert('Novedad actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando novedad:', error);
      window.alert('Error actualizando novedad: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSavingId(null);
    }
  };

  const removePost = async (post: EditableNewsPost) => {
    const confirmed = window.confirm(`Eliminar la novedad "${post.title}"?`);
    if (!confirmed) return;

    setSavingId(post.docId);
    try {
      await deleteDoc(doc(db, 'news', post.docId));
    } catch (error) {
      console.error('Error eliminando novedad:', error);
      window.alert('Error eliminando novedad: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Contenido publico</p>
        <h2 className="text-2xl font-semibold text-slate-900">Novedades y noticias</h2>
        <p className="mt-2 text-sm text-slate-500">
          Publica noticias con imagen, descripcion y enlace. La publicacion mas reciente aparece primero.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">
        <input
          value={newPost.title}
          onChange={(event) => setNewPost((current) => ({ ...current, title: event.target.value }))}
          placeholder="Titulo de la novedad"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={newPost.image}
          onChange={(event) => setNewPost((current) => ({ ...current, image: event.target.value }))}
          placeholder="URL publica de imagen"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <textarea
          value={newPost.description}
          onChange={(event) => setNewPost((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descripcion"
          rows={3}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 lg:col-span-2"
        />
        <input
          value={newPost.link}
          onChange={(event) => setNewPost((current) => ({ ...current, link: event.target.value }))}
          placeholder="Enlace externo o ruta interna"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={newPost.linkLabel}
          onChange={(event) => setNewPost((current) => ({ ...current, linkLabel: event.target.value }))}
          placeholder="Texto del enlace"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
        />
        <div className="flex items-center justify-between gap-4 lg:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newPost.published}
              onChange={(event) => setNewPost((current) => ({ ...current, published: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Publicada
          </label>
          <button
            type="button"
            onClick={createPost}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Creando...' : 'Crear novedad'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPosts.map((post) => (
          <article key={post.docId} className="grid gap-4 rounded-3xl border border-slate-200 p-4 lg:grid-cols-[180px_1fr]">
            <div className="h-36 overflow-hidden rounded-2xl bg-slate-100">
              {post.image ? (
                <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <input
                value={post.title}
                onChange={(event) => handlePostChange(post.docId, 'title', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={post.image}
                onChange={(event) => handlePostChange(post.docId, 'image', event.target.value)}
                placeholder="URL publica de imagen"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <textarea
                value={post.description}
                onChange={(event) => handlePostChange(post.docId, 'description', event.target.value)}
                rows={3}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto_auto] md:items-center">
                <input
                  value={post.link}
                  onChange={(event) => handlePostChange(post.docId, 'link', event.target.value)}
                  placeholder="Enlace"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <input
                  value={post.linkLabel}
                  onChange={(event) => handlePostChange(post.docId, 'linkLabel', event.target.value)}
                  placeholder="Texto"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={post.published}
                    onChange={(event) => handlePostChange(post.docId, 'published', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  Visible
                </label>
                <div className="flex gap-2">
                  {post.link ? (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Abrir enlace"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => savePost(post)}
                    disabled={savingId === post.docId}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
                  >
                    {savingId === post.docId ? '...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePost(post)}
                    disabled={savingId === post.docId}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                    aria-label="Eliminar novedad"
                  >
                    <Trash2 className="h-4 w-4" />
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
