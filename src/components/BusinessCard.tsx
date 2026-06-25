import { Link } from 'react-router-dom';
import { useState } from 'react';
import { zoneLabel } from '../data/zones';
import type { Business } from '../types';

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const description =
    business.description.length > 180 ? `${business.description.slice(0, 180).trim()}...` : business.description;
  const businessPath = `/negocio/${business.slug || business.id}`;
  const imageSource = business.thumbnail || business.coverImage || business.logo;
  const initials = business.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to={businessPath}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.14)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imageSource && !imageFailed ? (
          <img
            src={imageSource}
            alt={business.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-slate-200 text-4xl font-semibold text-brand-700">
            {initials || 'N'}
          </div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          {business.logo && !logoFailed ? (
            <img
              src={business.logo}
              alt={`${business.name} logo`}
              onError={() => setLogoFailed(true)}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700">
              {initials || 'N'}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">{business.name}</h3>
            <p className="text-sm text-slate-500">{zoneLabel(business.zoneId)}</p>
          </div>
        </div>
        <p className="min-h-[96px] text-sm leading-6 text-slate-600">{description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {(business.categoryIds?.length ?? 0) > 1 ? `${business.categoryIds?.length} categorias` : '1 categoria'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{business.address || zoneLabel(business.zoneId)}</span>
        </div>
      </div>
    </Link>
  );
}
