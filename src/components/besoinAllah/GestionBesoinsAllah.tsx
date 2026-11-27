import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { SortableCardList, type DragItemProps } from '@/components/shared/SortableCardList';
import { DraftRestoredBanner } from '@/components/shared/DraftRestoredBanner';
import { useCreationDraft } from '@/hooks/useCreationDraft';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { collectChildren, trashThenDelete } from '@/lib/trash';
import { untypedDb } from '@/lib/untypedDb';
import { errorMessage } from '@/lib/utils';
import { CLE_BESOINS_ALLAH } from '@/hooks/useBesoinsAllah';
import { besoinAVerifier, type Besoin, type NomBase, type NomBesoinVu } from '@/lib/besoinAllah';

/**
 * ✏️ « Modifier les émotions » (enseignante) : ajouter, modifier, ranger (appui long + glisser), 🗑️ corbeille
 * (une émotion part avec tous ses noms, restaurée d'un coup). Les noms de chaque émotion : pareil.
 * Hors ligne : ajouts / modifications / rangement gardés sur l'appareil puis envoyés ; la corbeille demande Internet.
 */
const MSG_ATTENTE = '📡 Gardé sur cet appareil, envoyé au retour du réseau';
const vibrer = () => { try { navigator.vibrate?.(15); } catch { /* rien */ } };

