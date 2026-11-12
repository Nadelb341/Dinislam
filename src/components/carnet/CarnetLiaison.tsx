import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadDraft } from '@/hooks/useDraftRecovery';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { sendPushNotification } from '@/lib/pushHelper';
import { urlLisible } from '@/lib/fichiersPrives';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { useParentLock } from '@/hooks/useParentLock';
import ParentGateDialog from '@/components/settings/ParentGateDialog';
import { ImgPrive } from '@/components/shared/FichiersPrives';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useConvocations } from '@/components/convocations/useConvocations';
import { NOM_DESTINATAIRE, lienSms, lienWhatsApp, numeroPour, type Destinataire } from '@/lib/convocations';
import { dateCarnet, elevesVises, libelleMois, resumeCible, separerPourEleve, separerPourProf, suiviLecture, texteCarnetPartage, trierCarnet, type LectureCarnet, type MessageCarnet } from '@/lib/carnet';
import { useCarnet } from './useCarnet';
import { CarnetEditeur } from './CarnetEditeur';

/**
 * 📒 Carnet de liaison (Nadia, 2026-11-11) — juste sous le message de bienvenue, même carte côté élève et côté enseignante.
 * Présentation : bandeau compact (C) qui montre le message le plus récent EN ENTIER ; on déplie pour voir les autres.
 * Chaque message = une page de carnet écrite à la main (B) avec « ✅ J'ai lu » (A). Épinglés en haut, puis le plus récent.
 * Les 10 idées : J'ai lu + suivi, ✍️ Vu par un parent, 🕑 programmé, ⚡ modèles (ajouter/modifier/supprimer), 📎 pièce jointe,
 * 📌 épinglé, 🔔 relance après 2 jours (tâche automatique `taches-automatiques`), 💬 réponse courte (→ messagerie),
 * 📲 WhatsApp + 💬 SMS en 1 appui, 🗂️ archive par mois.
 */
