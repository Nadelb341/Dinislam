import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { groupColorProps } from '@/lib/studentGroups';
import { useHolidays } from '@/hooks/useGroupCourse';
import { inHolidays, type GroupSchedule } from '@/lib/groupCourse';
import { COURS_PAR_DEFAUT } from '@/lib/rotationDevoirs';
import { trashThenDelete } from '@/lib/trash';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { JOURS_ISO, NOM_DESTINATAIRE, VARIABLES, libelleHeure, libelleJour, lienSms, lienWhatsApp, numeroPour, prenomDe, rendreConvocation, type Destinataire } from '@/lib/convocations';
import { useConvocations, useFileHorsLigne, type EleveConv } from './useConvocations';

/**
 * 📨 Convocations (Nadia, 2026-11-11 — organisation A « le tableau des groupes », inspirée de Remind et ClassDojo).
 * Envoi gratuit : dans l'appli (notification à l'élève + ses parents reliés, carte « Je viens / Absent »), WhatsApp et SMS
 * en 1 appui (message déjà écrit). Onglets : Envoyer · Programmations (chaque semaine, automatique) · Modèles · Numéros · Historique.
 * Les 9 idées : variables, destinataire élève/parent, numéros, vacances sautées, historique, réponses, rappel la veille, copier, hors ligne.
 */
type Onglet = 'envoyer' | 'programmes' | 'modeles' | 'numeros' | 'historique';
const ONGLETS: { k: Onglet; t: string }[] = [
  { k: 'envoyer', t: '📨 Envoyer' }, { k: 'programmes', t: '⏰ Chaque semaine' }, { k: 'modeles', t: '📝 Modèles' }, { k: 'numeros', t: '📇 Numéros' }, { k: 'historique', t: '📜 Historique' },
];
const CLE_TEXTE = 'dinislam_convocation_texte';
const lireLocal = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const ecrireLocal = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };

/** Prochain cours d'un groupe dans les 7 jours (vacances NON sautées : pour dire « pas de cours, vacances ») */
function coursDeLaSemaine(h: Omit<GroupSchedule, 'group_id'>, now = new Date()) {
  const [hh, mm] = h.start_time.split(':').map(Number);
  for (let k = 0; k <= 7; k++) {
    const d = new Date(now); d.setDate(d.getDate() + k); d.setHours(hh, mm || 0, 0, 0);
    if (((d.getDay() + 6) % 7) + 1 === h.weekday && d > now) return d;
  }
  return null;
}

