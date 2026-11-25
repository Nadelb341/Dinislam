import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { AMBIANCES, positionFrise, type Horaires, type Moment } from '@/lib/momentPriere';
import { parler } from '@/lib/petits';
import { cn } from '@/lib/utils';

/**
 * 🕐 La journée en frise (Nadia, 2026-11-26, présentation 4) : Sobh → Icha de haut en bas, un petit soleil (ou la lune) glisse
 * à l'heure exacte. Idée f : chaque prière avec son nom en arabe et 🔊 sa prononciation (voix du téléphone, sans Internet).
 */
export function FriseDuJour({ horaires, moment, cochees, texte, nuit = false }: { horaires: Horaires; moment: Moment; cochees: string[]; texte: string; nuit?: boolean }) {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setMaintenant(new Date()), 60_000); return () => clearInterval(t); }, []);
  const lignes: { cle: string; nom: string; arabe: string; date: Date; moment: Moment }[] = [
    { cle: 'sobh', nom: 'Sobh', arabe: 'الصُّبْح', date: horaires.fajrDate, moment: 'sobh' },
    { cle: '', nom: 'Chourouk (lever du soleil)', arabe: 'الشُّرُوق', date: horaires.sunriseDate, moment: 'chourouk' },
    { cle: 'dhuhr', nom: 'Dhohr', arabe: 'الظُّهْر', date: horaires.dhuhrDate, moment: 'dhohr' },
    { cle: 'asr', nom: 'Asr', arabe: 'العَصْر', date: horaires.asrDate, moment: 'asr' },
    { cle: 'maghrib', nom: 'Maghreb', arabe: 'المَغْرِب', date: horaires.maghribDate, moment: 'maghreb' },
    { cle: 'isha', nom: 'Icha', arabe: 'العِشَاء', date: horaires.ishaDate, moment: 'icha' },
  ];
  const pos = positionFrise(horaires, maintenant);
  const hm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return (
    <section className={cn('rounded-3xl p-3 shadow-sm backdrop-blur-sm', nuit ? 'bg-[#0d1240]/55' : 'bg-white/70 dark:bg-black/25')} aria-label="La journée en frise">
      <h2 className="mb-2 text-base font-extrabold" style={{ color: texte }}>🕐 Ma journée de prières</h2>
      <div className="relative ps-7">
        {/* Le fil de la journée et l'astre qui glisse dessus */}
        <div className="absolute bottom-3 start-2.5 top-3 w-1 rounded-full bg-gradient-to-b from-orange-300 via-sky-300 to-indigo-700" aria-hidden />
        <span className="absolute start-0 -translate-y-1/2 text-xl transition-[top] duration-1000" style={{ top: `calc(0.75rem + ${pos} * (100% - 1.5rem))` }}
          aria-label={`Il est ${hm(maintenant)}`}>{moment === 'icha' ? '🌙' : '☀️'}</span>
        <ol className="space-y-1.5">
          {lignes.map((l) => {
            const actuel = l.moment === moment;
            const faite = l.cle && cochees.includes(l.cle);
            return (
              <li key={l.nom} className={cn('flex items-center gap-2 rounded-2xl px-2.5 py-1.5', actuel ? 'bg-amber-100 ring-2 ring-amber-300 dark:bg-amber-900/40' : 'bg-white/60 dark:bg-white/5')}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-[#1f2240] dark:text-white [overflow-wrap:anywhere]">{l.nom}{faite ? ' ✅' : ''}</p>
                  <p className="font-arabic text-base leading-tight text-[#5b3a1a] dark:text-amber-200" dir="rtl">{l.arabe}</p>
                </div>
                <button type="button" onClick={() => parler(l.arabe, 'ar')} aria-label={`Écouter ${l.nom} en arabe`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#2d4a9a] shadow-sm active:scale-95 dark:bg-white/10 dark:text-sky-200">
                  <Volume2 className="h-4 w-4" />
                </button>
                <span className="w-12 shrink-0 text-end font-mono text-sm font-bold tabular-nums text-[#1f2240] dark:text-white">{hm(l.date)}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-2 text-[11px] opacity-80" style={{ color: texte }}>Maintenant : {AMBIANCES[moment].nom}</p>
    </section>
  );
}