export function CarnetLiaison({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useCarnet(user?.id ?? null, isAdmin);
  const { data: classe } = useConvocations(isAdmin);
  const { askValidation, validationDialog } = useConfirmValidation();
  const { unlock, unlockWithCode } = useParentLock();
  const [deplie, setDeplie] = useState(false);
  const [editeur, setEditeur] = useState<{ message: MessageCarnet | null } | null>(null);
  const [aSupprimer, setASupprimer] = useState<MessageCarnet | null>(null);
  const [signer, setSigner] = useState<MessageCarnet | null>(null);
  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ['carnet'] });
  const ref = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  // Ouvert depuis une notification ou « Continuer » un brouillon (/?carnet=1) : le carnet se déplie et on y descend
  useEffect(() => {
    if (params.get('carnet') !== '1' || !data) return;
    if (isAdmin) setDeplie(true);
    if (isAdmin && loadDraft('dinislam_carnet')) setEditeur({ message: null });
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    const p = new URLSearchParams(params); p.delete('carnet'); setParams(p, { replace: true });
  }, [params, data, isAdmin, setParams]);

  const messages = useMemo(() => trierCarnet(data?.messages ?? []), [data?.messages]);
  const lectures = data?.lectures ?? [];
  const miennes = (id: string) => lectures.filter((l) => l.message_id === id && l.user_id === user?.id);
  const nouveaux = isAdmin ? 0 : messages.filter((m) => !miennes(m.id).length).length;

  if (!user || !data) return null;
  if (!isAdmin && !messages.length) return null;

  // ——— Côté élève / parent ———
  const ecrireLecture = async (m: MessageCarnet, role: 'eleve' | 'parent', reponse?: 'ok' | 'question') => {
    const deja = lectures.find((l) => l.message_id === m.id && l.user_id === user.id && l.role === role);
    const maintenant = new Date().toISOString();
    const r = deja?.id
      ? await ecrireOuGarder({ table: 'carnet_lectures', op: 'update', id: deja.id, values: reponse ? { reponse, reponse_le: maintenant } : { lu_le: maintenant } })
      : await ecrireOuGarder({ table: 'carnet_lectures', op: 'insert', rows: [{ id: crypto.randomUUID(), message_id: m.id, user_id: user.id, role, lu_le: maintenant, ...(reponse ? { reponse, reponse_le: maintenant } : {}) }] });
    // Mise à jour tout de suite à l'écran (même hors ligne)
    queryClient.setQueryData(['carnet', user.id], (old: typeof data | undefined) => old && ({
      ...old, lectures: deja ? old.lectures.map((l) => (l === deja ? { ...l, reponse: reponse ?? l.reponse } : l)) : [...old.lectures, { message_id: m.id, user_id: user.id, role, lu_le: maintenant, reponse: reponse ?? null } as LectureCarnet],
    }));
    if (r === 'en_attente') toast.info('📡 Gardé sur ton appareil : envoyé dès le retour du réseau');
    else rafraichir();
    return r;
  };
  const repondre = async (m: MessageCarnet, reponse: 'ok' | 'question') => {
    try {
      await ecrireLecture(m, 'eleve', reponse);
      if (reponse === 'question') {
        const { error } = await supabase.from('user_messages').insert({ user_id: user.id, sender_type: 'user', message_type: 'text',
          message: `❓ J'ai une question sur le carnet de liaison : « ${m.emoji} ${m.titre} »\n(Écris ta question ici, en dessous 👇)` });
        if (error) throw error;
        const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        sendPushNotification({ userIds: (admins || []).map((a) => a.user_id), category: 'adm_msg', title: '❓ Question sur le carnet de liaison', body: `« ${m.titre} »`, data: { url: '/?open=messages' } });
        toast.success('❓ Ton professeur a reçu ta question dans la messagerie ✉️');
      } else toast.success('👍 Réponse envoyée à ton professeur');
    } catch (e) { toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet pour envoyer une question' : (e as Error).message); }
  };

  // ——— Côté enseignante ———
  const supprimer = async (m: MessageCarnet) => {
    try {
      await trashThenDelete({ userId: user.id, type: 'carnet_message', id: m.id, label: `📒 ${m.emoji} ${m.titre}`, data: m as never,
        remove: () => supabase.from('carnet_messages').delete().eq('id', m.id) });
      rafraichir();
      toast.success('Message supprimé (dans la corbeille de Paramètres)');
    } catch (e) { toast.error((e as Error).message); }
  };
  const epingler = async (m: MessageCarnet) => {
    const r = await ecrireOuGarder({ table: 'carnet_messages', op: 'update', id: m.id, values: { epingle: !m.epingle, updated_at: new Date().toISOString() } });
    rafraichir();
    toast.success(r === 'en_attente' ? '📡 Gardé : envoyé au retour du réseau' : m.epingle ? 'Message détaché' : '📌 Message épinglé en haut');
  };

  // 👧 Élève / parent : à lire = tout déplié ; déjà lu = « Voir l'historique », 6 mois (2026-11-12)
  // 👩‍🏫 Enseignante : le dernier envoyé + épinglés + programmés ; le reste = « Voir l'historique », effacé à 14 mois (2026-11-12)
  const eleve = separerPourEleve(messages, lectures, user.id, data.estParent);
  const prof = separerPourProf(messages);
  const enHaut = isAdmin ? prof.enHaut : eleve.aLire;
  const historique = isAdmin ? prof.historique : eleve.historique;

  const note = (m: MessageCarnet) => (
    <Note key={m.id} m={m} isAdmin={isAdmin} userId={user.id} lectures={lectures} miennes={miennes(m.id)} estParent={data.estParent} classe={classe}
      onLu={() => askValidation('Tu as bien lu ce message ?', `« ${m.emoji} ${m.titre} » sera marqué comme lu ✅ et rangé dans « Voir l'historique ».`, () => void ecrireLecture(m, 'eleve').catch((e) => toast.error((e as Error).message)))}
      onRepondre={(r) => void repondre(m, r)}
      onSigner={() => (data.estParent ? askValidation('Signer ce message ?', `« ${m.titre} » : « Vu par un parent » ✍️`, () => void ecrireLecture(m, 'parent').then(() => toast.success('✍️ Signé : ton professeur le voit'))) : setSigner(m))}
      onModifier={() => setEditeur({ message: m })} onSupprimer={() => setASupprimer(m)} onEpingler={() => void epingler(m)} />
  );

  return (
    <section ref={ref} aria-label="Carnet de liaison" className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 shadow-sm overflow-hidden">
      {/* Le bandeau : titre, pastille des nouveaux, « + Nouveau » (enseignante) */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <span className="text-xl" aria-hidden>📒</span>
          <span className="flex-1 min-w-0 font-extrabold text-amber-900 dark:text-amber-100">Carnet de liaison</span>
          {nouveaux > 0 && <span className="rounded-full border border-rose-300 dark:border-rose-800 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 text-sm font-extrabold px-2.5 py-0.5">{nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</span>}
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setEditeur({ message: null })} className="shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-sm font-extrabold">+ Nouveau</button>
        )}
      </div>
      <div className="space-y-3 px-3 pb-3">
        {enHaut.map(note)}
        {!enHaut.length && (isAdmin
          ? <p className="text-sm text-muted-foreground px-1">Aucun message pour l'instant. Touche « + Nouveau » pour informer tes élèves.</p>
          : <p className="text-sm text-amber-900 dark:text-amber-100 px-1">✅ Tu as tout lu. Bravo !</p>)}
        {historique.length > 0 && (
          <button type="button" aria-expanded={deplie} onClick={() => setDeplie(!deplie)}
            className="w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-card/70 px-3 py-2 text-sm font-extrabold text-amber-900 dark:text-amber-100">
            {deplie ? '▲ Cacher l\'historique' : `🗂️ Voir l'historique (${historique.length})`}
          </button>
        )}
        {deplie && historique.map((m, i) => {
          const mois = m.envoyer_le.slice(0, 7);
          const nouveauMois = i === 0 || historique[i - 1].envoyer_le.slice(0, 7) !== mois;
          return (
            <div key={m.id} className="space-y-1.5">
              {nouveauMois && <p className="px-1 text-xs font-extrabold text-amber-800 dark:text-amber-200">{libelleMois(mois)}</p>}
              {note(m)}
            </div>
          );
        })}
        {deplie && historique.length > 0 && (
          <p className="px-1 text-[11px] text-muted-foreground">{isAdmin ? '🗂️ Gardés 14 mois, puis rangés tout seuls dans la corbeille de Paramètres.' : '🗂️ Les messages restent 6 mois dans ton historique.'}</p>
        )}
      </div>

      {isAdmin && editeur && <CarnetEditeur message={editeur.message} modeles={data.modeles} classe={classe} onClose={() => { setEditeur(null); rafraichir(); }} />}
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {aSupprimer?.titre} » ?</AlertDialogTitle>
            <AlertDialogDescription>Le message disparaît du carnet des élèves. Il ira dans la corbeille de Paramètres (tu pourras le remettre).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ✍️ Signature sur le compte de l'enfant : le parent déverrouille l'Espace parents (mot de passe ou code parents) */}
      <ParentGateDialog open={!!signer} onOpenChange={(o) => { if (!o) setSigner(null); }} onUnlock={unlock} onUnlockCode={unlockWithCode}
        onSuccess={() => { const m = signer; setSigner(null); if (m) void ecrireLecture(m, 'parent').then(() => toast.success('✍️ Signé par un parent : le professeur le voit')); }} />
      {validationDialog}
    </section>
  );
}

