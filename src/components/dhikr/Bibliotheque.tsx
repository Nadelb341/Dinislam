import { useMemo, useState } from 'react';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import { Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SortableCardList, rectSortingStrategy } from '@/components/shared/SortableCardList';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { cn } from '@/lib/utils';
import { momentEnAvant } from '@/lib/dhikr';
import type { DhikrItem } from '@/data/dhikrContenu';
import { MOMENTS, rangerLignes } from './EditeurDhikr';
import { BadgeStatut, TexteDhikr } from './Series';
import type { Couleurs } from './Ambiance';

/**
 * 📚 E · La bibliothèque des dhikr par moment (Nadia, 27/11) : tuiles 🌅 Réveil, ☀️ Matin, 🌙 Soir, 🕌 Après la prière,
 * 🤲 Pardon, 💪 Force, 🍽️ Repas, ✨ Tous ; le moment du jour brille. Chaque dhikr a sa fiche et « Faire avec le chapelet ».
 * ✏️ l'enseignante ajoute / modifie / range (appui long + glisser) / supprime (corbeille).
 */
const TUILES = [...MOMENTS, { cle: 'tous', titre: 'Tous', emoji: '✨' }];
const COULEUR_TUILE: Record<string, string> = {
  reveil: 'from-orange-200 to-rose-300', matin: 'from-amber-200 to-yellow-300', soir: 'from-indigo-300 to-violet-400', apres_priere: 'from-sky-200 to-blue-300',
  pardon: 'from-emerald-200 to-teal-300', force: 'from-rose-200 to-red-300', repas: 'from-lime-200 to-green-300', tous: 'from-slate-100 to-slate-300',
};

