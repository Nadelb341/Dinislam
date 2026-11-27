import { useState } from 'react';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';

/**
 * 📖 Le verset « Et invoquez Allah, en Lui vouant un culte exclusif… » (Ghâfir 40:14) + « En savoir plus » (Al-Baqara 2:152).
 * 28/11 (Nadia) : retiré de la carte Dhikr (« ça prend de la place ») et gardé dans la carte Hadiths, onglet « Les hadiths »
 * (« j'aime beaucoup, je ne veux pas le jeter »). Textes et traduction Hamidullah relus sur api.alquran.cloud.
 */
export function VersetDhikr() {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-[#ecd6aa] bg-[#fff8ec]/90 px-3 py-2.5 text-center text-[#4a2c1a] shadow-sm">
      <p dir="rtl" lang="ar" className="font-arabic text-lg sm:text-xl leading-[1.9] text-[#8a5300] [overflow-wrap:anywhere]">فَادْعُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ</p>
      <p className="text-sm italic font-semibold [overflow-wrap:anywhere]">« Et invoquez Allah, en Lui vouant un culte exclusif… »</p>
      <p className="mt-0.5 flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold text-[#5b3a52]">
        Sourate Ghâfir, verset 14 (40:14) <PastilleSource source="Coran 40:14" compact />
      </p>
      <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}
        className="mt-1.5 rounded-full border border-[#d8b46a] bg-white/90 px-3 py-1 text-xs font-extrabold text-[#6b4200] active:scale-95">
        {ouvert ? '▲ Fermer' : '📖 En savoir plus'}
      </button>
      {ouvert && (
        <div className="dhk-apparait mt-2 space-y-1.5 text-left text-sm leading-snug [overflow-wrap:anywhere]">
          <p><b>Le verset en entier :</b> « Invoquez Allah donc, en Lui vouant un culte exclusif, quelque répulsion qu'en aient les mécréants. » (traduction Hamidullah)</p>
          <p>Allah nous demande de L'invoquer, Lui seul, avec un cœur sincère.</p>
          <p>Allah dit aussi : « Souvenez-vous de Moi donc. Je vous récompenserai. » <span className="whitespace-nowrap font-bold">(Al-Baqara 2:152)</span> <PastilleSource source="Coran 2:152" compact /></p>
        </div>
      )}
    </div>
  );
}
