import { useState } from 'react';

export function LocationSelector() {
  const [open, setOpen] = useState(false);
  const locations = ['San Juan de Lurigancho', 'Arequipa', 'Chiclayo', 'Iquitos', 'Santa Anita'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm shadow-sm"
      >
        <span className="icon-ubicacion" />
        <span>San Juan de Lurigancho</span>
      </button>

      {open && (
        <ul className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white p-2 shadow">
          {locations.map((l) => (
            <li key={l} className="px-3 py-2 hover:bg-slate-50">
              <a href={`#${l.replace(/\s+/g, '-')}`} className="text-sm text-slate-700">
                {l}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
