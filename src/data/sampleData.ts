import type { Banner, Category, Business, Product, Promotion } from '../types';

export const sampleBanners: Banner[] = [
  {
    id: 'banner-1',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
    title: 'Encuentra negocios cerca de ti',
    description: 'Explora empresas, productos y servicios sin necesidad de registrarte.',
    buttonLabel: 'Ver negocios',
    buttonLink: '/'
  }
];

export const sampleCategories: Category[] = [
  {
    id: 'gastronomia-alimentacion',
    name: 'Gastronomía y Alimentación',
    slug: 'gastronomia-alimentacion',
    icon: 'Utensils',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 1
  },
  {
    id: 'comercio-local-abastecimiento',
    name: 'Comercio Local y Abastecimiento',
    slug: 'comercio-local-abastecimiento',
    icon: 'Store',
    image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 2
  },
  {
    id: 'servicios-hogar-mantenimiento',
    name: 'Servicios del Hogar y Mantenimiento',
    slug: 'servicios-hogar-mantenimiento',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 3
  },
  {
    id: 'textil-confeccion-calzado',
    name: 'Textil, Confección y Calzado',
    slug: 'textil-confeccion-calzado',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 4
  },
  {
    id: 'belleza-cuidado-personal',
    name: 'Belleza y Cuidado Personal',
    slug: 'belleza-cuidado-personal',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 5
  },
  {
    id: 'servicios-tecnicos-automotrices',
    name: 'Servicios Técnicos y Automotrices',
    slug: 'servicios-tecnicos-automotrices',
    icon: 'Car',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 6
  },
  {
    id: 'transporte-logistica-local',
    name: 'Transporte y Logística Local',
    slug: 'transporte-logistica-local',
    icon: 'Truck',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 7
  },
  {
    id: 'salud-bienestar-mascotas',
    name: 'Salud, Bienestar y Mascotas',
    slug: 'salud-bienestar-mascotas',
    icon: 'HeartPulse',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 8
  },
  {
    id: 'servicios-profesionales-digitales',
    name: 'Servicios Profesionales y Digitales',
    slug: 'servicios-profesionales-digitales',
    icon: 'Laptop',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 9
  },
  {
    id: 'oficios-servicios-especializados',
    name: 'Oficios Varios y Servicios Especializados',
    slug: 'oficios-servicios-especializados',
    icon: 'Hammer',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    businessCount: 0,
    active: true,
    order: 10
  }
];

export const sampleBusinesses: Business[] = [
  {
    id: 'biz-1',
    ownerId: 'owner-1',
    categoryId: 'gastronomia-alimentacion',
    categoryIds: ['gastronomia-alimentacion'],
    name: 'Sabor Urbano',
    slug: 'sabor-urbano',
    description: 'Cocina moderna con ingredientes locales.',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    address: 'Av. Principal 123, Distrito Centro',
    district: 'Centro',
    phone: '+51 999 888 777',
    whatsapp: '+51999888777',
    email: 'contacto@saborurbano.pe',
    website: 'https://saborurbano.pe',
    latitude: -12.0464,
    longitude: -77.0428,
    facebook: 'saborurbano',
    instagram: 'sabor.urbano',
    tiktok: 'saborurbano',
    youtube: '',
    linkedin: '',
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'biz-2',
    ownerId: 'owner-2',
    categoryId: 'comercio-local-abastecimiento',
    categoryIds: ['comercio-local-abastecimiento'],
    name: 'Mercado Local',
    slug: 'mercado-local',
    description: 'Tienda de productos y presentes para tu hogar.',
    logo: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5d7?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5d7?auto=format&fit=crop&w=400&q=80',
    address: 'Calle Comercio 45, Zona Norte',
    district: 'Norte',
    phone: '+51 988 777 666',
    whatsapp: '+51988777666',
    email: 'hello@mercadolocal.pe',
    website: 'https://mercadolocal.pe',
    latitude: -12.0410,
    longitude: -77.0280,
    featured: false,
    createdAt: new Date().toISOString()
  }
];

export const sampleProducts: Product[] = [
  {
    id: 'prod-1',
    businessId: 'biz-1',
    name: 'Combo Ejecutivo',
    description: 'Plato principal + bebida + postre.',
    price: 45,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
  }
];

export const samplePromotions: Promotion[] = [
  {
    id: 'promo-1',
    businessId: 'biz-1',
    title: '20% Descuento en almuerzos',
    description: 'Promoción válida de lunes a viernes.',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
  }
];
