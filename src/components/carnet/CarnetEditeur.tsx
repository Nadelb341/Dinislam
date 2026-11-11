import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { compressDocument } from '@/lib/compressImage';
import { useHolidays } from '@/hooks/useGroupCourse';
import { useCreationDraft } from '@/hooks/useCreationDraft';
import { DraftRestoredBanner } from '@/components/shared/DraftRestoredBanner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { BoutonDictee } from '@/components/shared/BoutonDictee';
import { ajouterDicte } from '@/lib/dictee';
import { groupColorProps } from '@/lib/studentGroups';
import { elevesVises, resumeCible, type MessageCarnet } from '@/lib/carnet';
import type { useConvocations } from '@/components/convocations/useConvocations';

type Classe = ReturnType<typeof useConvocations>['data'];
type Modele = { id: string; emoji: string; titre: string; texte: string; position: number };

interface Formulaire {
  emoji: string; titre: string; texte: string;
  cible: 'tous' | 'groupes' | 'eleves'; group_ids: string[]; student_ids: string[];
  piece_url: string | null; piece_nom: string | null; piece_type: string | null;
  epingle: boolean; signature: boolean; relance: boolean;
  /** vide = tout de suite ; sinon « 2026-12-18T18:00 » (heure de l'appareil) */
  programme: string;
}
const VIDE: Formulaire = { emoji: '📒', titre: '', texte: '', cible: 'tous', group_ids: [], student_ids: [], piece_url: null, piece_nom: null, piece_type: null, epingle: false, signature: false, relance: true, programme: '' };
const EMOJIS = ['📒', '📚', '🕌', '🎒', '🏖️', '🙏', '🌙', '📅', '⚠️', '🎉'];
const versLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

