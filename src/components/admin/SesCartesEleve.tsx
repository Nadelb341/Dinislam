import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartesAcces } from '@/hooks/useCartesAcces';
import { dansLaPeriode, raisonAcces, textePeriode } from '@/lib/cartesAcces';
import ModuleVisibilityDialog from '@/components/admin/ModuleVisibilityDialog';

/**
 * 🗂️ « Ses cartes » dans la fiche d'un élève (bouclier › Élèves › un élève) — idée 3 de « Qui voit quoi » (2026-11-11).
 * Chaque carte ouverte avec la raison (tout le monde / son groupe / lui seul) ; les fermées repliées en dessous.
 */
export default function SesCartesEleve({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { cartes, eleves, nomGroupe, isLoading } = useCartesAcces();
  const [reglage, setReglage] = useState<{ id: string; title: string } | null>(null);
  const [voirFermees, setVoirFermees] = useState(false);
  const e = eleves.find((x) => x.id === userId);
  if (isLoading) return <p className="text-xs text-muted-foreground">🗂️ Chargement de ses cartes…</p>;
  if (!e) return null;

  const lignes = cartes.map((c) => ({ c, r: raisonAcces(c.acces, e.id, e.groupes) }));
  const ouvertes = lignes.filter((l) => l.r), fermees = lignes.filter((l) => !l.r);
  const raison = (c: (typeof cartes)[number], r: string) =>
    r === 'tous' ? '🌍 tout le monde' : r === 'lui' ? '👤 lui seul' : `👥 ${e.groupes.filter((g) => c.acces.groupes.includes(g)).map(nomGroupe).join(', ')}`;

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">🗂️ Ses cartes ({ouvertes.length} ouverte{ouvertes.length > 1 ? 's' : ''})</p>
        <button type="button" className="text-xs underline text-muted-foreground" onClick={() => navigate('/admin?section=cartes-acces')}>Qui voit quoi</button>
      </div>
      <ul className="space-y-1">
        {ouvertes.map(({ c, r }) => (
          <li key={c.id} className="flex flex-wrap items-center gap-x-2 text-sm">
            <button type="button" className="font-semibold hover:underline text-left" onClick={() => setReglage({ id: c.id, title: c.title })}>{c.title}</button>
            <span className="text-xs text-muted-foreground">{raison(c, r!)}</span>
            {textePeriode(c) && <span className="text-xs text-amber-700 dark:text-amber-300">⏰ {dansLaPeriode(c) ? '' : 'pas encore / plus '}ouverte {textePeriode(c)}</span>}
          </li>
        ))}
        {!ouvertes.length && <li className="text-sm text-muted-foreground">Aucune carte ouverte.</li>}
      </ul>
      {fermees.length > 0 && (
        <div>
          <button type="button" className="text-xs text-muted-foreground" onClick={() => setVoirFermees((v) => !v)}>🔒 {fermees.length} carte{fermees.length > 1 ? 's' : ''} fermée{fermees.length > 1 ? 's' : ''} {voirFermees ? '▲' : '▼'}</button>
          {voirFermees && (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {fermees.map(({ c }) => (
                <li key={c.id}><button type="button" onClick={() => setReglage({ id: c.id, title: c.title })} className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/70">{c.title}</button></li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Appuie sur une carte pour choisir qui la voit.</p>
      <ModuleVisibilityDialog open={!!reglage} onOpenChange={(v) => { if (!v) setReglage(null); }} module={reglage} />
    </div>
  );
}
