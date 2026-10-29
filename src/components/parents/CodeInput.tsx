import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * 🔐 Champ du code parents (6 chiffres), 2026-10-29 : ce n'est PAS un champ « mot de passe » pour le navigateur
 * (sinon Safari ouvre son trousseau « Suggérer un nouveau mot de passe » et gêne la saisie). Les chiffres sont
 * masqués par des points, avec l'œil pour les afficher (règle « œil sur tout champ secret »).
 */
export const CodeInput = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; className?: string; 'aria-label': string }>(
  function CodeInput({ value, onChange, placeholder, autoFocus, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" autoCorrect="off" spellCheck={false}
          name={`code-parents-${placeholder.length}`} data-1p-ignore="true" data-lpignore="true" data-form-type="other"
          value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={placeholder} autoFocus={autoFocus}
          aria-label={rest['aria-label']} className={cn('pr-10', className)}
          style={{ WebkitTextSecurity: visible || !value ? 'none' : 'disc' } as React.CSSProperties} />
        <button type="button" onClick={() => setVisible((v) => !v)} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={visible ? 'Masquer le code' : 'Afficher le code'}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
