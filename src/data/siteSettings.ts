import type { SiteSettings } from '../types';

export const defaultSiteSettings: SiteSettings = {
  siteName: 'Directorio Digital',
  slogan: 'Explora negocios y servicios en tu ciudad',
  logoUrl: '',
  welcomeTitle: 'Bienvenido a Directorio Digital',
  municipalityWhatsappUrl: 'https://wa.me/?text=Hola%2C%20quisiera%20comunicarme%20con%20la%20Municipalidad%20de%20San%20Juan%20de%20Lurigancho.',
  municipalityEmail: 'informes@munisjl.gob.pe',
  municipalityWebsite: 'https://www.gob.pe/munisjl',
  municipalityDescription: 'Atencion ciudadana y orientacion municipal',
  municipalityLocation: 'San Juan de Lurigancho, Lima',
  themeMode: 'light',
  primaryColor: '#0c66d0',
  backgroundColor: '#f8fafc',
  surfaceColor: '#ffffff',
  textColor: '#0f172a',
  mutedTextColor: '#64748b',
  borderColor: '#e2e8f0',
  radiusStyle: 'rounded',
  navLinks: [
    { label: 'Inicio', path: '/', visible: true },
    { label: 'Gastronomia', path: '/categoria/gastronomia-alimentacion', visible: true },
    { label: 'Comercio', path: '/categoria/comercio-local-abastecimiento', visible: true },
    { label: 'Hogar', path: '/categoria/servicios-hogar-mantenimiento', visible: true },
  ],
};
