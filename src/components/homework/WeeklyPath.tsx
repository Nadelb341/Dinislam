import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConfetti } from '@/hooks/useConfetti';
import { bonusEarned, itemFill, nextCourseDay, treasureFor, type ProgramItem, type WeeklyProgram } from '@/lib/weeklyProgram';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/**
 * 💎 « Mon chemin de la semaine » (choix « 2 » de Nadia, 2026-10-08), en haut du Cahier de texte de l'élève.
 * Depuis le 2026-10-26 : un diamant par devoir donné à l'élève (+ celui des 99 noms) ; un devoir en étapes
 * remplit son diamant petit à petit ; 🌟 diamant bonus si tout est fait avant le cours ; 🔥 série de semaines ;
 * 🎁 le trésor s'ouvre avec une animation et un hadith en récompense.
 */
const GEM: Record<string, [string, string]> = {
  nourania: ['#fb923c', '#ea580c'], sourates: ['#4ade80', '#15803d'], allah_names: ['#fde047', '#ca8a04'],
  alphabet: ['#60a5fa', '#1d4ed8'], invocations: ['#2dd4bf', '#0f766e'], priere: ['#c084fc', '#7e22ce'],
  devoir: ['#f472b6', '#be185d'], bonus: ['#fef08a', '#f59e0b'],
};

function Diamond({ item, fill }: { item: Pick<ProgramItem, 'module' | 'item_id' | 'emoji'>; fill: number }) {
  const [light, dark] = GEM[item.module] ?? ['#a5b4fc', '#4338ca'];
  const lit = fill >= 1;
  const id = `gem-${item.module}-${item.item_id}`;
  // Remplissage par le bas : la partie colorée monte à chaque étape cochée
  const stop = `${Math.round(fill * 100)}%`;
  return (
    <span className={`relative inline-block ${lit ? 'gem-shine' : ''}`}>
      <svg viewBox="0 0 48 44" className="h-14 w-14" aria-hidden="true"
        style={lit ? { filter: `drop-shadow(0 0 8px ${light})` } : undefined}>
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={fill > 0 ? dark : '#2b3142'} />
            <stop offset={stop} stopColor={fill > 0 ? light : '#2b3142'} />
            <stop offset={stop} stopColor="#5b6478" />
            <stop offset="1" stopColor="#3b4252" />
          </linearGradient>
        </defs>
        <polygon points="12,2 36,2 46,15 24,42 2,15" fill={`url(#${id})`} stroke={lit ? '#fff' : '#1f2433'} strokeWidth="1.5" />
        <polyline points="2,15 46,15" fill="none" stroke={lit ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.12)'} strokeWidth="1.2" />
        <polyline points="12,2 17,15 24,42 31,15 36,2" fill="none" stroke={lit ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.1)'} strokeWidth="1.2" />
        <polygon points="17,15 24,2 31,15" fill={lit ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.04)'} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg pb-2" style={{ opacity: lit ? 1 : 0.6 }}>{item.emoji}</span>
      {lit && <span className="gem-sparkle absolute -top-1 -right-1 text-sm" aria-hidden="true">✨</span>}
    </span>
  );
}

