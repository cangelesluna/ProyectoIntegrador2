import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '../contexts/AuthContext';
import { defaultSiteSettings } from '../data/siteSettings';
import { db } from '../services/firebase';
import type { SiteSettings } from '../types';

export function MainLayout() {
  const { user, signOut } = useAuthContext();
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSiteSettings, ...(snapshot.data() as Partial<SiteSettings>) });
      }
    });

    return () => unsubscribe();
  }, []);

  const navLinks = useMemo(() => {
    const configuredLinks = settings.navLinks
      .filter((link) => link.visible)
      .map((link) => ({ path: link.path, label: link.label }));

    const roleLinks =
      user?.role === 'ADMIN'
        ? [
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/admin', label: 'Admin' },
          ]
        : user
          ? [{ path: '/mi-negocio', label: 'Mi negocio' }]
          : [];

    return [...configuredLinks, ...roleLinks].filter(
      (link, index, allLinks) => allLinks.findIndex((item) => item.path === link.path) === index
    );
  }, [settings.navLinks, user]);

  const themeMode = settings.themeMode ?? 'light';
  const themeStyle = {
    '--site-primary': settings.primaryColor || defaultSiteSettings.primaryColor,
    '--site-bg': settings.backgroundColor || defaultSiteSettings.backgroundColor,
    '--site-surface': settings.surfaceColor || defaultSiteSettings.surfaceColor,
    '--site-text': settings.textColor || defaultSiteSettings.textColor,
    '--site-muted': settings.mutedTextColor || defaultSiteSettings.mutedTextColor,
    '--site-border': settings.borderColor || defaultSiteSettings.borderColor,
    '--site-radius':
      settings.radiusStyle === 'square'
        ? '0.75rem'
        : settings.radiusStyle === 'soft'
          ? '1.25rem'
          : '2rem',
  } as CSSProperties;

  return (
    <div
      className={`site-theme min-h-screen bg-slate-50 text-slate-900 ${themeMode === 'dark' ? 'site-theme-dark' : 'site-theme-light'}`}
      style={themeStyle}
    >
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <NavLink to="/" className="flex items-center gap-3 text-xl font-semibold text-slate-900">
              {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.siteName} className="h-10 w-10 rounded-xl object-cover" /> : null}
              <span>{settings.siteName}</span>
            </NavLink>
            <p className="text-sm text-slate-500">{settings.slogan}</p>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={`${link.path}-${link.label}`}
                to={link.path}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-brand-600' : 'text-slate-600 hover:text-slate-900'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  {user.role}
                </span>
                {user.role === 'ADMIN' ? (
                  <NavLink
                    to="/admin"
                    className="rounded-full border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    Admin panel
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Salir
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Iniciar sesion
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-semibold text-slate-900">{settings.siteName}</p>
            <p className="mt-2 max-w-xl text-sm text-slate-500">{settings.slogan}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
              Terminos y condiciones
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
              Politica de privacidad
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
