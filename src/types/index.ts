export type UserRole = 'ADMIN' | 'OWNER' | 'VISITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  bannerType?: 'color' | 'image';
  bannerColor?: string;
  bannerImage?: string;
  businessCount: number;
  active?: boolean;
  order?: number;
}

export interface BusinessSection {
  id: string;
  title: string;
  content: string;
}

export interface Business {
  id: string;
  ownerId: string;
  categoryId: string;
  categoryIds?: string[];
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  thumbnail: string;
  address: string;
  district: string;
  zoneId?: string;
  googleMapsUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  openingHours?: string;
  featuredImageUrls?: string[];
  latitude: number;
  longitude: number;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  featured?: boolean;
  published?: boolean;
  pageThemeMode?: 'light' | 'dark';
  pagePrimaryColor?: string;
  pageBackgroundColor?: string;
  pageSurfaceColor?: string;
  pageTextColor?: string;
  pageRadiusStyle?: 'square' | 'soft' | 'rounded';
  reviewStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  lastOwnerUpdateAt?: string;
  reviewedAt?: string;
  sections?: BusinessSection[];
  createdAt: string;
}

export interface SiteNavLink {
  label: string;
  path: string;
  visible: boolean;
}

export interface SiteSettings {
  siteName: string;
  slogan: string;
  logoUrl?: string;
  welcomeTitle?: string;
  navLinks: SiteNavLink[];
  municipalityWhatsappUrl?: string;
  municipalityEmail?: string;
  municipalityWebsite?: string;
  municipalityDescription?: string;
  municipalityLocation?: string;
  themeMode?: 'light' | 'dark';
  primaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;
  radiusStyle?: 'square' | 'soft' | 'rounded';
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Promotion {
  id: string;
  businessId: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
}

export interface GalleryImage {
  id: string;
  businessId: string;
  image: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonLink: string;
  active?: boolean;
  order?: number;
}

export interface NewsPost {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  linkLabel: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Statistic {
  businessId: string;
  views: number;
  whatsappClicks: number;
  callClicks: number;
  emailClicks?: number;
  socialClicks: number;
  connectedHours?: number;
  lastVisitAt?: string;
  lastInteractionAt?: string;
  searchCount?: number;
  categoryViews?: number;
  popularProductIds: string[];
}

export interface AnalyticsEvent {
  id: string;
  type: 'search' | 'category_view' | 'business_view' | 'interaction';
  businessId?: string;
  categoryId?: string;
  term?: string;
  zoneId?: string;
  createdAt: string;
}
