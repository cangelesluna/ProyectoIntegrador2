import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { defaultSiteSettings } from '../data/siteSettings';
import { db } from '../services/firebase';
import type { SiteSettings } from '../types';

export function NewsletterSubscribe() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSiteSettings, ...(snapshot.data() as Partial<SiteSettings>) });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="grid gap-5 rounded-3xl bg-white p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Municipalidad</p>
        <h3 className="mt-1 text-2xl font-semibold text-slate-900">Canales oficiales de San Juan de Lurigancho</h3>
        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <a href={`mailto:${settings.municipalityEmail}`} className="hover:text-brand-600">
            {settings.municipalityEmail}
          </a>
          <a href={settings.municipalityWebsite} target="_blank" rel="noreferrer" className="hover:text-brand-600">
            {settings.municipalityWebsite?.replace(/^https?:\/\//, '')}
          </a>
          <span>{settings.municipalityDescription}</span>
          <span>{settings.municipalityLocation}</span>
        </div>
      </div>
      <a
        href={settings.municipalityWhatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
      >
        Comunicarme por WhatsApp
      </a>
    </div>
  );
}
