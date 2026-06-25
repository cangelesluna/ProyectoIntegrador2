import type { Category } from '../types';

export function QuickLinks({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      {categories.map((cat) => (
        <a key={cat.id} href={`/categoria/${cat.slug}`} className="flex flex-col items-center gap-2 text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100 p-3">
            <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
          </div>
          <small className="text-xs text-slate-700">{cat.name}</small>
        </a>
      ))}
    </div>
  );
}
