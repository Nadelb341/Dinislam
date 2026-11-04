import { useState } from 'react';
import { lireFantome, quitterFantome } from '@/lib/modeFantome';

/** 👻 Bandeau toujours visible en mode fantôme : de qui c'est le compte, et le bouton pour revenir au sien */
export function BandeauFantome() {
  const [f] = useState(lireFantome);
  const [busy, setBusy] = useState(false);
  if (!f) return null;
  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-violet-700 px-3 py-2 text-white shadow-md">
      <p className="text-sm font-bold text-center">
        👻 Mode fantôme : tu es dans le compte de <span className="underline decoration-2 underline-offset-2">{f.eleveNom}</span>
        <span className="block text-[11px] font-medium opacity-90 sm:inline sm:ms-2">tout ce que tu fais compte pour lui ou elle</span>
      </p>
      <button type="button" disabled={busy} onClick={() => { setBusy(true); void quitterFantome(); }}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-violet-800 shadow active:scale-95 disabled:opacity-60">
        {busy ? '⏳ Retour…' : '↩️ Revenir à mon compte'}
      </button>
    </div>
  );
}