export function ConvocationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useConvocations(open);
  const { data: vacances = [] } = useHolidays();
  const enFile = useFileHorsLigne(open);
  const [onglet, setOnglet] = useState<Onglet>('envoyer');
  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ['convocations'] });
  const resultat = (r: 'ok' | 'en_attente', ok: string) => { rafraichir(); if (r === 'en_attente') toast.info('📡 Hors connexion : gardé sur cet appareil, envoyé au retour du réseau'); else toast.success(ok); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[94vh] overflow-y-auto rounded-2xl">
        <DialogTitle className="text-lg">📨 Convocations</DialogTitle>
        <DialogDescription>Dans l'appli : envoi tout seul et gratuit. WhatsApp et SMS : 1 appui, le message est déjà écrit.</DialogDescription>
        {enFile > 0 && <p className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 px-3 py-2">📡 {enFile} changement{enFile > 1 ? 's' : ''} en attente du réseau</p>}
        <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
          {ONGLETS.map((o) => (
            <button key={o.k} type="button" role="tab" aria-selected={onglet === o.k} onClick={() => setOnglet(o.k)}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border', onglet === o.k ? 'bg-[#d92d20] text-white border-[#d92d20]' : 'bg-card')}>{o.t}</button>
          ))}
        </div>
        {isError && <p className="text-sm text-destructive">📡 Impossible de charger (Internet nécessaire la toute première fois).</p>}
        {isLoading || !data ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p> : (
          <>
            {onglet === 'envoyer' && <Envoyer data={data} vacances={vacances} userId={user?.id ?? null} resultat={resultat} />}
            {onglet === 'programmes' && <Programmations data={data} userId={user?.id ?? null} resultat={resultat} />}
            {onglet === 'modeles' && <Modeles data={data} userId={user?.id ?? null} resultat={resultat} />}
            {onglet === 'numeros' && <Numeros data={data} resultat={resultat} />}
            {onglet === 'historique' && <Historique data={data} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type Donnees = NonNullable<ReturnType<typeof useConvocations>['data']>;
type Resultat = (r: 'ok' | 'en_attente', ok: string) => void;

/** Zone du message : modèles, variables, texte modifiable */
function Message({ data, texte, setTexte }: { data: Donnees; texte: string; setTexte: (t: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {data.modeles.map((m) => (
          <button key={m.id} type="button" onClick={() => setTexte(m.texte)} className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold">{m.titre}</button>
        ))}
      </div>
      <Textarea id="convocation-texte" value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} className="bg-yellow-50 dark:bg-yellow-950/20" />
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-muted-foreground">Ajouter :</span>
        {VARIABLES.map((v) => <button key={v} type="button" onClick={() => setTexte(`${texte}${texte.endsWith(' ') || !texte ? '' : ' '}${v}`)} className="rounded-md border px-1.5 py-0.5 font-mono">{v}</button>)}
      </div>
    </div>
  );
}

// ——— 📨 Envoyer ———
function Envoyer({ data, vacances, userId, resultat }: { data: Donnees; vacances: { label: string; start_date: string; end_date: string }[]; userId: string | null; resultat: Resultat }) {
  const [texte, setTexteState] = useState(() => lireLocal(CLE_TEXTE, data.modeles[0]?.texte ?? 'Salam {prénom},\nTu as cours {jour} à {heure} ({groupe}).'));
  const setTexte = (t: string) => { setTexteState(t); ecrireLocal(CLE_TEXTE, t); };
  const [dest, setDest] = useState<Destinataire>(() => (lireLocal('dinislam_convocation_dest', 'parent1') as Destinataire));
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState<{ titre: string; eleves: EleveConv[]; gid: string | null } | null>(null);
  const horaire = (gid: string | null) => data.horaires.find((h) => h.group_id === gid) ?? { ...COURS_PAR_DEFAUT, group_id: gid ?? '' };
  const coursDe = (gid: string | null) => coursDeLaSemaine(horaire(gid));
  const nomGroupe = (gid: string | null) => data.groupes.find((g) => g.id === gid)?.name ?? '';
  const messagePour = (e: EleveConv, gid: string | null) => {
    const c = coursDe(gid ?? e.groupes[0] ?? null);
    return rendreConvocation(texte, { prenom: prenomDe(e.nom), groupe: nomGroupe(gid ?? e.groupes[0] ?? null), jour: c ? libelleJour(c) : '…', heure: c ? libelleHeure(c) : '…' });
  };
  // Déjà convoqué pour CE cours (envoyé depuis 6 jours, par ce moyen)
  const dejaEnvoye = (sid: string, canal: string) => data.convocations.some((c) => c.student_id === sid && c.canal === canal && Date.now() - new Date(c.envoye_le).getTime() < 6 * 86400000);
  const noter = (e: EleveConv, gid: string | null, canal: 'whatsapp' | 'sms' | 'copie') => {
    const c = coursDe(gid ?? e.groupes[0] ?? null);
    void ecrireOuGarder({ table: 'convocations', op: 'insert', rows: [{ envoi_id: crypto.randomUUID(), student_id: e.id, group_id: gid, cours_le: c?.toISOString() ?? null, texte: messagePour(e, gid), canal, destinataire: NOM_DESTINATAIRE[dest] }] })
      .then(() => resultat('ok', canal === 'copie' ? '📋 Message copié' : `${canal === 'whatsapp' ? '📲 WhatsApp' : '💬 SMS'} ouvert : appuie sur « Envoyer » 🙂`), (err) => toast.error(err.message));
  };
  const envoyerAppli = async (eleves: EleveConv[], gid: string | null) => {
    const envoi = crypto.randomUUID();
    const rows = eleves.map((e) => { const c = coursDe(gid ?? e.groupes[0] ?? null); return { envoi_id: envoi, student_id: e.id, group_id: gid ?? e.groupes[0] ?? null, cours_le: c?.toISOString() ?? null, texte: messagePour(e, gid), canal: 'appli', destinataire: 'Appli' }; });
    const push = eleves.map((e) => ({ userIds: [e.id, ...e.parents], category: 'sched', tag: `convocation-${e.id.slice(0, 8)}`, title: '📨 Convocation au cours', body: messagePour(e, gid), data: { url: '/?convocation=1' } }));
    try { resultat(await ecrireOuGarder({ table: 'convocations', op: 'insert', rows, push }), `🔔 ${eleves.length} convocation${eleves.length > 1 ? 's' : ''} envoyée${eleves.length > 1 ? 's' : ''} dans l'appli`); }
    catch (err) { toast.error(`Pas envoyé : ${(err as Error).message}`); }
  };
  const copier = async (e: EleveConv, gid: string | null) => {
    try { await navigator.clipboard.writeText(messagePour(e, gid)); noter(e, gid, 'copie'); } catch { toast.error('Copie impossible : sélectionne le texte à la main'); }
  };

  const LigneEleve = ({ e, gid }: { e: EleveConv; gid: string | null }) => {
    const tel = numeroPour(e, dest);
    return (
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        <span className="flex-1 min-w-[8rem] text-sm font-semibold [overflow-wrap:anywhere]">
          {e.nom}{dejaEnvoye(e.id, 'appli') && <span title="Convoqué dans l'appli cette semaine"> 🔔</span>}
          {(() => { const r = data.convocations.find((c) => c.student_id === e.id && c.reponse); return r ? <span className="ms-1 text-[11px]">{r.reponse === 'je_viens' ? '✅ vient' : '❌ absent'}</span> : null; })()}
        </span>
        {tel ? (<>
          <a href={lienWhatsApp(tel, messagePour(e, gid))} target="_blank" rel="noopener noreferrer" onClick={() => noter(e, gid, 'whatsapp')}
            className={cn('rounded-lg border px-2 py-1 text-xs font-bold', dejaEnvoye(e.id, 'whatsapp') ? 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40' : 'bg-card')}>📲 WhatsApp{dejaEnvoye(e.id, 'whatsapp') ? ' ✓' : ''}</a>
          <a href={lienSms(tel, messagePour(e, gid))} onClick={() => noter(e, gid, 'sms')}
            className={cn('rounded-lg border px-2 py-1 text-xs font-bold', dejaEnvoye(e.id, 'sms') ? 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40' : 'bg-card')}>💬 SMS{dejaEnvoye(e.id, 'sms') ? ' ✓' : ''}</a>
        </>) : <span className="text-[11px] text-muted-foreground">pas de numéro ({NOM_DESTINATAIRE[dest].toLowerCase()}) · onglet 📇</span>}
        <button type="button" onClick={() => void copier(e, gid)} className="rounded-lg border px-2 py-1 text-xs" aria-label={`Copier le message de ${e.nom}`}>📋</button>
      </div>
    );
  };

  const Bloc = ({ id, titre, couleur, eleves, gid }: { id: string; titre: string; couleur?: string | null; eleves: EleveConv[]; gid: string | null }) => {
    const c = gid ? coursDe(gid) : null;
    const vac = c && inHolidays(c, vacances);
    const nbAppli = eleves.filter((e) => dejaEnvoye(e.id, 'appli')).length;
    const deplie = ouvert === id;
    return (
      <div className="rounded-xl border overflow-hidden">
        <button type="button" aria-expanded={deplie} onClick={() => setOuvert(deplie ? null : id)} className="w-full flex flex-wrap items-center gap-2 px-3 py-2.5 bg-muted/40 text-start">
          {couleur !== undefined && <span className={`w-3 h-3 rounded-full shrink-0 ${groupColorProps(couleur ?? null).className}`} style={groupColorProps(couleur ?? null).style} />}
          <span className="font-bold text-sm flex-1 min-w-0">{titre}</span>
          {c && <span className={cn('text-[11px] font-semibold', vac ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>{vac ? '🏖️ vacances' : `${libelleJour(c)} · ${libelleHeure(c)}`}</span>}
          <span className={cn('text-[11px] font-bold rounded-full px-2 py-0.5', nbAppli === eleves.length && eleves.length ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'text-[#d92d20]')}>
            {nbAppli === eleves.length && eleves.length ? '✓ envoyé' : `Envoyer ›`}
          </span>
        </button>
        {deplie && (
          <div className="divide-y">
            <div className="px-3 py-2">
              <Button size="sm" className="w-full bg-[#d92d20] hover:bg-[#b42318] text-white" disabled={!eleves.length}
                onClick={() => setConfirmer({ titre, eleves, gid })}>🔔 Envoyer dans l'appli à {eleves.length > 1 ? `ces ${eleves.length} élèves` : 'cet élève'} (gratuit, tout seul)</Button>
            </div>
            {eleves.map((e) => <LigneEleve key={e.id} e={e} gid={gid} />)}
            {!eleves.length && <p className="px-3 py-2 text-xs text-muted-foreground">Aucun élève.</p>}
          </div>
        )}
      </div>
    );
  };

  const exemple = data.eleves.find((e) => e.groupes.length) ?? data.eleves[0];
  const sansGroupe = data.eleves.filter((e) => !e.groupes.length);
  return (
    <div className="space-y-3">
      <Message data={data} texte={texte} setTexte={setTexte} />
      {exemple && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 text-sm whitespace-pre-line">
          <p className="text-[11px] font-bold text-muted-foreground mb-1">Aperçu pour {exemple.nom} :</p>{messagePour(exemple, exemple.groupes[0] ?? null)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold">WhatsApp / SMS à :</span>
        {(['eleve', 'parent1', 'parent2'] as Destinataire[]).map((d) => (
          <button key={d} type="button" aria-pressed={dest === d} onClick={() => { setDest(d); ecrireLocal('dinislam_convocation_dest', d); }}
            className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', dest === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{NOM_DESTINATAIRE[d]}</button>
        ))}
      </div>
      <div className="space-y-2">
        {data.groupes.map((g) => <Bloc key={g.id} id={g.id} titre={`👥 ${g.name}`} couleur={g.color} eleves={data.eleves.filter((e) => e.groupes.includes(g.id))} gid={g.id} />)}
        {sansGroupe.length > 0 && <Bloc id="sans" titre="👤 Élèves sans groupe" eleves={sansGroupe} gid={null} />}
        <Bloc id="tous" titre="🌍 Tout le monde" eleves={data.eleves} gid={null} />
      </div>
      <AlertDialog open={!!confirmer} onOpenChange={(o) => { if (!o) setConfirmer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer la convocation dans l'appli ?</AlertDialogTitle>
            <AlertDialogDescription>{confirmer?.titre} : {confirmer?.eleves.length} élève{(confirmer?.eleves.length ?? 0) > 1 ? 's' : ''} (et leurs parents reliés) recevront une notification et pourront répondre « Je viens » ou « Absent ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmer) void envoyerAppli(confirmer.eleves, confirmer.gid); setConfirmer(null); }}>Envoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ——— ⏰ Chaque semaine (programmations) ———
type Prog = Donnees['programmations'][number];
function Programmations({ data, userId, resultat }: { data: Donnees; userId: string | null; resultat: Resultat }) {
  const vide = { id: '', actif: true, jour: 1, heure: '18:00', cible: 'groupes', group_ids: [] as string[], student_ids: [] as string[], texte: data.modeles[0]?.texte ?? '', sauter_vacances: true, rappel_veille: true };
  const [edit, setEdit] = useState<typeof vide | null>(null);
  const [aSupprimer, setASupprimer] = useState<Prog | null>(null);
  const resume = (p: Pick<Prog, 'cible' | 'group_ids' | 'student_ids'>) => p.cible === 'tous' ? '🌍 Tout le monde'
    : p.cible === 'groupes' ? `👥 ${p.group_ids.map((g) => data.groupes.find((x) => x.id === g)?.name).filter(Boolean).join(', ') || 'aucun groupe'}`
    : `👤 ${p.student_ids.length} élève${p.student_ids.length > 1 ? 's' : ''}`;
  const enregistrer = async () => {
    if (!edit) return;
    if (!edit.texte.trim()) { toast.error('Écris le message'); return; }
    if (edit.cible === 'groupes' && !edit.group_ids.length) { toast.error('Choisis au moins un groupe'); return; }
    if (edit.cible === 'eleves' && !edit.student_ids.length) { toast.error('Choisis au moins un élève'); return; }
    const { id, ...valeurs } = edit;
    const v = { ...valeurs, heure: edit.heure.slice(0, 5), group_ids: edit.cible === 'groupes' ? edit.group_ids : [], student_ids: edit.cible === 'eleves' ? edit.student_ids : [] };
    try {
      resultat(id ? await ecrireOuGarder({ table: 'convocation_programmations', op: 'update', id, values: v })
        : await ecrireOuGarder({ table: 'convocation_programmations', op: 'insert', rows: [v] }), '⏰ Programmation enregistrée');
      setEdit(null);
    } catch (e) { toast.error(`Pas enregistré : ${(e as Error).message}`); }
  };
  const supprimer = async (p: Prog) => {
    if (!userId) return;
    try {
      await trashThenDelete({ userId, type: 'convocation_programmation', id: p.id, label: `⏰ Convocation du ${JOURS_ISO[p.jour]} à ${p.heure.slice(0, 5)}`, data: p, remove: () => supabase.from('convocation_programmations').delete().eq('id', p.id) });
      resultat('ok', 'Programmation supprimée (dans la corbeille de Paramètres)');
    } catch (e) { toast.error((e as Error).message); }
  };

  if (edit) return (
    <div className="space-y-3">
      <button type="button" onClick={() => setEdit(null)} className="text-sm font-semibold text-primary">← Retour</button>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs space-y-1"><span>Chaque</span>
          <select id="prog-jour" value={edit.jour} onChange={(e) => setEdit({ ...edit, jour: Number(e.target.value) })} className="w-full h-9 rounded-lg border bg-background px-2 text-sm">
            {[1, 2, 3, 4, 5, 6, 7].map((j) => <option key={j} value={j}>{JOURS_ISO[j]}</option>)}
          </select></label>
        <label className="text-xs space-y-1"><span>À</span><Input id="prog-heure" type="time" value={edit.heure.slice(0, 5)} onChange={(e) => setEdit({ ...edit, heure: e.target.value })} className="h-9" /></label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[['tous', '🌍 Tout le monde'], ['groupes', '👥 Des groupes'], ['eleves', '👤 Des élèves']].map(([k, t]) => (
          <button key={k} type="button" aria-pressed={edit.cible === k} onClick={() => setEdit({ ...edit, cible: k })} className={cn('rounded-full border px-3 py-1 text-xs font-bold', edit.cible === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{t}</button>
        ))}
      </div>
      {edit.cible === 'groupes' && <Puces items={data.groupes.map((g) => ({ id: g.id, nom: g.name }))} choisis={edit.group_ids} onChange={(l) => setEdit({ ...edit, group_ids: l })} />}
      {edit.cible === 'eleves' && <Puces items={data.eleves.map((e) => ({ id: e.id, nom: e.nom }))} choisis={edit.student_ids} onChange={(l) => setEdit({ ...edit, student_ids: l })} />}
      <Message data={data} texte={edit.texte} setTexte={(t) => setEdit({ ...edit, texte: t })} />
      <label className="flex items-center justify-between gap-2 text-sm"><span>🏖️ Rien pendant les vacances</span><Switch checked={edit.sauter_vacances} onCheckedChange={(v) => setEdit({ ...edit, sauter_vacances: v })} /></label>
      <label className="flex items-center justify-between gap-2 text-sm"><span>🎒 Rappel dans l'appli la veille du cours (18 h)</span><Switch checked={edit.rappel_veille} onCheckedChange={(v) => setEdit({ ...edit, rappel_veille: v })} /></label>
      <label className="flex items-center justify-between gap-2 text-sm"><span>✅ Programmation allumée</span><Switch checked={edit.actif} onCheckedChange={(v) => setEdit({ ...edit, actif: v })} /></label>
      <p className="text-[11px] text-muted-foreground">À l'heure choisie, chaque élève reçoit sa convocation dans l'appli, tout seul. Toi, tu reçois « 📨 Convocations envoyées » pour faire WhatsApp ou SMS en 1 appui.</p>
      <Button className="w-full" onClick={() => void enregistrer()}>Enregistrer</Button>
    </div>
  );

  return (
    <div className="space-y-2">
      {data.programmations.map((p) => (
        <div key={p.id} className={cn('rounded-xl border px-3 py-2 flex flex-wrap items-center gap-2', !p.actif && 'opacity-60')}>
          <button type="button" onClick={() => setEdit({ ...p, heure: p.heure.slice(0, 5) })} className="flex-1 min-w-0 text-start">
            <p className="text-sm font-bold">⏰ Chaque {JOURS_ISO[p.jour]} à {p.heure.slice(0, 5).replace(':', ' h ')}{p.actif ? '' : ' · éteinte'}</p>
            <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{resume(p)}{p.rappel_veille ? ' · 🎒 rappel la veille' : ''}{p.sauter_vacances ? ' · 🏖️' : ''}</p>
          </button>
          <button type="button" aria-label="Supprimer cette programmation" onClick={() => setASupprimer(p)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10">🗑️</button>
        </div>
      ))}
      {!data.programmations.length && <p className="text-sm text-muted-foreground">Aucune convocation automatique pour l'instant.</p>}
      <Button variant="outline" className="w-full" onClick={() => setEdit(vide)}>➕ Programmer une convocation chaque semaine</Button>
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer cette programmation ?</AlertDialogTitle><AlertDialogDescription>Elle ira dans la corbeille de Paramètres.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Puces({ items, choisis, onChange }: { items: { id: string; nom: string }[]; choisis: string[]; onChange: (l: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => { const on = choisis.includes(x.id); return (
        <button key={x.id} type="button" aria-pressed={on} onClick={() => onChange(on ? choisis.filter((y) => y !== x.id) : [...choisis, x.id])}
          className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{on ? '✓ ' : ''}{x.nom}</button>
      ); })}
    </div>
  );
}

// ——— 📝 Modèles ———
type Modele = Donnees['modeles'][number];
function Modeles({ data, userId, resultat }: { data: Donnees; userId: string | null; resultat: Resultat }) {
  const [edit, setEdit] = useState<{ id: string; titre: string; texte: string } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Modele | null>(null);
  const enregistrer = async () => {
    if (!edit || !edit.titre.trim() || !edit.texte.trim()) { toast.error('Écris un titre et un message'); return; }
    try {
      resultat(edit.id ? await ecrireOuGarder({ table: 'convocation_modeles', op: 'update', id: edit.id, values: { titre: edit.titre.trim(), texte: edit.texte } })
        : await ecrireOuGarder({ table: 'convocation_modeles', op: 'insert', rows: [{ titre: edit.titre.trim(), texte: edit.texte, position: data.modeles.length }] }), '📝 Modèle enregistré');
      setEdit(null);
    } catch (e) { toast.error((e as Error).message); }
  };
  const supprimer = async (m: Modele) => {
    if (!userId) return;
    try {
      await trashThenDelete({ userId, type: 'convocation_modele', id: m.id, label: `📝 Modèle « ${m.titre} »`, data: m, remove: () => supabase.from('convocation_modeles').delete().eq('id', m.id) });
      resultat('ok', 'Modèle supprimé (dans la corbeille de Paramètres)');
    } catch (e) { toast.error((e as Error).message); }
  };
  if (edit) return (
    <div className="space-y-2">
      <button type="button" onClick={() => setEdit(null)} className="text-sm font-semibold text-primary">← Retour</button>
      <Input id="modele-titre" value={edit.titre} onChange={(e) => setEdit({ ...edit, titre: e.target.value })} placeholder="Titre (ex. 📨 Convocation)" />
      <Textarea id="modele-texte" value={edit.texte} onChange={(e) => setEdit({ ...edit, texte: e.target.value })} rows={5} />
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-muted-foreground">Ajouter :</span>
        {VARIABLES.map((v) => <button key={v} type="button" onClick={() => setEdit({ ...edit, texte: `${edit.texte} ${v}` })} className="rounded-md border px-1.5 py-0.5 font-mono">{v}</button>)}
      </div>
      <Button className="w-full" onClick={() => void enregistrer()}>Enregistrer</Button>
    </div>
  );
  return (
    <div className="space-y-2">
      {data.modeles.map((m) => (
        <div key={m.id} className="rounded-xl border px-3 py-2 flex items-start gap-2">
          <button type="button" onClick={() => setEdit({ id: m.id, titre: m.titre, texte: m.texte })} className="flex-1 min-w-0 text-start">
            <p className="text-sm font-bold">{m.titre}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line [overflow-wrap:anywhere]">{m.texte}</p>
          </button>
          <button type="button" aria-label={`Supprimer le modèle ${m.titre}`} onClick={() => setASupprimer(m)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 shrink-0">🗑️</button>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={() => setEdit({ id: '', titre: '', texte: 'Salam {prénom},\n' })}>➕ Nouveau modèle</Button>
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer le modèle « {aSupprimer?.titre} » ?</AlertDialogTitle><AlertDialogDescription>Il ira dans la corbeille de Paramètres.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ——— 📇 Numéros (idée 3) ———
function Numeros({ data, resultat }: { data: Donnees; resultat: Resultat }) {
  const [ouvert, setOuvert] = useState<string | null>(data.groupes[0]?.id ?? null);
  const champ = (e: EleveConv, col: 'phone' | 'parent_phone' | 'parent_phone_nom' | 'parent2_phone' | 'parent2_phone_nom', placeholder: string, type = 'tel') => (
    <Input id={`num-${e.id}-${col}`} type={type} defaultValue={e[col] ?? ''} placeholder={placeholder} className="h-8 text-xs min-w-0"
      onBlur={(ev) => {
        const v = ev.target.value.trim();
        if (v === (e[col] ?? '')) return;
        void ecrireOuGarder({ table: 'profiles', op: 'update', id: e.id, col: 'user_id', values: { [col]: v || null } })
          .then((r) => resultat(r, `📇 Enregistré pour ${e.nom}`), (err) => toast.error(err.message));
      }} />
  );
  const Bloc = ({ id, titre, eleves }: { id: string; titre: string; eleves: EleveConv[] }) => (
    <div className="rounded-xl border overflow-hidden">
      <button type="button" aria-expanded={ouvert === id} onClick={() => setOuvert(ouvert === id ? null : id)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/40 text-start">
        <span className="font-bold text-sm flex-1">{titre}</span>
        <span className="text-[11px] text-muted-foreground">{eleves.filter((e) => e.phone || e.parent_phone || e.parent2_phone).length}/{eleves.length} avec un numéro</span>
      </button>
      {ouvert === id && (
        <div className="divide-y">
          {eleves.map((e) => (
            <div key={e.id} className="px-3 py-2 space-y-1.5">
              <p className="text-sm font-semibold">{e.nom}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {champ(e, 'phone', '📱 Élève')}
                <div className="grid grid-cols-2 gap-1">{champ(e, 'parent_phone_nom', 'Parent 1 (Maman)', 'text')}{champ(e, 'parent_phone', '📱 Parent 1')}</div>
                <div className="grid grid-cols-2 gap-1">{champ(e, 'parent2_phone_nom', 'Parent 2 (Papa)', 'text')}{champ(e, 'parent2_phone', '📱 Parent 2')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Les numéros sont visibles seulement par toi (et par l'élève, pour les siens). Ils sont enregistrés dès que tu quittes la case.</p>
      {data.groupes.map((g) => <Bloc key={g.id} id={g.id} titre={`👥 ${g.name}`} eleves={data.eleves.filter((e) => e.groupes.includes(g.id))} />)}
      {data.eleves.some((e) => !e.groupes.length) && <Bloc id="sans" titre="👤 Élèves sans groupe" eleves={data.eleves.filter((e) => !e.groupes.length)} />}
    </div>
  );
}

// ——— 📜 Historique (idée 5) ———
function Historique({ data }: { data: Donnees }) {
  const nom = (id: string) => data.eleves.find((e) => e.id === id)?.nom ?? 'Élève';
  const envois = useMemo(() => {
    const m = new Map<string, Donnees['convocations']>();
    for (const c of data.convocations) m.set(c.envoi_id, [...(m.get(c.envoi_id) || []), c]);
    return [...m.values()];
  }, [data.convocations]);
  const [ouvert, setOuvert] = useState<string | null>(null);
  useEffect(() => { setOuvert(null); }, [data.convocations.length]);
  const CANAL: Record<string, string> = { appli: '🔔 Appli', whatsapp: '📲 WhatsApp', sms: '💬 SMS', copie: '📋 Copié', rappel: '🎒 Rappel' };
  if (!envois.length) return <p className="text-sm text-muted-foreground">Aucune convocation ces 2 derniers mois.</p>;
  return (
    <div className="space-y-2">
      {envois.map((l) => {
        const c = l[0], viens = l.filter((x) => x.reponse === 'je_viens').length, abs = l.filter((x) => x.reponse === 'absent').length;
        return (
          <div key={c.envoi_id} className="rounded-xl border overflow-hidden">
            <button type="button" onClick={() => setOuvert(ouvert === c.envoi_id ? null : c.envoi_id)} className="w-full flex flex-wrap items-center gap-2 px-3 py-2 text-start">
              <span className="text-xs text-muted-foreground tabular-nums">{new Date(c.envoye_le).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs font-bold">{CANAL[c.canal] ?? c.canal}</span>
              <span className="text-sm font-semibold flex-1 min-w-0">{l.length === 1 ? nom(c.student_id) : `${l.length} élèves`}</span>
              {(viens > 0 || abs > 0) && <span className="text-[11px]">✅ {viens} · ❌ {abs}</span>}
            </button>
            {ouvert === c.envoi_id && (
              <div className="px-3 pb-2 space-y-1">
                <p className="text-xs whitespace-pre-line rounded-lg bg-muted/50 px-2 py-1">{c.texte}</p>
                {l.map((x) => <p key={x.id} className="text-xs">{nom(x.student_id)} {x.reponse === 'je_viens' ? '· ✅ vient' : x.reponse === 'absent' ? '· ❌ absent' : x.canal === 'appli' ? '· pas encore répondu' : ''}</p>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
