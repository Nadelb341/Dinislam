import { JUZ } from '@/data/coranMeta';
import { SOURATES_DATA } from '@/data/sourates';
import { cn } from '@/lib/utils';

const nameOf = (n: number) => SOURATES_DATA.find((s) => s.number === n)?.name_french.split(' (')[0] ?? `Sourate ${n}`;
const arOf = (n: number) => SOURATES_DATA.find((s) => s.number === n)?.name_arabic ?? '';

interface Props {
  selected: number;
  onSelect: (juz: number) => void;
  juzDone: (juz: number) => number[];
  /** Ouvre le lecteur en mode Juz' sur une sourate du parcours */
  onOpen: (juz: number, sura: number, page: number) => void;
}

/**
 * 📚 Les 30 Juz' (2026-10-25) : grille des 30 parties, puis le parcours du Juz' choisi
 * (une étape par sourate). Le parcours a sa propre progression : il ne touche jamais au marque-page de « Lire ».
 */
export function CoranJuzTab({ selected, onSelect, juzDone, onOpen }: Props) {
  const juz = JUZ[selected - 1];
  const done = juzDone(selected);
  const nextTodo = juz.sourates.find((s) => !done.includes(s.n))?.n;
  const count = (j: number) => juzDone(j).filter((n) => JUZ[j - 1].sourates.some((s) => s.n === n)).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c39a3e] mb-2">Les 30 Juz' · touche un Juz'</p>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {JUZ.map((j) => {
            const c = count(j.n);
            const full = c === j.sourates.length;
            return (
              <button key={j.n} type="button" onClick={() => onSelect(j.n)} aria-pressed={selected === j.n}
                aria-label={`Juz' ${j.n}${full ? ', terminé' : c ? ', en cours' : ''}`}
                className={cn('aspect-square rounded-xl border text-sm font-extrabold tabular-nums grid place-items-center transition-all',
                  full ? 'bg-[#7a1d22] border-[#7a1d22] text-white'
                    : c ? 'border-2 border-[#c39a3e] text-[#8a6512] bg-[#fbf7ef] dark:bg-[#2a1918] dark:text-[#e0bb62]'
                      : 'border-[#e6d9cc] bg-white text-[#7a1d22] dark:bg-[#221413] dark:border-[#3a2523] dark:text-[#e08a8f]',
                  selected === j.n && 'ring-4 ring-[#c39a3e]/60',
                  j.n === 30 && !full && !c && 'bg-[#f5ead1] dark:bg-[#3b2e14]')}>
                {j.n === 30 ? <span className="leading-none text-center">30<span className="block text-[8px] font-bold">ʿAmma</span></span> : j.n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e6d9cc] dark:border-[#3a2523] bg-[#fbf7ef] dark:bg-[#2a1918] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="text-xl font-extrabold text-[#2a1414] dark:text-[#f3e9e4]">Juz' {selected}{selected === 30 ? ' · ʿAmma' : ''}</h2>
          <span className="text-xs font-bold text-[#75605a] dark:text-[#bfa79f] tabular-nums">pages {juz.page} à {juz.endPage} · {done.filter((n) => juz.sourates.some((s) => s.n === n)).length}/{juz.sourates.length} ✅</span>
        </div>
        <p className="text-xs text-[#75605a] dark:text-[#bfa79f] mb-3">Touche une étape pour lire la sourate. Coche « ✅ Sourate terminée » en bas de la page quand tu as fini.</p>
        <ol className="flex flex-col items-center gap-1">
          {juz.sourates.map((s, i) => {
            const isDone = done.includes(s.n);
            const isNext = s.n === nextTodo;
            const part = s.partial ? (i === 0 ? ' (suite)' : ' (début)') : '';
            return (
              <li key={s.n} className={cn('flex items-center gap-3 w-full max-w-xs', i % 2 === 1 && 'flex-row-reverse text-right')}>
                <button type="button" onClick={() => onOpen(selected, s.n, s.page)}
                  aria-label={`${nameOf(s.n)}${part}, page ${s.page}${isDone ? ', terminée' : ''}`}
                  className={cn('h-12 w-12 shrink-0 rounded-full border-[3px] grid place-items-center font-extrabold tabular-nums transition-transform active:scale-95',
                    isDone ? 'bg-[#7a1d22] border-[#7a1d22] text-white'
                      : isNext ? 'border-[#c39a3e] bg-white text-[#8a6512] shadow-[0_0_0_4px_rgba(195,154,62,0.25)] dark:bg-[#221413] dark:text-[#e0bb62]'
                        : 'border-[#e6d9cc] bg-white text-[#75605a] dark:bg-[#221413] dark:border-[#3a2523] dark:text-[#bfa79f]')}>
                  {isDone ? '✓' : s.n}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2a1414] dark:text-[#f3e9e4] [overflow-wrap:anywhere]">{nameOf(s.n)}{part} <span className="font-arabic text-base text-[#7a1d22] dark:text-[#e08a8f]">{arOf(s.n)}</span></p>
                  <p className="text-[11px] text-[#75605a] dark:text-[#bfa79f]">page {s.page}{isDone ? ' · ✅ terminée' : isNext ? ' · ▶️ à lire' : ''}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