export function WeeklyPath({ program }: { program: WeeklyProgram }) {
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
  const [chestOpen, setChestOpen] = useState(false);
  const total = program.items.length;
  const done = program.items.filter((i) => i.done).length;
  const allDone = total > 0 && done === total;
  const bonus = bonusEarned(program);
  const pct = total ? (program.items.reduce((s, i) => s + itemFill(i), 0) / total) * 100 : 0;
  const courseDay = nextCourseDay(program.week_start);
  const day = courseDay.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const reward = treasureFor(program.program_id);

  // 🔥 Série de semaines d'affilée avec le trésor ouvert
  const { data: streak = 0 } = useQuery({
    queryKey: ['weekly-program', program.student_id, 'streak'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_program_streak');
      if (error) throw error;
      return Number(data) || 0;
    },
  });

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

  const openChest = () => { if (!allDone) return; setChestOpen(true); window.setTimeout(fireConfetti, 250); };

  return (
    <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-3 space-y-3 mb-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-extrabold text-base">🗺️ Mon chemin de la semaine</p>
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">pour le {day}</span>
      </div>
      {streak > 0 && (
        <p className="mx-auto w-fit rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-extrabold shadow">
          🔥 {streak} semaine{streak > 1 ? 's' : ''} d'affilée avec le trésor ouvert !{streak >= 3 ? ' Quelle série ! 🏆' : ''}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-3">
        {program.items.map((item) => {
          const fill = itemFill(item);
          const steps = item.steps_total ?? 0;
          return (
            <button key={`${item.module}-${item.item_id}`} type="button"
              onClick={() => {
                // Diamant d'un devoir : on descend jusqu'au devoir dans le cahier de texte (même page)
                const el = item.module === 'devoir' ? document.getElementById(`devoir-${item.item_id}`) : null;
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else navigate(item.path);
              }}
              aria-label={`${item.label} : ${item.detail}, ${item.done ? 'validé' : 'à faire'}`}
              className="w-[5.5rem] flex flex-col items-center gap-0.5 rounded-xl p-1 transition-transform active:scale-95 hover:bg-white/60 dark:hover:bg-white/5">
              <Diamond item={item} fill={fill} />
              <span className="text-xs font-extrabold leading-tight text-center [overflow-wrap:anywhere]">{item.label}</span>
              <span className="text-[11px] text-muted-foreground leading-tight text-center [overflow-wrap:anywhere]">{item.detail}</span>
              <span className="text-base leading-none mt-0.5">
                {item.done ? '✅' : steps > 0 ? <span className="text-[11px] font-extrabold tabular-nums">{item.steps_done ?? 0}/{steps}</span> : '⏳'}
              </span>
            </button>
          );
        })}

        {/* 🌟 Diamant bonus : tout fait avant le jour du cours */}
        {total > 0 && (
          <div className="w-[5.5rem] flex flex-col items-center gap-0.5 p-1" aria-label={bonus ? 'Diamant bonus gagné' : 'Diamant bonus à gagner'}>
            <Diamond item={{ module: 'bonus', item_id: program.program_id, emoji: '🌟' }} fill={bonus ? 1 : 0} />
            <span className="text-xs font-extrabold">Bonus</span>
            <span className="text-[11px] text-muted-foreground text-center leading-tight">{bonus ? 'Gagné, bravo !' : `tout finir avant le ${courseDay.toLocaleDateString('fr-FR', { weekday: 'long' })}`}</span>
          </div>
        )}

        {/* 🎁 Le trésor : son rond se remplit à chaque diamant ; il s'ouvre quand tout brille */}
        <button type="button" onClick={openChest} disabled={!allDone} aria-label={allDone ? 'Ouvrir le trésor' : 'Trésor fermé'}
          className="w-[5.5rem] flex flex-col items-center gap-0.5 p-1 rounded-xl disabled:cursor-default enabled:hover:bg-white/60 dark:enabled:hover:bg-white/5">
          <span className="grid place-items-center h-14 w-14 rounded-full transition-all duration-500"
            style={{ background: `conic-gradient(#16a34a ${pct}%, rgba(100,116,139,.25) 0)` }}>
            <span className={`grid place-items-center h-11 w-11 rounded-full bg-card text-2xl ${allDone ? 'animate-bounce' : ''}`}>{allDone ? '🎁' : '🔒'}</span>
          </span>
          <span className="text-xs font-extrabold">Trésor</span>
          <span className="text-[11px] text-muted-foreground">{allDone ? 'touche-moi !' : `${done}/${total} 💎`}</span>
        </button>
      </div>

      <p className="text-center text-sm font-bold">
        {allDone ? `🎉 Tous tes diamants brillent, machaAllah ! Touche le trésor pour l'ouvrir 🎁` : `Fais briller tes ${total} diamants pour ouvrir le trésor 🎁`}
      </p>
      {program.teacher_note && (
        <p className="rounded-xl bg-card border-s-4 border-amber-400 px-3 py-2 text-sm [overflow-wrap:anywhere]">💬 <b>Mot de ton prof :</b> {program.teacher_note}</p>
      )}
      <p className="text-[11px] text-muted-foreground text-center">Un diamant par devoir : touche-le pour aller au devoir, puis coche « J'ai travaillé ce devoir » 💎</p>

      {/* 🎁 Le trésor ouvert : un hadith en récompense, le même toute la semaine */}
      <Dialog open={chestOpen} onOpenChange={setChestOpen}>
        <DialogContent className="max-w-sm text-center" level="nested">
          <DialogTitle className="sr-only">Le trésor de la semaine</DialogTitle>
          <div className="treasure-pop space-y-3 py-2">
            <p className="text-6xl">🎁</p>
            <p className="text-lg font-extrabold">Trésor ouvert, machaAllah !</p>
            {bonus && <p className="text-sm font-bold text-amber-600 dark:text-amber-400">🌟 Et tu as gagné le diamant bonus !</p>}
            <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/30 border border-amber-300 dark:border-amber-800 px-4 py-3">
              <p className="text-2xl mb-1">{reward.emoji}</p>
              <p className="text-sm font-semibold leading-relaxed">« {reward.text} »</p>
              <p className="text-[11px] text-muted-foreground mt-1">{reward.source}</p>
            </div>
            <p className="text-xs text-muted-foreground">Ton trésor de la semaine prochaine t'attend 💎</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
