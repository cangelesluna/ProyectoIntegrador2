import { useState } from 'react';

export function PopupEvent() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-xl rounded-2xl bg-white p-6">
        <button onClick={() => setOpen(false)} className="ml-auto rounded bg-slate-100 px-3 py-1">Cerrar</button>
        <h2 className="mt-2 text-2xl font-semibold">Déjanos tus datos y no olvides este evento</h2>
        <form className="mt-4 grid gap-3">
          <input placeholder="Nombres" className="rounded border p-3" />
          <input placeholder="Apellidos" className="rounded border p-3" />
          <input type="email" placeholder="Correo electrónico" className="rounded border p-3" />
          <div className="flex items-center gap-2">
            <input id="acepta" type="checkbox" defaultChecked />
            <label htmlFor="acepta">Acepto términos y políticas</label>
          </div>
          <button className="rounded-2xl bg-brand-600 px-4 py-3 text-white">Recordar</button>
        </form>
      </div>
    </div>
  );
}
