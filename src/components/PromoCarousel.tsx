import { useEffect, useState } from 'react';
import type { Promotion } from '../types';

export function PromoCarousel({ promotions }: { promotions: Promotion[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % promotions.length), 5000);
    return () => clearInterval(t);
  }, [promotions]);

  if (promotions.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="h-52 w-full">
        <img src={promotions[index].image} alt={promotions[index].title} className="h-full w-full object-cover" />
      </div>
      <div className="absolute right-4 bottom-4 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-900">
        {index + 1}/{promotions.length}
      </div>
    </div>
  );
}