/** ✏️ Écrire / modifier un message du carnet (enseignante) */
export function CarnetEditeur({ message, modeles, classe, onClose }: { message: MessageCarnet | null; modeles: Modele[]; classe: Classe; onClose: () => void }) {
  const { user } = useAuth();
  const { data: vacances = [] } = useHolidays();
  const [f, setF] = useState<Formulaire>(() => message ? {
    emoji: message.emoji, titre: message.titre, texte: message.texte, cible: message.cible as Formulaire['cible'], group_ids: message.group_ids, student_ids: message.student_ids,
    piece_url: message.piece_url, piece_nom: message.piece_nom, piece_type: message.piece_type, epingle: message.epingle, signature: message.signature, relance: message.relance,
    programme: new Date(message.envoyer_le).getTime() > Date.now() ? versLocal(message.envoyer_le) : '',
  } : VIDE);
  const [vue, setVue] = useState<'message' | 'modeles'>('message');
  const [envoi, setEnvoi] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const [recherche, setRecherche] = useState('');
  const maj = (p: Partial<Formulaire>) => setF((x) => ({ ...x, ...p }));

  // 💾 Brouillon automatique (création seulement) : fermé sans envoyer → rappelé à l'ouverture de l'appli
  const draft = useCreationDraft<Formulaire>(message ? null : 'dinislam_carnet', {
    active: !message, value: f, isEmpty: (v) => !v.titre.trim() && !v.texte.trim(), restore: (v) => setF({ ...VIDE, ...v }),
  });

  const eleves = useMemo(() => (classe?.eleves ?? []).map((e) => ({ id: e.id, nom: e.nom, groupes: e.groupes, parents: e.parents })), [classe?.eleves]);
  const vises = elevesVises(f, eleves);

  const joindre = async (fichier: File | undefined) => {
    if (!fichier) return;
    try {
      const pret = await compressDocument(fichier);
      const ext = (pret.name.split('.').pop() || 'bin').toLowerCase();
      const chemin = `prof/carnet/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('devoirs-fichiers').upload(chemin, pret, { contentType: pret.type || undefined });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('devoirs-fichiers').getPublicUrl(chemin);
      maj({ piece_url: publicUrl, piece_nom: fichier.name, piece_type: pret.type || fichier.type });
      toast.success('📎 Pièce jointe ajoutée');
    } catch (e) {
      toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet pour joindre un fichier' : `Pas envoyé : ${(e as Error).message}`);
    }
  };

  const verifier = () => {
    if (!f.titre.trim()) { toast.error('Écris un titre'); return false; }
    if (f.cible === 'groupes' && !f.group_ids.length) { toast.error('Choisis au moins un groupe'); return false; }
    if (f.cible === 'eleves' && !f.student_ids.length) { toast.error('Choisis au moins un élève'); return false; }
    if (f.programme && new Date(f.programme).getTime() < Date.now() - 60000) { toast.error('La date programmée est déjà passée'); return false; }
    return true;
  };

  const envoyer = async () => {
    if (!user) return;
    setEnvoi(true);
    const maintenant = new Date().toISOString();
    const envoyerLe = f.programme ? new Date(f.programme).toISOString() : (message && new Date(message.envoyer_le).getTime() <= Date.now() ? message.envoyer_le : maintenant);
    const immediat = !f.programme;
    const valeurs = {
      emoji: f.emoji || '📒', titre: f.titre.trim(), texte: f.texte.trim(), cible: f.cible,
      group_ids: f.cible === 'groupes' ? f.group_ids : [], student_ids: f.cible === 'eleves' ? f.student_ids : [],
      piece_url: f.piece_url, piece_nom: f.piece_nom, piece_type: f.piece_type,
      epingle: f.epingle, signature: f.signature, relance: f.relance, envoyer_le: envoyerLe, updated_at: maintenant,
    };
    try {
      let r: 'ok' | 'en_attente';
      if (message) {
        // Un message programmé repoussé repart pour la notification à la bonne heure
        r = await ecrireOuGarder({ table: 'carnet_messages', op: 'update', id: message.id, values: { ...valeurs, ...(immediat ? {} : { notifie_le: null }) } });
      } else {
        const ids = vises.flatMap((e) => [e.id, ...e.parents]);
        r = await ecrireOuGarder({
          table: 'carnet_messages', op: 'insert',
          rows: [{ id: crypto.randomUUID(), ...valeurs, auteur: user.id, notifie_le: immediat ? maintenant : null }],
          push: immediat && ids.length ? [{ userIds: ids, category: 'sched', title: `📒 Carnet de liaison : ${valeurs.emoji} ${valeurs.titre}`, body: valeurs.texte.slice(0, 140) || 'Un nouveau message de ton professeur', data: { url: '/?carnet=1' } }] : undefined,
        });
        draft.done();
      }
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil : envoyé dès le retour du réseau'
        : message ? '✏️ Message modifié' : immediat ? `📒 Message envoyé à ${vises.length} élève${vises.length > 1 ? 's' : ''}` : '🕑 Message programmé');
      onClose();
    } catch (e) { toast.error(`Pas envoyé : ${(e as Error).message}`); }
    finally { setEnvoi(false); }
  };

  // 📅 Messages de l'année en avance : la veille de chaque début de vacances, à 18 h
  const prochainesVacances = vacances.filter((v) => new Date(`${v.start_date}T00:00:00`).getTime() > Date.now()).slice(0, 6);
  // Même nom deux années de suite (Noël 2026 et Noël 2027) : la date les distingue
  const dateCourte = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
  const veilleDe = (jour: string) => { const d = new Date(`${jour}T18:00:00`); d.setDate(d.getDate() - 1); return versLocal(d.toISOString()); };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[94dvh] overflow-y-auto rounded-2xl">
        <DialogTitle>{message ? '✏️ Modifier le message' : '✏️ Nouveau message du carnet'}</DialogTitle>
        <DialogDescription>Dans l'appli : gratuit et tout seul (notification aux élèves et aux parents reliés).</DialogDescription>
        <div className="flex gap-1">
          {(['message', 'modeles'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={vue === v} onClick={() => setVue(v)}
              className={cn('rounded-full border px-3 py-1 text-xs font-bold', vue === v ? 'bg-amber-500 text-white border-amber-500' : 'bg-card')}>{v === 'message' ? '📒 Message' : '⚡ Mes modèles'}</button>
          ))}
        </div>

        {vue === 'modeles' ? <Modeles modeles={modeles} onUtiliser={(m) => { maj({ emoji: m.emoji, titre: m.titre, texte: m.texte }); setVue('message'); }} /> : (
          <div className="space-y-3">
            <DraftRestoredBanner draft={draft} onCleared={() => setF(VIDE)} />
            {modeles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {modeles.map((m) => <button key={m.id} type="button" onClick={() => maj({ emoji: m.emoji, titre: m.titre, texte: m.texte })} className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold">{m.emoji} {m.titre}</button>)}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => <button key={e} type="button" aria-pressed={f.emoji === e} onClick={() => maj({ emoji: e })} className={cn('h-9 w-9 rounded-lg border text-lg', f.emoji === e ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/40' : 'bg-card')}>{e}</button>)}
            </div>
            <Input id="carnet-titre" value={f.titre} onChange={(e) => maj({ titre: e.target.value })} placeholder="Titre (ex. Sortie à la mosquée)"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('carnet-texte')?.focus(); } }} />
            <div className="relative">
              <Textarea id="carnet-texte" value={f.texte} onChange={(e) => maj({ texte: e.target.value })} rows={5} placeholder="Ton message… (ou touche 🎤 pour dicter)" className="cahier-main text-lg bg-[#fffdf5] dark:bg-[#2a2418] pr-11" />
              <BoutonDictee className="absolute right-2 bottom-2" onTexte={(t) => setF((x) => ({ ...x, texte: ajouterDicte(x.texte, t) }))} />
            </div>

            {/* À qui */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold">À qui ?</p>
              <div className="flex flex-wrap gap-1.5">
                {([['tous', '🌍 Tout le monde'], ['groupes', '👥 Des groupes'], ['eleves', '👤 Des élèves']] as const).map(([k, t]) => (
                  <button key={k} type="button" aria-pressed={f.cible === k} onClick={() => maj({ cible: k })}
                    className={cn('rounded-full border px-3 py-1 text-xs font-bold', f.cible === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{t}</button>
                ))}
              </div>
              {f.cible === 'groupes' && (
                <div className="flex flex-wrap gap-1.5">
                  {(classe?.groupes ?? []).map((g) => {
                    const on = f.group_ids.includes(g.id);
                    return <button key={g.id} type="button" aria-pressed={on} onClick={() => maj({ group_ids: on ? f.group_ids.filter((x) => x !== g.id) : [...f.group_ids, g.id] })}
                      className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', on ? 'bg-primary/10 border-primary' : 'bg-card')}>
                      <span className={`h-2.5 w-2.5 rounded-full ${groupColorProps(g.color ?? null).className}`} style={groupColorProps(g.color ?? null).style} />{on ? '✓ ' : ''}{g.name}</button>;
                  })}
                </div>
              )}
              {f.cible === 'eleves' && (
                <div className="space-y-1.5">
                  <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="🔎 Chercher un élève" className="h-8 text-xs" />
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {eleves.filter((e) => !recherche.trim() || e.nom.toLowerCase().includes(recherche.trim().toLowerCase())).map((e) => {
                      const on = f.student_ids.includes(e.id);
                      return <button key={e.id} type="button" aria-pressed={on} onClick={() => maj({ student_ids: on ? f.student_ids.filter((x) => x !== e.id) : [...f.student_ids, e.id] })}
                        className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', on ? 'bg-primary/10 border-primary' : 'bg-card')}>{on ? '✓ ' : ''}{e.nom}</button>;
                    })}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">{resumeCible(f, classe?.groupes ?? [])} · {vises.length} élève{vises.length > 1 ? 's' : ''}</p>
            </div>

            {/* Pièce jointe */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-full border bg-card px-3 py-1.5 text-xs font-bold">
                📎 {f.piece_url ? 'Changer la pièce jointe' : 'Joindre une photo ou un document'}
                <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { void joindre(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {f.piece_url && <span className="text-xs [overflow-wrap:anywhere]">{f.piece_nom}
                <button type="button" onClick={() => maj({ piece_url: null, piece_nom: null, piece_type: null })} aria-label="Retirer la pièce jointe" className="ms-1 font-bold text-destructive">✕</button></span>}
            </div>

            {/* Options */}
            <div className="rounded-xl border divide-y">
              {([
                ['epingle', '📌 Épingler en haut', 'Il reste en haut du carnet tant que tu ne le détaches pas.'],
                ['signature', '✍️ Signature d\'un parent', 'Un parent confirme « Vu par un parent » (Espace parents ou son compte).'],
                ['relance', '🔔 Relance au bout de 2 jours', 'Ceux qui ne l\'ont pas lu reçoivent un petit rappel tout seul.'],
              ] as const).map(([k, t, d]) => (
                <label key={k} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{t}</span><span className="block text-[11px] text-muted-foreground">{d}</span></span>
                  <Switch checked={f[k]} onCheckedChange={(v) => maj({ [k]: v } as Partial<Formulaire>)} />
                </label>
              ))}
              <div className="px-3 py-2 space-y-1.5">
                <label className="flex items-center gap-3">
                  <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">🕑 Programmer l'envoi</span><span className="block text-[11px] text-muted-foreground">Il partira tout seul le jour et à l'heure choisis.</span></span>
                  <Switch checked={!!f.programme} onCheckedChange={(v) => maj({ programme: v ? versLocal(new Date(Date.now() + 86400000).toISOString()).slice(0, 11) + '18:00' : '' })} />
                </label>
                {f.programme && <Input type="datetime-local" value={f.programme} onChange={(e) => maj({ programme: e.target.value })} className="h-9" />}
                {prochainesVacances.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="text-muted-foreground">📅 Veille des vacances :</span>
                    {prochainesVacances.map((v) => (
                      <button key={v.start_date} type="button" onClick={() => maj({ programme: veilleDe(v.start_date) })} className="rounded-full border bg-card px-2 py-0.5 font-semibold">{v.label} · {dateCourte(v.start_date)}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Fermer</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" disabled={envoi} onClick={() => { if (verifier()) setConfirmer(true); }}>
                {envoi ? '⏳ …' : message ? '✅ Enregistrer' : f.programme ? '🕑 Programmer' : '📒 Envoyer'}
              </Button>
            </div>
          </div>
        )}

        <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{message ? 'Enregistrer les changements ?' : f.programme ? 'Programmer ce message ?' : 'Envoyer ce message ?'}</AlertDialogTitle>
              <AlertDialogDescription>
                « {f.emoji} {f.titre} » · {resumeCible(f, classe?.groupes ?? [])} ({vises.length} élève{vises.length > 1 ? 's' : ''} et leurs parents reliés)
                {f.programme ? ` · le ${new Date(f.programme).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void envoyer()}>{message ? 'Enregistrer' : f.programme ? 'Programmer' : 'Envoyer'}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

/** ⚡ Modèles : ajouter, modifier, supprimer (→ corbeille), utiliser */
function Modeles({ modeles, onUtiliser }: { modeles: Modele[]; onUtiliser: (m: Modele) => void }) {
  const { user } = useAuth();
  const [edit, setEdit] = useState<{ id: string; emoji: string; titre: string; texte: string } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Modele | null>(null);
  const [liste, setListe] = useState(modeles);
  const enregistrer = async () => {
    if (!edit) return;
    if (!edit.titre.trim() || !edit.texte.trim()) { toast.error('Écris un titre et un texte'); return; }
    const { id, ...v } = edit;
    const valeurs = { emoji: v.emoji || '📒', titre: v.titre.trim(), texte: v.texte.trim() };
    try {
      if (id) {
        const r = await ecrireOuGarder({ table: 'carnet_modeles', op: 'update', id, values: valeurs });
        setListe((l) => l.map((m) => (m.id === id ? { ...m, ...valeurs } : m)));
        toast.success(r === 'en_attente' ? '📡 Gardé : envoyé au retour du réseau' : '⚡ Modèle modifié');
      } else {
        const nouveau = { id: crypto.randomUUID(), ...valeurs, position: liste.length };
        const r = await ecrireOuGarder({ table: 'carnet_modeles', op: 'insert', rows: [nouveau] });
        setListe((l) => [...l, nouveau]);
        toast.success(r === 'en_attente' ? '📡 Gardé : envoyé au retour du réseau' : '⚡ Modèle ajouté');
      }
      setEdit(null);
    } catch (e) { toast.error((e as Error).message); }
  };
  const supprimer = async (m: Modele) => {
    if (!user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'carnet_modele', id: m.id, label: `⚡ Modèle du carnet « ${m.titre} »`, data: m as never, remove: () => supabase.from('carnet_modeles').delete().eq('id', m.id) });
      setListe((l) => l.filter((x) => x.id !== m.id));
      toast.success('Modèle supprimé (dans la corbeille de Paramètres)');
    } catch (e) { toast.error((e as Error).message); }
  };
  if (edit) return (
    <div className="space-y-2">
      <button type="button" onClick={() => setEdit(null)} className="text-sm font-semibold text-primary">← Retour aux modèles</button>
      <div className="flex gap-2">
        <Input value={edit.emoji} onChange={(e) => setEdit({ ...edit, emoji: e.target.value })} className="w-16 text-center text-lg" aria-label="Emoji" />
        <Input value={edit.titre} onChange={(e) => setEdit({ ...edit, titre: e.target.value })} placeholder="Titre du modèle" className="flex-1" />
      </div>
      <Textarea value={edit.texte} onChange={(e) => setEdit({ ...edit, texte: e.target.value })} rows={5} className="cahier-main text-lg" />
      <Button className="w-full" onClick={() => void enregistrer()}>Enregistrer le modèle</Button>
    </div>
  );
  return (
    <div className="space-y-2">
      {liste.map((m) => (
        <div key={m.id} className="rounded-xl border px-3 py-2 flex items-start gap-2">
          <button type="button" onClick={() => onUtiliser(m)} className="flex-1 min-w-0 text-start">
            <p className="text-sm font-bold">{m.emoji} {m.titre}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line [overflow-wrap:anywhere] line-clamp-3">{m.texte}</p>
          </button>
          <button type="button" aria-label={`Modifier le modèle ${m.titre}`} onClick={() => setEdit({ id: m.id, emoji: m.emoji, titre: m.titre, texte: m.texte })} className="h-8 w-8 shrink-0 rounded-lg hover:bg-muted">✏️</button>
          <button type="button" aria-label={`Supprimer le modèle ${m.titre}`} onClick={() => setASupprimer(m)} className="h-8 w-8 shrink-0 rounded-lg text-destructive hover:bg-destructive/10">🗑️</button>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={() => setEdit({ id: '', emoji: '📒', titre: '', texte: 'Salam,\n' })}>➕ Nouveau modèle</Button>
      <p className="text-[11px] text-muted-foreground">Touche un modèle pour l'utiliser dans ton message.</p>
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer le modèle « {aSupprimer?.titre} » ?</AlertDialogTitle><AlertDialogDescription>Il ira dans la corbeille de Paramètres.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