export function Bibliotheque({ items, isAdmin, ambiance, onFaire, onEditer, onNouveau }: {
  items: DhikrItem[]; isAdmin: boolean; ambiance: Couleurs;
  onFaire: (it: DhikrItem) => void; onEditer: (it: DhikrItem) => void; onNouveau: (moment: string | null) => void;
}) {
  const enAvant = momentEnAvant(new Date());
  const [moment, setMoment] = useState<string>(enAvant);
  const [fiche, setFiche] = useState<DhikrItem | null>(null);
  const [ordre, setOrdre] = useState<string[] | null>(null);
  const visibles = useMemo(() => {
    const l = items.filter((i) => moment === 'tous' || i.moments.includes(moment)).sort((a, b) => a.position - b.position);
    if (!ordre) return l;
    return [...l].sort((a, b) => ordre.indexOf(a.id) - ordre.indexOf(b.id));
  }, [items, moment, ordre]);
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/80 border-white';

  const rendre = (it: DhikrItem, drag?: Record<string, unknown>) => {
    const { ref, style, isDragging, ...attrs } = (drag ?? {}) as { ref?: (n: HTMLElement | null) => void; style?: React.CSSProperties; isDragging?: boolean };
    return (
      <div key={it.id} ref={ref} style={style} {...attrs} className={cn('rounded-3xl border p-3 flex flex-col gap-2 min-w-0', carte, isDragging && 'opacity-60')}>
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => setFiche(it)} className="flex-1 min-w-0 text-left">
            <h3 className="font-extrabold [overflow-wrap:anywhere]">{it.titre}</h3>
            <p className="text-xs font-bold" style={{ color: ambiance.or }}>{it.nombre_texte ?? `${it.nombre} fois`}</p>
          </button>
          {isAdmin && <button type="button" onClick={() => onEditer(it)} aria-label={`Modifier ${it.titre}`} className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-white text-slate-800 border shadow-sm"><Pencil className="h-4 w-4" /></button>}
        </div>
        {isAdmin && <div className="flex flex-wrap gap-1"><BadgeStatut g={it} /></div>}
        <p dir="rtl" lang="ar" className="font-arabic text-xl leading-loose line-clamp-2 text-center" style={{ color: ambiance.or }}>{it.arabe}</p>
        <p className="text-sm italic line-clamp-2 text-center [overflow-wrap:anywhere]">{it.phonetique}</p>
        <div className="mt-auto flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={() => setFiche(it)} className={cn('rounded-full border px-3 py-1.5 text-sm font-bold', nuit ? 'border-white/30 text-white' : 'border-slate-300 text-slate-800 bg-white')}>📜 La fiche</button>
          <button type="button" onClick={() => onFaire(it)} className="rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 px-3 py-1.5 text-sm font-extrabold shadow">📿 Faire avec le chapelet</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5" role="tablist" aria-label="Les moments">
        {TUILES.map((t) => {
          const actif = moment === t.cle;
          return (
            <button key={t.cle} type="button" role="tab" aria-selected={actif} onClick={() => setMoment(t.cle)}
              className={cn('relative rounded-2xl bg-gradient-to-br p-1.5 text-slate-900 flex flex-col items-center justify-center gap-0.5 min-h-[64px] border-2 transition active:scale-95',
                COULEUR_TUILE[t.cle], actif ? 'border-amber-500 ring-2 ring-amber-300 shadow-lg' : 'border-white/70')}>
              {t.cle === enAvant && <span className="absolute -top-1.5 -right-1 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 shadow dhk-scintille">maintenant</span>}
              <span className="text-2xl leading-none">{t.emoji}</span>
              <span className="text-[10px] sm:text-xs font-extrabold leading-tight text-center [overflow-wrap:anywhere]">{t.titre}</span>
            </button>
          );
        })}
      </div>
      {isAdmin && (
        <button type="button" onClick={() => onNouveau(moment === 'tous' ? null : moment)} className="w-full rounded-2xl border-2 border-dashed border-amber-400 py-2.5 font-bold inline-flex items-center justify-center gap-1">
          <Plus className="h-4 w-4" /> Nouveau dhikr{moment !== 'tous' ? ` (${TUILES.find((t) => t.cle === moment)?.titre})` : ''}
        </button>
      )}
      {!visibles.length && <p className="text-center font-bold py-4">🛠️ En cours de mise à jour pour ce moment</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin
          ? <SortableCardList items={visibles} strategy={rectSortingStrategy}
              onReorder={(l) => { setOrdre(l.map((x) => x.id)); void rangerLignes('dhikr_items', l.map((x) => x.id)); }}
              renderItem={(it, dp) => rendre(it, dp)} />
          : visibles.map((it) => rendre(it))}
      </div>
      {isAdmin && visibles.length > 1 && <p className="text-xs text-center opacity-80">✋ Appui long sur une carte puis glisser pour ranger.</p>}

      <Dialog open={!!fiche} onOpenChange={(o) => { if (!o) setFiche(null); }}>
        <DialogContent className="max-w-xl">
          {fiche && (
            <>
              <DialogHeader>
                <DialogTitle className="[overflow-wrap:anywhere]">📜 {fiche.titre}</DialogTitle>
                <DialogDescription>{fiche.nombre_texte ?? `${fiche.nombre} fois`}</DialogDescription>
              </DialogHeader>
              <div className="rounded-3xl p-3 bg-gradient-to-b from-sky-50 to-white text-slate-900">
                <TexteDhikr arabe={fiche.arabe} phonetique={fiche.phonetique} sens={fiche.sens} ambiance={{ nom: 'jour', texte: '#13254a', doux: '#3b5277', or: '#9a6700', voile: '', bord: '' }} grand />
              </div>
              {fiche.merite && <p className="text-sm [overflow-wrap:anywhere]">✨ <b>Son mérite :</b> {fiche.merite}</p>}
              {fiche.source && <p className="text-sm font-bold">📚 Source : {fiche.source} <PastilleSource source={fiche.source} degre={fiche.degre} divergence={fiche.degre_divergence} /></p>}
              <ZonesContenu cible={`dhikr:${fiche.id}`} isAdmin={isAdmin && !fiche.id.startsWith('secours-')} libelle={`Dhikr « ${fiche.titre} »`} />
              <button type="button" onClick={() => { const f = fiche; setFiche(null); onFaire(f); }}
                className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 py-3 font-extrabold shadow">📿 Faire avec le chapelet</button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
