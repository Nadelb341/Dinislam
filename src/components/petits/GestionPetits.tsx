import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAccesPetits, useGroupes } from '@/hooks/usePetits';
import { CARTES_PETITS, libelleAccesPetit, type AccesCartePetit } from '@/lib/petits';
import { ChoixSonErreur } from './ChoixSonErreur';
import { ChoixFonds } from '@/components/fonds/ChoixFonds';
import { AccueilPetits } from './AccueilPetits';
import type { PrayerTimesData } from '@/hooks/usePrayerTimesCity';

/**
 * 🧸 Onglet « Tout-petits » de l'accueil, ENSEIGNANTE SEULE (Nadia, 22/11) : par défaut elle voit l'accueil habituel ;
 * cet onglet sert à GÉRER l'accueil des tout-petits : (1) qui l'a (moins de 6 ans et/ou des groupes), (2) chaque carte,
 * FERMÉE au départ, ouverte à tous les tout-petits ou à certains, (3) le son doux de l'erreur, (4) l'aperçu.
 */
export function GestionPetits({ userId, prayerTimes }: { userId: string | null; prayerTimes: PrayerTimesData | null }) {
  const acces = useAccesPetits(userId, true);
  const { data: groupes = [] } = useGroupes();
  const noms = Object.fromEntries(groupes.map((g) => [g.id, g.name]));
  const [carte, setCarte] = useState<(typeof CARTES_PETITS)[number] | null>(null);
  const [son, setSon] = useState(false);
  const [fonds, setFonds] = useState(false);
  const pub = acces.pub.valeur;
  const cartes = acces.cartes.valeur;

  const basculerGroupePublic = (id: string) => void acces.pub.changer({ ...pub, groupes: pub.groupes.includes(id) ? pub.groupes.filter((g) => g !== id) : [...pub.groupes, id] });
  const nbOuvertes = CARTES_PETITS.filter((c) => cartes[c.cle]).length;

  return (
    <div className="space-y-4">
      {/* 1 · Qui a l'accueil des tout-petits */}
      <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
        <h2 className="font-extrabold text-lg">🧸 Qui a l'accueil des tout-petits ?</h2>
        <p className="text-xs text-muted-foreground">Ces enfants voient l'accueil des petits à la place de l'accueil habituel.</p>
        <div className="flex flex-wrap gap-2">
          <Puce on={pub.moins6} onClick={() => void acces.pub.changer({ ...pub, moins6: !pub.moins6 })}>👶 Moins de 6 ans</Puce>
          {groupes.map((g) => <Puce key={g.id} on={pub.groupes.includes(g.id)} onClick={() => basculerGroupePublic(g.id)}>{g.name}</Puce>)}
        </div>
      </section>

      {/* 2 · Les cartes, fermées au départ */}
      <section className="rounded-3xl border-2 border-sky-300 bg-sky-50 dark:bg-sky-950/30 p-4 space-y-2">
        <h2 className="font-extrabold text-lg">🗂️ Les cartes des tout-petits <span className="text-sm font-bold text-muted-foreground">({nbOuvertes} ouverte{nbOuvertes > 1 ? 's' : ''} sur {CARTES_PETITS.length})</span></h2>
        <p className="text-xs text-muted-foreground">Toutes fermées au départ : touche une carte pour choisir à qui l'ouvrir.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CARTES_PETITS.map((c) => {
            const a = cartes[c.cle];
            return (
              <button key={c.cle} type="button" onClick={() => setCarte(c)}
                className={`rounded-2xl border-2 p-2.5 text-start flex flex-col gap-1 transition-transform active:scale-95 ${a ? 'border-emerald-400 bg-card' : 'border-dashed border-border bg-muted/40 opacity-75'}`}>
                <span className="text-3xl leading-none">{c.emoji}</span>
                <span className="text-sm font-bold leading-tight [overflow-wrap:anywhere]">{c.titre}</span>
                <span className={`text-[11px] font-semibold leading-tight [overflow-wrap:anywhere] ${a ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>{libelleAccesPetit(a, noms)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🌅 Le fond d'écran des tout-petits (jour et nuit séparés) */}
      <section className="rounded-3xl border-2 border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 p-4 space-y-2">
        <button type="button" onClick={() => setFonds((v) => !v)} className="w-full flex items-center gap-2 text-start">
          <span className="flex-1 font-extrabold text-lg">🌅 Fond d'écran des tout-petits</span>
          <span className="text-xs font-bold">{fonds ? '▲' : '▼'}</span>
        </button>
        {fonds && <ChoixFonds qui="petits" />}
      </section>

      {/* 3 · Le son de l'erreur */}
      <section className="rounded-3xl border-2 border-violet-300 bg-violet-50 dark:bg-violet-950/30 p-4 space-y-2">
        <button type="button" onClick={() => setSon((v) => !v)} className="w-full flex items-center gap-2 text-start">
          <span className="flex-1 font-extrabold text-lg">🔈 Son quand l'enfant se trompe</span>
          <span className="text-xs font-bold">{son ? '▲' : '▼'}</span>
        </button>
        {son && <ChoixSonErreur />}
      </section>

      {/* 4 · L'aperçu */}
      <section className="space-y-2">
        <h2 className="font-extrabold text-lg">👀 Aperçu (les cartes 🔒 ne sont pas vues par les enfants)</h2>
        <AccueilPetits isAdmin userId={userId} prayerTimes={prayerTimes} lettresValidees={0} ouverte={() => true} fermee={(cle) => !cartes[cle]} />
      </section>

      {carte && <AccesCarteDialog titre={`${carte.emoji} ${carte.titre}`} valeur={cartes[carte.cle]} groupes={groupes} onClose={() => setCarte(null)}
        onSave={(v) => {
          const suivant = { ...cartes };
          if (v) suivant[carte.cle] = v; else delete suivant[carte.cle];
          void acces.cartes.changer(suivant).then(() => setCarte(null));
        }} />}
    </div>
  );
}

function Puce({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold [overflow-wrap:anywhere] ${on ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-card border-border'}`}>
      {on ? '✓ ' : ''}{children}
    </button>
  );
}

function AccesCarteDialog({ titre, valeur, groupes, onClose, onSave }: {
  titre: string; valeur: AccesCartePetit | undefined; groupes: { id: string; name: string }[];
  onClose: () => void; onSave: (v: AccesCartePetit | null) => void;
}) {
  const [mode, setMode] = useState<'ferme' | 'tous' | 'certains'>(valeur ? valeur.mode : 'ferme');
  const [moins6, setMoins6] = useState(!!valeur?.moins6);
  const [choisis, setChoisis] = useState<string[]>(valeur?.groupes ?? []);
  const rien = mode === 'certains' && !moins6 && !choisis.length;
  const enregistrer = () => onSave(mode === 'ferme' || rien ? null : mode === 'tous' ? { mode: 'tous' } : { mode: 'certains', moins6, groupes: choisis });
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="[overflow-wrap:anywhere]">{titre}</DialogTitle>
          <DialogDescription>À qui ouvrir cette carte dans l'accueil des tout-petits ?</DialogDescription>
        </DialogHeader>
        {([['ferme', '🔒 Fermée'], ['tous', '🌍 Tous les tout-petits'], ['certains', '🎯 Certains']] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setMode(v)} aria-pressed={mode === v}
            className={`w-full rounded-xl border-2 px-3 py-2.5 text-start font-bold ${mode === v ? 'border-primary bg-primary/10' : 'border-border'}`}>{l}</button>
        ))}
        {mode === 'certains' && (
          <div className="flex flex-wrap gap-2">
            <Puce on={moins6} onClick={() => setMoins6((v) => !v)}>👶 Moins de 6 ans</Puce>
            {groupes.map((g) => <Puce key={g.id} on={choisis.includes(g.id)} onClick={() => setChoisis((c) => c.includes(g.id) ? c.filter((x) => x !== g.id) : [...c, g.id])}>{g.name}</Puce>)}
          </div>
        )}
        {rien && <p className="text-xs text-amber-700">Rien de coché : la carte restera fermée.</p>}
        <Button onClick={enregistrer}>💾 Enregistrer</Button>
      </DialogContent>
    </Dialog>
  );
}