export function GestionBesoinsAllah({ besoins, enBase, userId, nomsBase, nouvelleDepart, onClose }: {
  besoins: Besoin[]; enBase: boolean; userId: string | null; nomsBase: NomBase[]; nouvelleDepart: boolean; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const [edition, setEdition] = useState<Besoin | 'nouveau' | null>(nouvelleDepart && enBase ? 'nouveau' : null);
  const [aSupprimer, setASupprimer] = useState<Besoin | null>(null);
  const rafraichir = () => { void queryClient.invalidateQueries({ queryKey: CLE_BESOINS_ALLAH }); };

  const ranger = async (n: Besoin[]) => {
    try {
      let attente = false;
      for (const [i, b] of n.entries()) {
        const position = (i + 1) * 10;
        if (b.position === position) continue;
        if (await ecrireOuGarder({ table: 'besoins_allah', op: 'update', id: b.id, values: { position } }) === 'en_attente') attente = true;
      }
      toast.success(attente ? '📡 Ordre gardé sur cet appareil, envoyé au retour du réseau' : '✋ Ordre enregistré');
    } catch (e) { toast.error(errorMessage(e)); }
    rafraichir();
  };

  const mettreCorbeille = async (b: Besoin) => {
    if (!userId) return;
    try {
      const { data, error } = await untypedDb.from('besoins_allah').select('*').eq('id', b.id).maybeSingle();
      if (error || !data) throw new Error('📡 Nécessite Internet pour mettre à la corbeille');
      const noms = await collectChildren('besoins_allah_noms', 'besoin_id', [b.id]);
      await trashThenDelete({ userId, type: 'besoin_allah', id: b.id, label: `${b.emoji} ${b.titre} (Besoin d'Allah)`, data, children: [noms],
        remove: () => untypedDb.from('besoins_allah').delete().eq('id', b.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres › Corbeille pour la remettre, avec ses noms)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const ligne = (b: Besoin, drag?: DragItemProps) => {
    const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
    return (
      <div key={b.id} ref={ref} style={style} {...attrs}
        className={`flex items-center gap-2 rounded-xl border-2 bg-white dark:bg-slate-900 p-2.5 touch-manipulation overflow-hidden ${isDragging ? 'opacity-40' : ''}`}
        >
        <span className="h-9 w-9 shrink-0 grid place-items-center rounded-full text-xl" style={{ background: b.couleur }} aria-hidden="true">{b.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm [overflow-wrap:anywhere]">{b.titre} {besoinAVerifier(b) && '⚠️'}</p>
          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{b.noms.length} noms · {b.fin_source || 'sans source'}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setEdition(b)} onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Modifier ${b.titre}`}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => setASupprimer(b)}
          onPointerDown={(e) => e.stopPropagation()} aria-label={`Supprimer ${b.titre}`}>🗑️</Button>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent level="nested" className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85dvh] overflow-y-auto p-5 space-y-3">
          <DialogHeader>
            <DialogTitle>✏️ Besoin d'Allah : les émotions</DialogTitle>
            <DialogDescription>
              ✏️ pour modifier (titre, couleur, phrases, noms, verset) · 🗑️ corbeille · ✋ appui long puis glisser pour ranger.
            </DialogDescription>
          </DialogHeader>
          {!enBase ? (
            <p className="rounded-xl border-2 border-amber-400 bg-amber-50 text-amber-900 p-3 text-sm">
              📡 Les émotions ne sont pas encore lues depuis la base (pas de réseau, ou la mise à jour de la base n'est pas encore faite) :
              l'appli montre la liste de départ. Les modifications seront possibles dès qu'elles seront en base.
            </p>
          ) : (
            <>
              <Button type="button" className="w-full" onClick={() => setEdition('nouveau')}>➕ Nouvelle émotion</Button>
              <div className="space-y-2">
                <SortableCardList items={besoins} onReorder={(n) => void ranger(n)} onDragStart={vibrer} renderItem={(b, drag) => ligne(b, drag)} />
              </div>
            </>
          )}
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        {edition && (
          <EditionBesoin b={edition === 'nouveau' ? null : besoins.find((x) => x.id === edition.id) ?? edition} besoins={besoins}
            userId={userId} nomsBase={nomsBase} rafraichir={rafraichir} onClose={() => setEdition(null)} />
        )}
        <ConfirmDeleteDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}
          onConfirm={() => { const b = aSupprimer; setASupprimer(null); if (b) void mettreCorbeille(b); }}
          title={`Supprimer « ${aSupprimer?.titre ?? ''} » ?`}
          description="L'émotion et tous ses noms iront dans la corbeille de Paramètres : tu pourras tout remettre d'un coup." />
      </DialogContent>
    </Dialog>
  );
}

interface Formulaire {
  emoji: string; titre: string; couleur: string; accroche: string; accroche_doree: string; conseil: string;
  fin_arabe: string; fin_phonetique: string; fin_traduction: string; fin_source: string; a_verifier: boolean; note: string;
}
const VIDE: Formulaire = {
  emoji: '🤲', titre: '', couleur: '#d97706', accroche: '', accroche_doree: 'Lis ces noms jusqu\'au bout.', conseil: '',
  fin_arabe: '', fin_phonetique: '', fin_traduction: '', fin_source: '', a_verifier: false, note: '',
};
const deBesoin = (b: Besoin): Formulaire => ({
  emoji: b.emoji, titre: b.titre, couleur: b.couleur, accroche: b.accroche, accroche_doree: b.accroche_doree, conseil: b.conseil,
  fin_arabe: b.fin_arabe, fin_phonetique: b.fin_phonetique, fin_traduction: b.fin_traduction, fin_source: b.fin_source,
  a_verifier: !!b.a_verifier, note: b.note ?? '',
});
const cleDe = (titre: string) => `${titre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'emotion'}-${Math.random().toString(36).slice(2, 6)}`;

/** ➕ / ✏️ Une émotion (et, une fois créée, ses noms) */
function EditionBesoin({ b, besoins, userId, nomsBase, rafraichir, onClose }: {
  b: Besoin | null; besoins: Besoin[]; userId: string | null; nomsBase: NomBase[]; rafraichir: () => void; onClose: () => void;
}) {
  const [f, setF] = useState<Formulaire>(b ? deBesoin(b) : VIDE);
  const [saving, setSaving] = useState(false);
  const draft = useCreationDraft<Formulaire>(b ? null : 'dinislam_besoin_allah', {
    active: !b, value: f, isEmpty: (v) => !v.titre.trim() && !v.accroche.trim() && !v.conseil.trim(), restore: (v) => setF({ ...VIDE, ...v }),
  });
  const maj = (k: keyof Formulaire) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const champ = (id: string, label: string, k: keyof Formulaire, extra?: { dir?: 'rtl'; arabe?: boolean; place?: string }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold" htmlFor={id}>{label}</label>
      <Input id={id} dir={extra?.dir} className={extra?.arabe ? 'font-arabic text-lg' : undefined} value={String(f[k])} onChange={maj(k)}
        placeholder={extra?.place} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
    </div>
  );

  const enregistrer = async () => {
    if (saving) return;
    if (!f.titre.trim()) { toast.error('Écris le nom de l\'émotion'); return; }
    setSaving(true);
    try {
      const valeurs = {
        emoji: f.emoji.trim() || '🤲', titre: f.titre.trim(), couleur: f.couleur, accroche: f.accroche.trim(), accroche_doree: f.accroche_doree.trim(),
        conseil: f.conseil.trim() || null, fin_arabe: f.fin_arabe.trim() || null, fin_phonetique: f.fin_phonetique.trim() || null,
        fin_traduction: f.fin_traduction.trim() || null, fin_source: f.fin_source.trim() || null, a_verifier: f.a_verifier, note: f.note.trim() || null,
      };
      const r = b
        ? await ecrireOuGarder({ table: 'besoins_allah', op: 'update', id: b.id, values: valeurs })
        : await ecrireOuGarder({ table: 'besoins_allah', op: 'insert', rows: [{
            id: crypto.randomUUID(), cle: cleDe(f.titre), ...valeurs, position: Math.max(0, ...besoins.map((x) => x.position)) + 10,
          }] });
      if (!b) draft.done();
      toast.success(r === 'en_attente' ? MSG_ATTENTE : b ? 'Émotion modifiée ✅' : 'Émotion ajoutée ✅ (ajoute ses noms avec ✏️)');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent level="confirm" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{b ? `✏️ ${b.emoji} ${b.titre}` : '➕ Nouvelle émotion'}</DialogTitle>
          <DialogDescription>Seul le nom de l'émotion est obligatoire. 🕌 Verset ou hadith : Coran, Al-Boukhârî ou Mouslim, avec la référence.</DialogDescription>
        </DialogHeader>
        {!b && <DraftRestoredBanner draft={draft} onCleared={() => setF(VIDE)} />}
        <div className="grid grid-cols-[5rem_1fr_4rem] gap-2 items-end">
          {champ('ba-emoji', 'Emoji', 'emoji')}
          {champ('ba-titre', 'Émotion', 'titre', { place: 'Ex. : Tristesse' })}
          <div className="space-y-1">
            <label className="text-xs font-semibold" htmlFor="ba-couleur">Couleur</label>
            <input id="ba-couleur" type="color" value={f.couleur} onChange={maj('couleur')} className="h-10 w-full rounded-md border cursor-pointer" />
          </div>
        </div>
        {champ('ba-accroche', 'Phrase d\'accroche (écran d\'accueil)', 'accroche', { place: 'Ex. : Tes erreurs te pèsent ?' })}
        {champ('ba-doree', 'Phrase en doré', 'accroche_doree')}
        <div className="space-y-1">
          <label className="text-xs font-semibold" htmlFor="ba-conseil">Comment utiliser ces noms dans son invocation</label>
          <TextareaDictee id="ba-conseil" rows={3} value={f.conseil} onChange={maj('conseil')} />
        </div>
        <p className="text-xs font-bold pt-1">📖 Fin de l'histoire (verset ou hadith)</p>
        {champ('ba-fin-ar', 'En arabe', 'fin_arabe', { dir: 'rtl', arabe: true })}
        {champ('ba-fin-ph', 'Phonétique', 'fin_phonetique')}
        {champ('ba-fin-fr', 'Traduction', 'fin_traduction')}
        {champ('ba-fin-src', 'Source exacte', 'fin_source', { place: 'Ex. : Coran 39:53 ou Al-Boukhârî 1496' })}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Switch checked={f.a_verifier} onCheckedChange={(v) => setF((x) => ({ ...x, a_verifier: v }))} /> ⚠️ À vérifier
        </label>
        {f.a_verifier && champ('ba-note', 'Ce qui est à vérifier', 'note')}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="button" disabled={saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
        {b && <NomsDuBesoin b={b} userId={userId} nomsBase={nomsBase} rafraichir={rafraichir} />}
      </DialogContent>
    </Dialog>
  );
}

interface FormNom { nom_id: number | null; arabe: string; phonetique: string; sens: string; attestation: string; a_verifier: boolean; note: string }
const NOM_VIDE: FormNom = { nom_id: null, arabe: '', phonetique: '', sens: '', attestation: '', a_verifier: false, note: '' };

/** Les noms d'une émotion : ➕ (choisi dans les 99 noms ou libre), ✏️, ✋ ranger, 🗑️ corbeille */
function NomsDuBesoin({ b, userId, nomsBase, rafraichir }: { b: Besoin; userId: string | null; nomsBase: NomBase[]; rafraichir: () => void }) {
  const [edition, setEdition] = useState<NomBesoinVu | 'nouveau' | null>(null);
  const [f, setF] = useState<FormNom>(NOM_VIDE);
  const [aSupprimer, setASupprimer] = useState<NomBesoinVu | null>(null);
  const [saving, setSaving] = useState(false);
  const noms99 = nomsBase;

  const ouvrir = (n: NomBesoinVu | 'nouveau') => {
    setEdition(n);
    setF(n === 'nouveau' ? NOM_VIDE : { nom_id: n.nom_id, arabe: n.arabe, phonetique: n.phonetique, sens: n.sens, attestation: n.attestation, a_verifier: !!n.a_verifier, note: n.note ?? '' });
  };
  const choisirDans99 = (id: string) => {
    const x = noms99.find((n) => String(n.id) === id);
    if (!x) { setF((v) => ({ ...v, nom_id: null })); return; }
    setF((v) => ({ ...v, nom_id: x.id, arabe: v.arabe || x.name_arabic || '', phonetique: v.phonetique || x.transliteration || '', sens: v.sens || x.name_french || '' }));
  };

  const enregistrer = async () => {
    if (saving || !edition) return;
    if (!f.arabe.trim() || !f.phonetique.trim() || !f.sens.trim()) { toast.error('Arabe, phonétique et sens sont obligatoires'); return; }
    setSaving(true);
    try {
      const valeurs = { nom_id: f.nom_id, arabe: f.arabe.trim(), phonetique: f.phonetique.trim(), sens: f.sens.trim(),
        attestation: f.attestation.trim() || null, a_verifier: f.a_verifier, note: f.note.trim() || null };
      const r = edition === 'nouveau'
        ? await ecrireOuGarder({ table: 'besoins_allah_noms', op: 'insert', rows: [{ id: crypto.randomUUID(), besoin_id: b.id, ...valeurs,
            position: Math.max(0, ...b.noms.map((x) => x.position)) + 10 }] })
        : await ecrireOuGarder({ table: 'besoins_allah_noms', op: 'update', id: edition.id, values: valeurs });
      toast.success(r === 'en_attente' ? MSG_ATTENTE : 'Nom enregistré ✅');
      setEdition(null); rafraichir();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const ranger = async (n: NomBesoinVu[]) => {
    try {
      let attente = false;
      for (const [i, x] of n.entries()) {
        const position = (i + 1) * 10;
        if (x.position === position) continue;
        if (await ecrireOuGarder({ table: 'besoins_allah_noms', op: 'update', id: x.id, values: { position } }) === 'en_attente') attente = true;
      }
      toast.success(attente ? '📡 Ordre gardé sur cet appareil, envoyé au retour du réseau' : '✋ Ordre enregistré');
    } catch (e) { toast.error(errorMessage(e)); }
    rafraichir();
  };

  const mettreCorbeille = async (n: NomBesoinVu) => {
    if (!userId) return;
    try {
      const { data, error } = await untypedDb.from('besoins_allah_noms').select('*').eq('id', n.id).maybeSingle();
      if (error || !data) throw new Error('📡 Nécessite Internet pour mettre à la corbeille');
      await trashThenDelete({ userId, type: 'besoin_allah_nom', id: n.id, label: `${n.phonetique} (Besoin d'Allah · ${b.titre})`, data,
        remove: () => untypedDb.from('besoins_allah_noms').delete().eq('id', n.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres › Corbeille pour le remettre)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const ligne = (n: NomBesoinVu, drag?: DragItemProps) => {
    const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
    return (
      <div key={n.id} ref={ref} style={style} {...attrs}
        className={`flex items-center gap-2 rounded-lg border bg-muted/40 p-2 touch-manipulation overflow-hidden ${isDragging ? 'opacity-40' : ''}`}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold [overflow-wrap:anywhere]">{n.phonetique} <span dir="rtl" className="font-arabic text-base font-normal">{n.arabe}</span> {n.a_verifier && '⚠️'}</p>
          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{n.sens} · {n.attestation || 'sans source'}{n.nom_id == null ? ' · pas de lien' : ''}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => ouvrir(n)} onPointerDown={(e) => e.stopPropagation()} aria-label={`Modifier ${n.phonetique}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => setASupprimer(n)} onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Supprimer ${n.phonetique}`}>🗑️</Button>
      </div>
    );
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-bold">✨ Les noms ({b.noms.length})</p>
      {edition ? (
        <div className="space-y-2 rounded-xl border-2 border-amber-300 p-3">
          <label className="text-xs font-semibold" htmlFor="ba-nom-99">Lien vers un des 99 noms (remplit les cases vides)</label>
          <select id="ba-nom-99" className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={f.nom_id ?? ''} onChange={(e) => choisirDans99(e.target.value)}>
            <option value="">— Aucun lien (nom absent de la liste) —</option>
            {noms99.map((n) => <option key={n.id} value={n.id}>{n.display_order ?? ''}. {n.transliteration} {n.name_arabic ?? ''}</option>)}
          </select>
          <Input dir="rtl" className="font-arabic text-lg" placeholder="Arabe" value={f.arabe} onChange={(e) => setF((v) => ({ ...v, arabe: e.target.value }))} />
          <Input placeholder="Phonétique (ex. : Al-Latîf)" value={f.phonetique} onChange={(e) => setF((v) => ({ ...v, phonetique: e.target.value }))} />
          <Input placeholder="Sens (ex. : Le Très Doux)" value={f.sens} onChange={(e) => setF((v) => ({ ...v, sens: e.target.value }))} />
          <Input placeholder="Où il est attesté (ex. : Coran 12:100)" value={f.attestation} onChange={(e) => setF((v) => ({ ...v, attestation: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Switch checked={f.a_verifier} onCheckedChange={(v) => setF((x) => ({ ...x, a_verifier: v }))} /> ⚠️ À vérifier
          </label>
          {f.a_verifier && <Input placeholder="Ce qui est à vérifier" value={f.note} onChange={(e) => setF((v) => ({ ...v, note: e.target.value }))} />}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEdition(null)}>Annuler</Button>
            <Button type="button" disabled={saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer le nom'}</Button>
          </div>
        </div>
      ) : (
        <>
          <SortableCardList items={b.noms} onReorder={(n) => void ranger(n)} onDragStart={vibrer} renderItem={(n, drag) => ligne(n, drag)} />
          <Button type="button" variant="outline" className="w-full" onClick={() => ouvrir('nouveau')}>➕ Ajouter un nom</Button>
        </>
      )}
      <ConfirmDeleteDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}
        onConfirm={() => { const n = aSupprimer; setASupprimer(null); if (n) void mettreCorbeille(n); }}
        title={`Retirer ${aSupprimer?.phonetique ?? ''} ?`}
        description="Le nom ira dans la corbeille de Paramètres, tu pourras le remettre." />
    </div>
  );
}
