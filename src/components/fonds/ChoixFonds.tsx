import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useReglage } from '@/hooks/usePetits';
import { FONDS, fondDuJour, REGLAGE_FONDS_DEFAUT, svgFond, type FamilleFond, type ReglageFonds } from '@/lib/fondsEcran';
import { CalquesFond } from './FondEcran';

/**
 * 🖼️ Carte « Fond d'écran » de l'enseignante (Nadia, 22/11) : tout-petits (onglet 🧸, jour et nuit séparés) et grands
 * (bouclier › 🔧 Apparence appli). Toucher un fond = l'activer / le mettre de côté (pour changer de temps en temps) ;
 * les fonds actifs changent chaque jour. Aperçu jour / couchant / nuit / aube.
 */
export function ChoixFonds({ qui }: { qui: 'petits' | 'grands' }) {
  const { valeur: r, changer } = useReglage<ReglageFonds>('fonds_ecran', REGLAGE_FONDS_DEFAUT);
  const [apercu, setApercu] = useState<'jour' | 'couchant' | 'nuit' | 'aube'>('jour');
  const familles: FamilleFond[] = qui === 'petits' ? ['jp', 'np'] : ['jg', 'ng'];
  const basculer = (cle: string) => void changer({ ...r, actifs: r.actifs.includes(cle) ? r.actifs.filter((c) => c !== cle) : [...r.actifs, cle] });
  const jour = fondDuJour(familles[0], r.actifs);
  const nuit = fondDuJour(familles[1], r.actifs);
  const etat = { jour: [0, 0], couchant: [0, .6], nuit: [1, 0], aube: [.5, .5] }[apercu];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-3">
        <label htmlFor={`fonds-actif-${qui}`} className="min-w-0 cursor-pointer">
          <span className="block font-bold">Fonds d'écran dans l'appli</span>
          <span className="block text-xs text-muted-foreground">Pour tout le monde (petits et grands). Chacun peut aussi le couper sur son appareil (Paramètres).</span>
        </label>
        <Switch id={`fonds-actif-${qui}`} checked={r.actif} onCheckedChange={(v) => void changer({ ...r, actif: v })} />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative w-32 shrink-0 aspect-[9/16] rounded-[20px] overflow-hidden border-4 border-slate-900 shadow-lg">
          <CalquesFond jour={jour} nuit={nuit} opNuit={jour ? etat[0] : 1} voile={etat[1]} aube={apercu === 'aube'} uid={`ap${qui}`} vendredi={false} />
          <div className="absolute inset-x-3 top-[40%] h-[16%] rounded-xl bg-white/75 dark:bg-slate-900/60 backdrop-blur-sm" />
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-sm font-bold">👀 Aperçu du fond d'aujourd'hui</p>
          <div className="flex flex-wrap gap-1.5">
            {(['jour', 'couchant', 'nuit', 'aube'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setApercu(m)} aria-pressed={apercu === m}
                className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${apercu === m ? 'border-primary bg-primary/10' : 'border-border'}`}>
                {{ jour: '☀️ Jour', couchant: '🌇 Couchant', nuit: '🌙 Nuit', aube: '🌅 Aube' }[m]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Le couchant commence 30 min avant le Maghrib de la ville de chacun ; la nuit arrive 20 min après. Le vendredi, une petite mosquée s'ajoute au fond du jour.</p>
        </div>
      </div>

      {familles.map((fam) => (
        <section key={fam} className="space-y-2">
          <h3 className="font-extrabold">{fam[0] === 'j' ? '☀️ Le jour' : '🌙 La nuit'}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {FONDS.filter((f) => f.famille === fam).map((f) => {
              const on = r.actifs.includes(f.cle);
              return (
                <button key={f.cle} type="button" onClick={() => basculer(f.cle)} aria-pressed={on} aria-label={`${f.nom} : ${on ? 'actif' : 'de côté'}`}
                  className="flex flex-col gap-1 text-start">
                  <span className={`relative block w-full aspect-[9/16] rounded-2xl overflow-hidden border-4 ${on ? 'border-emerald-500' : 'border-border opacity-45 grayscale'}`}>
                    <span className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svgFond(f, `ch${f.cle}`) }} />
                    <span className={`absolute top-1 end-1 rounded-full px-1.5 text-[11px] font-extrabold ${on ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-white'}`}>{on ? '✓' : 'de côté'}</span>
                  </span>
                  <span className="text-[11px] font-bold leading-tight [overflow-wrap:anywhere]">{f.nom}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">Vert = actif (un différent chaque jour). Gris = mis de côté, tu le remets quand tu veux.</p>
    </div>
  );
}
