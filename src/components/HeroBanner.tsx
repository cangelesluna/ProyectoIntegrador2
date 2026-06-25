import type { Banner } from '../types';

interface HeroBannerProps {
  banner: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
      <img
        src={banner.image}
        alt={banner.title}
        className="h-[420px] w-full object-cover opacity-90 sm:h-[520px]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-12">
          <p className="mb-4 max-w-xl rounded-full bg-brand-500/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-brand-200">
            Directorio digital
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {banner.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {banner.description}
          </p>
          <a
            href={banner.buttonLink}
            className="mt-10 inline-flex items-center justify-center rounded-full bg-brand-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-500"
          >
            {banner.buttonLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
