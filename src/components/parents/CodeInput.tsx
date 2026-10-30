import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * 🔐 Code parents LIBRE (2026-10-30, demande de Nadia) : lettres et/ou chiffres, minuscules et/ou majuscules,
 * sans longueur imposée ; les majuscules comptent (« Soleil » ≠ « soleil »).
 * Champ texte masqué par des points (avec l'œil), et pas un champ « mot de passe » : on évite au maximum que Safari
 * propose son trousseau ou un code de validation (nom, libellé et réglages choisis pour ça). S'il propose quand même,
 * il suffit d'ignorer sa bulle et de taper son propre code.
 */
export function CodeInput({ value, onChange, placeholder, autoFocus, className, ...rest }: {
  value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; className?: string; 'aria-label': string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn('relative', className)}>
      <Input type="text" value={value} onChange={(e) => onChange(e.target.value.slice(0, 60))} placeholder={placeholder} autoFocus={autoFocus}
        aria-label={rest['aria-label']} name="ep-secret-libre" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
        data-1p-ignore="true" data-lpignore="true" data-form-type="other" enterKeyHint="done"
        className="pr-10" style={{ WebkitTextSecurity: visible || !value ? 'none' : 'disc' } as React.CSSProperties} />
      <button type="button" onClick={() => setVisible((v) => !v)} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={visible ? 'Masquer' : 'Afficher'}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