type Classe = ReturnType<typeof useConvocations>['data'];

/** Une page du carnet, écrite à la main */
function Note({ m, isAdmin, userId, lectures, miennes, estParent, classe, onLu, onRepondre, onSigner, onModifier, onSupprimer, onEpingler }: {
  m: MessageCarnet; isAdmin: boolean; userId: string; lectures: LectureCarnet[]; miennes: LectureCarnet[]; estParent: boolean; classe: Classe;
  onLu: () => void; onRepondre: (r: 'ok' | 'question') => void; onSigner: () => void;
  onModifier: () => void; onSupprimer: () => void; onEpingler: () => void;
}) {
  const [panneau, setPanneau] = useState<null | 'suivi' | 'partage'>(null);
  const [photo, setPhoto] = useState(false);
  const programme = new Date(m.envoyer_le).getTime() > Date.now();
  const lu = miennes.length > 0;
  const signe = miennes.some((l) => l.role === 'parent') || (estParent && lu);
  const reponse = miennes.find((l) => l.reponse)?.reponse;
  const estImage = (m.piece_type || '').startsWith('image/');
  const eleves = useMemo(() => (classe?.eleves ?? []).map((e) => ({ id: e.id, nom: e.nom, groupes: e.groupes, parents: e.parents })), [classe?.eleves]);
  const suivi = isAdmin && classe ? suiviLecture(m, eleves, lectures) : null;
  void userId;

  const ouvrirPiece = async () => {
    if (!m.piece_url) return;
    if (estImage) { setPhoto(true); return; }
    try { window.open(await urlLisible(m.piece_url), '_blank', 'noopener'); } catch { toast.error('📡 Nécessite Internet pour ouvrir ce document la première fois'); }
  };

  return (
    <article className={cn('relative rounded-xl border border-amber-200 dark:border-amber-900 shadow-sm overflow-hidden',
      'bg-[#fffdf5] dark:bg-[#2a2418]',
      !isAdmin && !lu && 'ring-2 ring-destructive/60')}>
      <div className="relative px-3.5 py-2.5 space-y-1.5">
        <div className="flex items-start gap-2">
          <p className="cahier-main flex-1 min-w-0 text-xl leading-7 font-bold text-[#1e3a8a] dark:text-sky-200 [overflow-wrap:anywhere]">{m.emoji} {m.titre}</p>
          {m.epingle && <span className="text-base" title="Épinglé">📌</span>}
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground">
          {programme ? `🕑 Programmé : ${dateCarnet(m.envoyer_le, true)}` : dateCarnet(m.envoyer_le)}
          {isAdmin && <> · {resumeCible(m, classe?.groupes ?? [])}</>}
          {m.signature && <> · ✍️ signature demandée</>}
        </p>
        {m.texte.trim() && <p className="cahier-main text-[19px] leading-7 whitespace-pre-line [overflow-wrap:anywhere] text-slate-800 dark:text-amber-50">{m.texte}</p>}
        {m.piece_url && (
          <button type="button" onClick={() => void ouvrirPiece()} className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-xs font-semibold max-w-full">
            {estImage ? <ImgPrive src={m.piece_url} alt="" className="h-14 w-14 rounded object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded bg-red-100 text-red-700 font-black text-[10px]">PDF</span>}
            <span className="min-w-0 [overflow-wrap:anywhere] text-start">📎 {m.piece_nom || 'Pièce jointe'}</span>
          </button>
        )}

        {/* Élève / parent : J'ai lu, réponse courte, signature */}
        {!isAdmin && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {!lu ? (
              <button type="button" onClick={onLu} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm font-extrabold">✅ J'ai lu</button>
            ) : (
              <>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 text-xs font-bold">✓ Lu</span>
                {reponse ? <span className="text-xs font-semibold">{reponse === 'ok' ? '👍 Tu as répondu OK' : '❓ Question envoyée'}</span> : (<>
                  <button type="button" onClick={() => onRepondre('ok')} className="rounded-full border bg-card px-2.5 py-1 text-xs font-bold">👍 OK</button>
                  <button type="button" onClick={() => onRepondre('question')} className="rounded-full border bg-card px-2.5 py-1 text-xs font-bold">❓ J'ai une question</button>
                </>)}
              </>
            )}
            {m.signature && (signe
              ? <span className="rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 px-2.5 py-1 text-xs font-bold">✍️ Vu par un parent</span>
              : <button type="button" onClick={onSigner} className="rounded-full border-2 border-sky-400 bg-card px-2.5 py-1 text-xs font-extrabold text-sky-800 dark:text-sky-200">✍️ Signature d'un parent</button>)}
          </div>
        )}

        {/* Enseignante : suivi des lectures, WhatsApp / SMS, modifier, épingler, supprimer */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {suivi && !programme && (
              <button type="button" aria-expanded={panneau === 'suivi'} onClick={() => setPanneau(panneau === 'suivi' ? null : 'suivi')}
                className={cn('rounded-full px-2.5 py-1 text-xs font-extrabold border', suivi.lus === suivi.total ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-card')}>
                👁️ Lu par {suivi.lus} / {suivi.total}{m.signature ? ` · ✍️ ${suivi.signes}` : ''}
              </button>
            )}
            <button type="button" aria-expanded={panneau === 'partage'} onClick={() => setPanneau(panneau === 'partage' ? null : 'partage')} className="rounded-full border bg-card px-2.5 py-1 text-xs font-bold">📲 WhatsApp · 💬 SMS</button>
            <button type="button" onClick={onModifier} aria-label="Modifier ce message" className="rounded-full border bg-card px-2.5 py-1 text-xs font-bold">✏️</button>
            <button type="button" onClick={onEpingler} aria-label={m.epingle ? 'Détacher' : 'Épingler en haut'} className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', m.epingle ? 'bg-amber-200 dark:bg-amber-900' : 'bg-card')}>📌</button>
            <button type="button" onClick={onSupprimer} aria-label="Supprimer ce message" className="rounded-full border bg-card px-2.5 py-1 text-xs font-bold text-destructive">🗑️</button>
          </div>
        )}
        {isAdmin && panneau === 'suivi' && suivi && <Suivi m={m} suivi={suivi} />}
        {isAdmin && panneau === 'partage' && classe && <Partage m={m} classe={classe} />}
      </div>
      {photo && m.piece_url && (
        <Dialog open onOpenChange={setPhoto}>
          <DialogContent className="max-w-2xl p-2">
            <DialogTitle className="sr-only">{m.piece_nom || 'Photo'}</DialogTitle>
            <ImgPrive src={m.piece_url} alt={m.piece_nom || ''} className="w-full max-h-[80vh] object-contain rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

/** 👁️ Qui a lu / signé / répondu + relancer tout de suite ceux qui n'ont pas lu */
function Suivi({ m, suivi }: { m: MessageCarnet; suivi: ReturnType<typeof suiviLecture> }) {
  const [relance, setRelance] = useState(false);
  const relancer = () => {
    const ids = suivi.pasLu.flatMap((e) => [e.id, ...e.parents]);
    if (!ids.length) return;
    sendPushNotification({ userIds: ids, category: 'sched', title: '📒 Un message t\'attend dans le carnet', body: `${m.emoji} ${m.titre} : touche « J'ai lu » quand tu l'as lu 🙂`, data: { url: '/?carnet=1' } });
    setRelance(true);
    toast.success(`🔔 Rappel envoyé à ${suivi.pasLu.length} élève${suivi.pasLu.length > 1 ? 's' : ''}`);
  };
  return (
    <div className="rounded-lg border bg-card text-xs divide-y">
      {suivi.lignes.map((l) => (
        <div key={l.eleve.id} className="flex items-center gap-2 px-2.5 py-1.5">
          <span className="flex-1 min-w-0 font-semibold [overflow-wrap:anywhere]">{l.eleve.nom}</span>
          {l.reponse && <span>{l.reponse === 'ok' ? '👍' : '❓'}</span>}
          {m.signature && <span title={l.signe ? 'Signé par un parent' : 'Pas encore signé'}>{l.signe ? '✍️' : '·'}</span>}
          <span className={l.lu ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-muted-foreground'}>{l.lu ? '✓ lu' : '⏳ pas lu'}</span>
        </div>
      ))}
      {suivi.pasLu.length > 0 && (
        <div className="p-2">
          <button type="button" disabled={relance} onClick={relancer} className="w-full rounded-lg bg-amber-500 disabled:opacity-60 text-white py-1.5 font-bold">
            {relance ? '✓ Rappel envoyé' : `🔔 Rappeler les ${suivi.pasLu.length} qui n'ont pas lu`}
          </button>
        </div>
      )}
    </div>
  );
}

/** 📲 WhatsApp / 💬 SMS : 1 appui par élève, message déjà écrit (gratuit, depuis ton téléphone) */
function Partage({ m, classe }: { m: MessageCarnet; classe: NonNullable<Classe> }) {
  const [dest, setDest] = useState<Destinataire>('parent1');
  const texte = texteCarnetPartage(m);
  const vises = elevesVises(m, classe.eleves.map((e) => ({ id: e.id, nom: e.nom, groupes: e.groupes, parents: e.parents })));
  const parId = new Map(classe.eleves.map((e) => [e.id, e]));
  const copier = async () => { try { await navigator.clipboard.writeText(texte); toast.success('📋 Texte copié'); } catch { toast.error('Copie impossible'); } };
  return (
    <div className="rounded-lg border bg-card text-xs">
      <div className="flex flex-wrap items-center gap-1.5 p-2 border-b">
        <span className="font-bold">Envoyer à :</span>
        {(['parent1', 'parent2', 'eleve'] as Destinataire[]).map((d) => (
          <button key={d} type="button" aria-pressed={dest === d} onClick={() => setDest(d)}
            className={cn('rounded-full border px-2 py-0.5 font-semibold', dest === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{NOM_DESTINATAIRE[d]}</button>
        ))}
        <button type="button" onClick={() => void copier()} className="ms-auto rounded-full border px-2 py-0.5 font-semibold">📋 Copier le texte</button>
      </div>
      <div className="divide-y max-h-72 overflow-y-auto">
        {vises.map((v) => {
          const e = parId.get(v.id)!;
          const tel = numeroPour(e, dest);
          return (
            <div key={v.id} className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
              <span className="flex-1 min-w-[7rem] font-semibold [overflow-wrap:anywhere]">{v.nom}</span>
              {tel ? (<>
                <a href={lienWhatsApp(tel, texte)} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-2 py-1 font-bold bg-card">📲 WhatsApp</a>
                <a href={lienSms(tel, texte)} className="rounded-lg border px-2 py-1 font-bold bg-card">💬 SMS</a>
              </>) : <span className="text-muted-foreground">pas de numéro · Convocations › 📇 Numéros</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
