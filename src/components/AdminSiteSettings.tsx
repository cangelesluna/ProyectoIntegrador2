import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { defaultSiteSettings } from '../data/siteSettings';
import type { SiteSettings } from '../types';

export function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSiteSettings, ...(snapshot.data() as Partial<SiteSettings>) });
      }
    });

    return () => unsubscribe();
  }, []);

  const updateNavLink = (index: number, field: 'label' | 'path' | 'visible', value: string | boolean) => {
    setSettings((current) => ({
      ...current,
      navLinks: current.navLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const addNavLink = () => {
    setSettings((current) => ({
      ...current,
      navLinks: [...current.navLinks, { label: 'Nuevo enlace', path: '/', visible: true }],
    }));
  };

  const removeNavLink = (index: number) => {
    setSettings((current) => ({
      ...current,
      navLinks: current.navLinks.filter((_, linkIndex) => linkIndex !== index),
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), settings, { merge: true });
      window.alert('Configuracion guardada correctamente.');
    } catch (error) {
      console.error('Error guardando configuracion:', error);
      window.alert('Error guardando configuracion: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Sitio</p>
        <h2 className="text-2xl font-semibold text-slate-900">Logo, eslogan y barra de menu</h2>
        <p className="mt-2 text-sm text-slate-500">
          Personaliza lo que se muestra en la cabecera y pantalla principal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <input
          value={settings.siteName}
          onChange={(event) => setSettings((current) => ({ ...current, siteName: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          placeholder="Nombre del sitio"
        />
        <input
          value={settings.logoUrl ?? ''}
          onChange={(event) => setSettings((current) => ({ ...current, logoUrl: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          placeholder="URL del logo"
        />
        <input
          value={settings.slogan}
          onChange={(event) => setSettings((current) => ({ ...current, slogan: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          placeholder="Eslogan"
        />
        <input
          value={settings.welcomeTitle ?? ''}
          onChange={(event) => setSettings((current) => ({ ...current, welcomeTitle: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          placeholder="Titulo de bienvenida"
        />
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Canales oficiales de la Municipalidad</h3>
          <p className="mt-1 text-sm text-slate-500">Estos datos aparecen en la pagina principal.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <input
            value={settings.municipalityWhatsappUrl ?? ''}
            onChange={(event) => setSettings((current) => ({ ...current, municipalityWhatsappUrl: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            placeholder="URL de WhatsApp municipal"
          />
          <input
            value={settings.municipalityEmail ?? ''}
            onChange={(event) => setSettings((current) => ({ ...current, municipalityEmail: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            placeholder="Correo municipal"
          />
          <input
            value={settings.municipalityWebsite ?? ''}
            onChange={(event) => setSettings((current) => ({ ...current, municipalityWebsite: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            placeholder="Pagina oficial"
          />
          <input
            value={settings.municipalityLocation ?? ''}
            onChange={(event) => setSettings((current) => ({ ...current, municipalityLocation: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            placeholder="Ubicacion"
          />
          <input
            value={settings.municipalityDescription ?? ''}
            onChange={(event) => setSettings((current) => ({ ...current, municipalityDescription: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm lg:col-span-2"
            placeholder="Descripcion breve"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Diseno visual</h3>
          <p className="mt-1 text-sm text-slate-500">Personaliza modo, colores y forma general de la pagina.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Vista
            <select
              value={settings.themeMode ?? 'light'}
              onChange={(event) => setSettings((current) => ({ ...current, themeMode: event.target.value as SiteSettings['themeMode'] }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="light">Clara</option>
              <option value="dark">Oscura</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Forma
            <select
              value={settings.radiusStyle ?? 'rounded'}
              onChange={(event) => setSettings((current) => ({ ...current, radiusStyle: event.target.value as SiteSettings['radiusStyle'] }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="square">Recta</option>
              <option value="soft">Suave</option>
              <option value="rounded">Redondeada</option>
            </select>
          </label>
          {[
            ['primaryColor', 'Color principal'],
            ['backgroundColor', 'Fondo'],
            ['surfaceColor', 'Superficies'],
            ['textColor', 'Texto'],
            ['mutedTextColor', 'Texto secundario'],
            ['borderColor', 'Bordes'],
          ].map(([field, label]) => (
            <label key={field} className="grid gap-2 text-sm font-medium text-slate-700">
              {label}
              <div className="grid grid-cols-[48px_1fr] gap-2">
                <input
                  type="color"
                  value={(settings[field as keyof SiteSettings] as string) ?? '#ffffff'}
                  onChange={(event) => setSettings((current) => ({ ...current, [field]: event.target.value }))}
                  className="h-12 w-12 rounded-xl border border-slate-200 bg-white p-1"
                />
                <input
                  value={(settings[field as keyof SiteSettings] as string) ?? ''}
                  onChange={(event) => setSettings((current) => ({ ...current, [field]: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="#000000"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Enlaces del menu</h3>
          <button type="button" onClick={addNavLink} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Agregar enlace
          </button>
        </div>
        {settings.navLinks.map((link, index) => (
          <div key={`${link.path}-${index}`} className="grid gap-3 rounded-2xl bg-white p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
            <input
              value={link.label}
              onChange={(event) => updateNavLink(index, 'label', event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <input
              value={link.path}
              onChange={(event) => updateNavLink(index, 'path', event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={link.visible}
                onChange={(event) => updateNavLink(index, 'visible', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Visible
            </label>
            <button type="button" onClick={() => removeNavLink(index)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </section>
  );
}
