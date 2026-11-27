import { useEffect } from 'react';
import { X } from 'lucide-react';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';

/**
 * 🕌 Message éphémère « Après la prière » (Nadia, 27/11) : à l'ouverture du tasbih d'après la prière (onglet, ou bouton
 * « 33 · 33 · 33 + Lâ ilâha illa-llâh » de la petite carte de l'accueil, qui ouvre ce même onglet), ~15 s, seulement
 * les 2 PREMIÈRES fois sur l'appareil, puis plus jamais. Croix rouge ou toucher en dehors pour fermer.
 */
const CLE_MESSAGE_APRES = 'dinislam_dhikr_message_apres_priere';
const FOIS_MESSAGE_APRES = 2;
const DUREE_MESSAGE_APRES = 15_000;
/** Vrai si le message doit s'afficher maintenant (et le compte une fois de plus). Stockage bloqué → pas de message. */
export function messageApresAMontrer(): boolean {
  try {
    const n = Number(localStorage.getItem(CLE_MESSAGE_APRES)) || 0;
    if (n >= FOIS_MESSAGE_APRES) return false;
    localStorage.setItem(CLE_MESSAGE_APRES, String(n + 1));
    return true;
  } catch { return false; }
}

export function MessageApresPriere({ onFermer }: { onFermer: () => void }) {
  useEffect(() => { const t = setTimeout(onFermer, DUREE_MESSAGE_APRES); return () => clearTimeout(t); }, [onFermer]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/35 p-3 pb-[calc(var(--menu-bas,0px)+0.75rem)]" onClick={onFermer} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="dhk-msg-apres" onClick={(e) => e.stopPropagation()}
        className="dhk-message relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl border-2 border-[#e3b341] bg-[#fffaf1] p-4 pr-12 text-[#2b1630] shadow-2xl">
        <button type="button" onClick={onFermer} aria-label="Fermer"
          className="absolute right-2.5 top-2.5 rounded-full bg-white p-1 text-red-600 shadow hover:bg-red-50">
          <X className="h-6 w-6" strokeWidth={2.75} />
        </button>
        <h2 id="dhk-msg-apres" className="text-lg font-black">🕌 Le tasbih d'après la prière</h2>
        <p className="mt-1 text-sm font-semibold">Les étapes vont s'enchaîner <b>sans interruption</b> : le chapelet passe tout seul à la suivante.</p>
        <ol className="mt-2 space-y-1 text-sm">
          <li>1️⃣ <b>33 fois</b> Soubhâna-llâh <span dir="rtl" lang="ar" className="font-arabic text-[#8a5300]">سُبْحَانَ اللَّهِ</span></li>
          <li>2️⃣ <b>33 fois</b> Al-hamdou lillâh <span dir="rtl" lang="ar" className="font-arabic text-[#8a5300]">الْحَمْدُ لِلَّهِ</span></li>
          <li>3️⃣ <b>33 fois</b> Allâhou akbar <span dir="rtl" lang="ar" className="font-arabic text-[#8a5300]">اللَّهُ أَكْبَرُ</span></li>
          <li>4️⃣ puis <b>1 fois</b> « Lâ ilâha illa-llâhou wahdahou lâ charîka lah… » pour parfaire la centaine.</li>
        </ol>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#5b3a52]">Mouslim 597 <PastilleSource source="Mouslim 597" compact /></p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1e2c4]" aria-hidden>
          <div className="h-full rounded-full bg-[#dfa83a]" style={{ animation: `dhk-barre ${DUREE_MESSAGE_APRES}ms linear forwards` }} />
        </div>
        <style>{'@keyframes dhk-barre { from { width: 100% } to { width: 0% } } @media (prefers-reduced-motion: reduce) { [style*="dhk-barre"] { animation: none !important; } }'}</style>
      </div>
    </div>
  );
}
