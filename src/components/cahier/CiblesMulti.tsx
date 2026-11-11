import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { optionsFor } from '@/components/admin/CibleSelect';
import type { Cible } from '@/lib/devoirsEleve';

/**
 * 📍 Choisir UN OU PLUSIEURS éléments (leçon, sourate, invocations…) sur une ligne de devoir (Nadia, 2026-11-11) :
 * chaque élément coché = une étape du devoir de la matière (un seul 💎) ; « Commencer mon travail » ouvre le 1er.
 */
export function CiblesMulti({ type, value, onChange }: { type: string; value: Cible[]; onChange: (v: Cible[]) => void }) {
  const { data: options = [] } = useQuery({ queryKey: ['devoir-cibles', type], queryFn: () => optionsFor(type), staleTime: 10 * 60 * 1000 });
  const [cherche, setCherche] = useState('');
  if (!options.length) return null;
  const choisis = new Set(value.map((c) => c.v));
  const liste = options.filter((o) => !cherche.trim() || o.label.toLowerCase().includes(cherche.trim().toLowerCase()));
  const basculer = (o: { value: string; label: string }) =>
    onChange(choisis.has(o.value) ? value.filter((c) => c.v !== o.value) : [...value, { v: o.value, l: o.label }]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn('rounded-lg border bg-background px-2 py-1.5 text-xs max-w-[14rem] text-start [overflow-wrap:anywhere]', value.length && 'border-sky-400 bg-sky-50 dark:bg-sky-950/30 font-semibold')}>
          📍 {value.length === 0 ? 'Ouvrir… (un ou plusieurs)' : value.length === 1 ? value[0].l : `${value.length} choisis = ${value.length} étapes`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2 z-[700]">
        {options.length > 8 && <Input id={`cibles-cherche-${type}`} value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Chercher…" className="h-8 mb-1.5" />}
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {liste.map((o) => (
            <label key={o.value} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={choisis.has(o.value)} onChange={() => basculer(o)} className="h-4 w-4 accent-sky-600" />
              <span className="[overflow-wrap:anywhere]">{o.label}</span>
            </label>
          ))}
        </div>
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="mt-1.5 text-xs text-muted-foreground underline">Tout décocher</button>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">Chaque élément coché = une étape à cocher (un seul 💎 pour la matière).</p>
      </PopoverContent>
    </Popover>
  );
}
