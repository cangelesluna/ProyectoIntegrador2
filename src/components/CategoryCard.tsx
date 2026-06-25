import { Link } from 'react-router-dom';
import type { Category } from '../types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/categoria/${category.slug}`}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-40 overflow-hidden">
        <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-100">{category.businessCount} negocios</p>
          <h3 className="mt-1 text-2xl font-semibold">{category.name}</h3>
        </div>
      </div>
    </Link>
  );
}
