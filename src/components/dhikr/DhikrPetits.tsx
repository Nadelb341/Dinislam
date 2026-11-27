import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeuArtificeDore } from '@/components/saisons/FeuArtificeDore';
import { direAvecSaVoix } from '@/lib/voixFabriquees';
import { noterDhikr } from '@/hooks/useDhikrLocal';
import { cn } from '@/lib/utils';

/**
 * 🧸 J · Le dhikr des tout-petits (Nadia, 27/11) : un GROS bouton, 10 fois, une étoile par compte, la voix qui dit le dhikr
 * (voix de l'appli, sinon celle du téléphone), et à la fin des 10 : le feu d'artifice doré (comme l'étoile dorée) avec « BRAVO ! » en GROS.
 * Marche sans réseau (rien à télécharger ; le compte va dans le carnet de l'appareil).
 */
const DHIKR_PETITS = [
  { cle: 'subhanallah', arabe: 'سُبْحَانَ اللَّهِ', phon: 'Soubhâna-llâh', fond: 'from-sky-300 to-indigo-500', emoji: '🌙' },
  { cle: 'alhamdulillah', arabe: 'الْحَمْدُ لِلَّهِ', phon: 'Al-hamdou lillâh', fond: 'from-emerald-300 to-teal-500', emoji: '🌿' },
  { cle: 'allahuakbar', arabe: 'اللَّهُ أَكْبَرُ', phon: 'Allâhou akbar', fond: 'from-amber-300 to-orange-500', emoji: '☀️' },
];
const vibrer = (m: number | number[]) => { try { navigator.vibrate?.(m); } catch { /* iPhone */ } };

export function DhikrPetits() {
  const { user } = useAuth();
  const [choix, setChoix] = useState(0);
  const [n, setN] = useState(0);
  const [fete, setFete] = useState(false);
  const d = DHIKR_PETITS[choix];
  const toucher = () => {
    if (n >= 10) return;
    const suivant = n + 1;
    setN(suivant);
    direAvecSaVoix(null, d.arabe, 'ar', 'jamal');
    if (suivant === 10) { vibrer([90, 60, 200]); setFete(true); void noterDhikr(user?.id, { moment: 'libre', nombre: 10 }); }
    else vibrer(15);
  };
  return (
    <div className="space-y-5 text-center">
      <div className="grid grid-cols-3 gap-3">
        {DHIKR_PETITS.map((x, i) => (
          <button key={x.cle} type="button" onClick={() => { setChoix(i); setN(0); }} aria-pressed={choix === i} aria-label={x.phon}
            className={cn('rounded-[28px] bg-gradient-to-br p-2 text-white shadow-lg active:scale-95 transition', x.fond, choix === i ? 'ring-4 ring-white scale-105' : 'opacity-80')}>
            <span className="block text-4xl">{x.emoji}</span>
            <span dir="rtl" lang="ar" className="block font-arabic text-lg sm:text-xl font-bold leading-loose drop-shadow">{x.arabe}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1 flex-wrap" aria-label={`${n} étoiles sur 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn('text-3xl sm:text-4xl transition-transform duration-300', i < n ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,197,66,.9)]' : 'opacity-30 grayscale')}>⭐</span>
        ))}
      </div>
      <button type="button" onClick={toucher} aria-label={`Dire ${d.phon}`}
        className={cn('mx-auto grid h-56 w-56 sm:h-64 sm:w-64 paysage:h-44 paysage:w-44 place-items-center rounded-full bg-gradient-to-br text-white shadow-2xl ring-8 ring-white/70 active:scale-95 transition-transform', d.fond)}>
        <span>
          <span dir="rtl" lang="ar" className="block font-arabic text-4xl sm:text-5xl font-bold leading-loose drop-shadow">{d.arabe}</span>
          <span className="block text-2xl font-black drop-shadow">{n}/10</span>
        </span>
      </button>
      {n >= 10 && (
        <div className="space-y-3">
          <p className="text-6xl sm:text-7xl font-black tracking-wide text-amber-400 drop-shadow-[0_3px_0_rgba(0,0,0,.25)]">BRAVO !</p>
          <button type="button" onClick={() => setN(0)} className="rounded-full bg-white text-slate-900 px-6 py-3 text-2xl font-black shadow-lg">🔁 Encore !</button>
        </div>
      )}
      {fete && <FeuArtificeDore duree={5} theme="ramadan" bravo="BRAVO !" auDessus onFin={() => setFete(false)} />}
    </div>
  );
}
