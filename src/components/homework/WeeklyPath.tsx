import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfetti } from '@/hooks/useConfetti';
import { ENCOURAGEMENTS, personalize } from '@/lib/encouragements';
import { nextCourseDay, type ProgramItem, type WeeklyProgram } from '@/lib/weeklyProgram';

/**
 * 💎 « Mon chemin de la semaine » (choix « 2 » de Nadia, 2026-10-08), en haut du Cahier de texte de l'élève.
 * Un diamant par carte : sombre + ⏳ tant que l'étape n'est pas validée, brillant + ✅ ensuite.
 * L'élève commence par la matière qu'il veut (toucher un diamant ouvre la carte). Le trésor se remplit à chaque diamant.
 */
const GEM: Record<string, [string, string]> = {
  nourania: ['#fb923c', '#ea580c'], sourates: ['#4ade80', '#15803d'], allah_names: ['#fde047', '#ca8a04'],
  alphabet: ['#60a5fa', '#1d4ed8'], invocations: ['#2dd4bf', '#0f766e'], priere: ['#c084fc', '#7e22ce'],
};

function Diamond({ item }: { item: ProgramItem }) {
  const [light, dark] = GEM[item.module] ?? ['#a5b4fc', '#4338ca'];
  const id = `gem-${item.module}`;
  return (
    <span className={`relative inline-block ${item.done ? 'gem-shine' : ''}`}>
      <svg viewBox="0 0 48 44" className="h-14 w-14" aria-hidden="true"
        style={item.done ? { filter: `drop-shadow(0 0 8px ${light})` } : undefined}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={item.done ? light : '#5b6478'} />
            <stop offset="1" stopColor={item.done ? dark : '#2b3142'} />
          </linearGradient>
        </defs>
        <polygon points="12,2 36,2 46,15 24,42 2,15" fill={`url(#${id})`} stroke={item.done ? '#fff' : '#1f2433'} strokeWidth="1.5" />
        <polyline points="2,15 46,15" fill="none" stroke={item.done ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.12)'} strokeWidth="1.2" />
        <polyline points="12,2 17,15 24,42 31,15 36,2" fill="none" stroke={item.done ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.1)'} strokeWidth="1.2" />
        <polygon points="17,15 24,2 31,15" fill={item.done ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.04)'} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg pb-2" style={{ opacity: item.done ? 1 : 0.55 }}>{item.emoji}</span>
      {item.done && <span className="gem-sparkle absolute -top-1 -right-1 text-sm" aria-hidden="true">✨</span>}
    </span>
  );
}

export function WeeklyPath({ program }: { program: WeeklyProgram }) {
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
  const total = program.items.length;
  const done = program.items.filter((i) => i.done).length;
  const allDone = total > 0 && done === total;
  const pct = total ? (done / total) * 100 : 0;
  const message = personalize(ENCOURAGEMENTS[program.message_index % ENCOURAGEMENTS.length], program.full_name, program.gender);
  const day = nextCourseDay(program.week_start).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });

  // Confettis une seule fois, quand tous les diamants brillent
  useEffect(() => {
    if (!allDone) return;
    const key = `dinislam_program_confetti_${program.program_id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch { /* appareil sans stockage : confettis quand même */ }
    window.setTimeout(fireConfetti, 300);
  }, [allDone, program.program_id, fireConfetti]);

  return (
    <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-3 space-y-3 mb-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-extrabold text-base">🗺️ Mon chemin de la semaine</p>
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">pour le {day}</span>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-3">
        {program.items.map((item) => (
          <button key={`${item.module}-${item.item_id}`} type="button" onClick={() => navigate(item.path)}
            aria-label={`${item.label} : ${item.detail}, ${item.done ? 'validé' : 'à faire'}`}
            className="w-[5.5rem] flex flex-col items-center gap-0.5 rounded-xl p-1 transition-transform active:scale-95 hover:bg-white/60 dark:hover:bg-white/5">
            <Diamond item={item} />
            <span className="text-xs font-extrabold leading-tight text-center">{item.label}</span>
            <span className="text-[11px] text-muted-foreground leading-tight text-center [overflow-wrap:anywhere]">{item.detail}</span>
            <span className="text-base leading-none mt-0.5">{item.done ? '✅' : '⏳'}</span>
          </button>
        ))}
        {/* Le trésor : son rond se remplit à chaque diamant */}
        <div className="w-[5.5rem] flex flex-col items-center gap-0.5 p-1">
          <span className="grid place-items-center h-14 w-14 rounded-full transition-all duration-500"
            style={{ background: `conic-gradient(#16a34a ${pct}%, rgba(100,116,139,.25) 0)` }}>
            <span className="grid place-items-center h-11 w-11 rounded-full bg-card text-2xl">{allDone ? '🎁' : '🔒'}</span>
          </span>
          <span className="text-xs font-extrabold">Trésor</span>
          <span className="text-[11px] text-muted-foreground">{done}/{total} 💎</span>
        </div>
      </div>

      <p className="text-center text-sm font-bold">
        {allDone ? `🎉 Tous tes diamants brillent, machaAllah ! Le trésor est ouvert !` : `Fais briller tes ${total} diamants pour ouvrir le trésor 🎁`}
      </p>
      <p className="rounded-xl bg-violet-100 dark:bg-violet-950/40 px-3 py-2 text-sm font-semibold [overflow-wrap:anywhere]">{message}</p>
      {program.teacher_note && (
        <p className="rounded-xl bg-card border-s-4 border-amber-400 px-3 py-2 text-sm [overflow-wrap:anywhere]">💬 <b>Mot de ton prof :</b> {program.teacher_note}</p>
      )}
      <p className="text-[11px] text-muted-foreground text-center">Commence par la matière que tu veux : touche un diamant 💎</p>
    </div>
  );
}
