import { useEffect, useId, useState } from 'react';
import { Delete, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVT = 'dinislam:code-actif';

/**
 * 🔐 Saisie du code parents (6 chiffres CHOISIS par les parents), 2026-10-30 :
 * 6 cases + un pavé de chiffres dans l'appli, comme l'écran de verrouillage d'un téléphone.
 * Ce n'est volontairement PAS un champ de saisie : Safari ne peut plus proposer son « code de validation »
 * (empreinte + code au hasard) ni son trousseau. Le clavier de l'ordinateur marche aussi (chiffres, effacer).
 * Un seul pavé ouvert à la fois dans une fenêtre ; l'œil affiche ou masque les chiffres.
 */
export function CodeInput({ value, onChange, placeholder, autoFocus, className, ...rest }: {
  value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; className?: string; 'aria-label': string;
}) {
  const id = useId();
  const [actif, setActif] = useState(!!autoFocus);
  const [visible, setVisible] = useState(false);

  // Un seul pavé ouvert : ouvrir celui-ci ferme les autres
  useEffect(() => {
    const f = (e: Event) => { if ((e as CustomEvent<string>).detail !== id) setActif(false); };
    window.addEventListener(EVT, f);
    return () => window.removeEventListener(EVT, f);
  }, [id]);
  const ouvrir = () => { setActif(true); window.dispatchEvent(new CustomEvent(EVT, { detail: id })); };
  useEffect(() => { if (autoFocus) window.dispatchEvent(new CustomEvent(EVT, { detail: id })); }, [autoFocus, id]);

  const taper = (c: string) => onChange((value + c).slice(0, 6));
  const effacer = () => onChange(value.slice(0, -1));

  // Clavier de l'ordinateur
  useEffect(() => {
    if (!actif) return;
    const f = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA')) return; // ne pas voler la saisie d'un autre champ
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); onChange((value + e.key).slice(0, 6)); }
      else if (e.key === 'Backspace') { e.preventDefault(); onChange(value.slice(0, -1)); }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [actif, value, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={ouvrir} aria-label={rest['aria-label']} aria-expanded={actif}
          className={cn('flex-1 min-w-0 rounded-xl border-2 px-2 py-2 text-left transition-colors', actif ? 'border-primary bg-primary/5' : 'border-border bg-background')}>
          <span className="block text-[11px] font-semibold text-muted-foreground [overflow-wrap:anywhere]">{placeholder}</span>
          <span className="mt-1 flex justify-center gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={cn('h-9 w-8 rounded-lg border-2 grid place-items-center text-lg font-extrabold tabular-nums',
                i < value.length ? 'border-primary text-foreground' : i === value.length && actif ? 'border-primary/60 animate-pulse' : 'border-border text-transparent')}>
                {i < value.length ? (visible ? value[i] : '●') : '·'}
              </span>
            ))}
          </span>
        </button>
        <button type="button" onClick={() => setVisible((v) => !v)} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label={visible ? 'Masquer le code' : 'Afficher le code'}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {actif && (
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/50 p-2" role="group" aria-label="Pavé de chiffres">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
            <button key={c} type="button" onClick={() => taper(c)} className="h-11 rounded-xl bg-card text-lg font-extrabold shadow-sm active:scale-95 transition-transform">{c}</button>
          ))}
          <button type="button" onClick={effacer} className="h-11 rounded-xl bg-card grid place-items-center shadow-sm active:scale-95" aria-label="Effacer le dernier chiffre"><Delete className="h-5 w-5" /></button>
          <button type="button" onClick={() => taper('0')} className="h-11 rounded-xl bg-card text-lg font-extrabold shadow-sm active:scale-95">0</button>
          <button type="button" onClick={() => setActif(false)} className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold shadow-sm active:scale-95">OK</button>
        </div>
      )}
    </div>
  );
}
