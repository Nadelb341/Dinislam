import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Mic, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, errorMessage } from '@/lib/utils';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { loadDraft, saveDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { deposerAudioProf } from '@/lib/audioProf';
import { asPJ, deposerFichierDevoir, type PieceJointe } from '@/lib/devoirFichiers';
import { donnerDevoirs, type ItemDevoir } from '@/lib/devoirsEleve';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { moveToTrash, trashThenDelete } from '@/lib/trash';
import { supabase } from '@/integrations/supabase/client';
import { idYoutube } from '@/lib/youtube';
import {
  MODELES_LIBRES, MAX_QUESTIONS, LIBELLE_FORME, cleBrouillonLibre, colonnesDuFormulaire, compterEnCours, estEnCours, formLibreRempli,
  formLibreVide, lotsDuGroupe, manquesFormulaire, modeleDe, questionsDe, type FormLibre, type FormeReponse, type ModeleLibre,
} from '@/lib/devoirsLibres';
import type { Tables, Json } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { PiecesJointesVue } from '@/components/shared/PiecesJointesVue';
import { AudioPrive } from '@/components/shared/FichiersPrives';
import { AudioApercu } from '@/components/shared/AudioApercu';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';

/**
 * 📝 Devoirs libres (Nadia, 2026-11-26, organisation « C. Des modèles prêts à remplir »), dans l'écran « 📚 Devoirs » d'un groupe,
 * en haut de « Devoirs de la semaine prochaine » : 6 tuiles-modèles (🎤 Dictée · 📖 Texte à lire · 🎬 Vidéo + questions ·
 * 📄 Fiche à remplir · ✍️ Écriture · 🧩 Libre) avec une pastille rouge = devoirs libres EN COURS de ce modèle pour le groupe
 * (règle unique : `estEnCours` dans src/lib/devoirsLibres.ts). Toucher une tuile = formulaire adapté ; le devoir part au groupe
 * entier (élèves décochables), même date que « Pour quand ? ». ✏️ modifier (en direct chez les élèves) / 🗑️ corbeille.
 * Logique : src/lib/devoirsLibres.ts (testée). Hors ligne : donner / modifier = gardé puis envoyé ; fichiers = 📡 Internet.
 */

type LigneDevoir = Tables<'devoirs'>;
type Eleve = { user_id: string; full_name: string | null };
type RenduMini = { devoir_id: string | null; student_id: string; statut: string | null };

const dateFr = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'sans date');
const versLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso), p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Le formulaire rempli d'après un devoir déjà donné (pour ✏️ modifier) */
function formDepuisCopie(d: LigneDevoir): FormLibre {
  const modele = modeleDe(d.libre_modele).cle;
  return {
    modele, titre: d.titre, consigne: d.description ?? '',
    formes: ((d.reponses_attendues || []) as FormeReponse[]).filter((f) => f !== 'questions'),
    questions: questionsDe(d.questions).length ? questionsDe(d.questions) : modele === 'video' ? [''] : [],
    video_lien: d.video_lien ?? '', pj: asPJ(d.pieces_jointes), consigne_audio_url: d.consigne_audio_url, exclus: [],
  };
}

export function DevoirsLibresZone({ groupeId, nomGroupe, eleves, dateLimite, visibleA, devoirs, rendus, ouvert, onOuvert }: {
  groupeId: string | null;
  nomGroupe: string | null;
  eleves: Eleve[];
  dateLimite: string;
  visibleA: string | null;
  devoirs: LigneDevoir[];
  rendus: RenduMini[];
  ouvert: boolean;
  onOuvert: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const [form, setForm] = useState<{ mode: 'nouveau'; modele: ModeleLibre } | { mode: 'modifier'; lot: string } | null>(null);
  const [remplacer, setRemplacer] = useState<ModeleLibre | null>(null);
  const [aSupprimer, setASupprimer] = useState<{ lot: string; titre: string; n: number } | null>(null);
  const cle = cleBrouillonLibre(groupeId);
  const [brouillon, setBrouillon] = useState<FormLibre | null>(() => loadDraft<FormLibre>(cle));
  const relireBrouillon = () => setBrouillon(loadDraft<FormLibre>(cle));

  const comptes = useMemo(() => compterEnCours(devoirs, groupeId, now), [devoirs, groupeId, now]);
  const lots = useMemo(() => lotsDuGroupe(devoirs, groupeId), [devoirs, groupeId]);
  const enCours = lots.filter((l) => estEnCours(l.copies[0], now));
  const passes = lots.filter((l) => !estEnCours(l.copies[0], now));
  const total = enCours.length;

  const toucherTuile = (m: ModeleLibre) => {
    if (brouillon && formLibreRempli(brouillon) && brouillon.modele !== m) { setRemplacer(m); return; }
    setForm({ mode: 'nouveau', modele: m });
  };

  const jeterBrouillon = async () => {
    if (!user || !brouillon) return;
    const ok = await moveToTrash(user.id, 'draft', cle, `📝 Devoir libre commencé (${modeleDe(brouillon.modele).label})${brouillon.titre ? ` : ${brouillon.titre}` : ''}`, { key: cle, data: brouillon });
    if (!ok) { toast.error('📡 Mise en corbeille impossible (Internet nécessaire) : le brouillon est gardé'); return false; }
    clearDraft(cle);
    setBrouillon(null);
    return true;
  };

  const supprimerLot = async () => {
    if (!user || !aSupprimer) return;
    try {
      const { data: copies, error } = await supabase.from('devoirs').select('*').eq('libre_lot', aSupprimer.lot);
      if (error) throw error;
      if (!copies?.length) return;
      const ids = copies.map((c) => c.id);
      const [{ data: r }, { data: c }, { data: s }] = await Promise.all([
        supabase.from('devoirs_rendus').select('*').in('devoir_id', ids),
        supabase.from('devoir_checks').select('*').in('devoir_id', ids),
        supabase.from('devoir_steps').select('*').in('devoir_id', ids),
      ]);
      // Une seule ligne dans la corbeille : la 1ʳᵉ copie + les autres copies, les rendus et les cases cochées (restaurés d'un coup)
      await trashThenDelete({
        userId: user.id, type: 'devoir', id: copies[0].id, label: `📝 ${aSupprimer.titre} (devoir libre, ${copies.length} élève${copies.length > 1 ? 's' : ''})`,
        data: copies[0],
        children: [
          { table: 'devoirs', rows: copies.slice(1) as unknown as Record<string, unknown>[] },
          { table: 'devoirs_rendus', rows: (r || []) as unknown as Record<string, unknown>[] },
          { table: 'devoir_checks', rows: (c || []) as unknown as Record<string, unknown>[] },
          { table: 'devoir_steps', rows: (s || []) as unknown as Record<string, unknown>[] },
        ],
        remove: () => supabase.from('devoirs').delete().eq('libre_lot', aSupprimer.lot),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs-rendus'] });
      toast.success('🗑️ Devoir libre mis dans la corbeille de Paramètres');
    } catch (e) {
      toast.error(`${navigator.onLine ? '' : '📡 Nécessite Internet. '}${errorMessage(e)}`);
    } finally { setASupprimer(null); }
  };

  const ligneLot = (l: { cle: string; copies: LigneDevoir[] }, passe: boolean) => {
    const d = l.copies[0];
    const m = modeleDe(d.libre_modele);
    const ids = new Set(l.copies.map((c) => c.id));
    const siens = rendus.filter((r) => r.devoir_id && ids.has(r.devoir_id));
    const aValider = siens.filter((r) => r.statut === 'rendu').length;
    const valides = siens.filter((r) => r.statut === 'corrige').length;
    return (
      <div key={l.cle} className={cn('flex items-start gap-2 rounded-xl border bg-card px-2.5 py-2', passe && 'opacity-75')}>
        <span className="text-2xl leading-none pt-0.5" aria-hidden>{m.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="cahier-main text-base leading-5 [overflow-wrap:anywhere]">{d.titre}</p>
          <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{m.label} · 📅 {dateFr(d.date_limite)} · 👥 {l.copies.length} élève{l.copies.length > 1 ? 's' : ''}</p>
          {(aValider > 0 || valides > 0) && (
            <p className="text-[11px] font-bold">
              {aValider > 0 && <span className="me-2 text-orange-700 dark:text-orange-300">🟠 {aValider} à valider</span>}
              {valides > 0 && <span className="text-emerald-700 dark:text-emerald-300">✅ {valides} validé{valides > 1 ? 's' : ''}</span>}
            </p>
          )}
        </div>
        {d.libre_lot && <>
          <button type="button" aria-label={`Modifier le devoir libre ${d.titre}`} onClick={() => setForm({ mode: 'modifier', lot: d.libre_lot! })}
            className="shrink-0 grid h-9 w-9 place-items-center rounded-xl border bg-card text-base">✏️</button>
          <button type="button" aria-label={`Supprimer le devoir libre ${d.titre}`} onClick={() => setASupprimer({ lot: d.libre_lot!, titre: d.titre, n: l.copies.length })}
            className="shrink-0 grid h-9 w-9 place-items-center rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 text-base">🗑️</button>
        </>}
      </div>
    );
  };

  const copiesDuLot = form?.mode === 'modifier' ? lots.find((l) => l.cle === form.lot)?.copies ?? [] : [];

  return (
    <section id="devoirs-libres-zone" className="scroll-mt-20 rounded-2xl border-2 border-fuchsia-400 dark:border-fuchsia-800 bg-gradient-to-br from-fuchsia-50 via-pink-50 to-amber-50 dark:from-fuchsia-950/40 dark:via-pink-950/30 dark:to-amber-950/20 p-3 space-y-3 shadow-sm">
      <button type="button" aria-expanded={ouvert} onClick={() => onOuvert(!ouvert)} className="w-full flex items-center gap-2 text-start">
        <span className="flex-1 min-w-0 font-extrabold text-fuchsia-900 dark:text-fuchsia-100 [overflow-wrap:anywhere]">📝 Devoirs libres{nomGroupe ? ` · ${nomGroupe}` : ''}</span>
        {total > 0 && <span className="shrink-0 rounded-full bg-fuchsia-600 text-white px-2 py-0.5 text-[11px] font-extrabold">{total} en cours</span>}
        <span className="shrink-0 text-xs font-bold text-fuchsia-800 dark:text-fuchsia-200">{ouvert ? '▲' : '▼'}</span>
      </button>
      {ouvert && (<>
        {brouillon && formLibreRempli(brouillon) && (
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 text-sm space-y-1.5">
            <p className="font-bold [overflow-wrap:anywhere]">⏳ Devoir libre commencé : {modeleDe(brouillon.modele).emoji} {modeleDe(brouillon.modele).label}{brouillon.titre ? ` · « ${brouillon.titre} »` : ''}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm({ mode: 'nouveau', modele: brouillon.modele })} className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-extrabold">Continuer</button>
              <button type="button" onClick={() => void jeterBrouillon()} className="rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-bold">Effacer (corbeille)</button>
            </div>
          </div>
        )}
        <p className="text-sm font-extrabold text-fuchsia-900 dark:text-fuchsia-100">➕ Nouveau devoir libre</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODELES_LIBRES.map((m) => {
            const n = comptes[m.cle];
            return (
              <button key={m.cle} type="button" onClick={() => toucherTuile(m.cle)}
                aria-label={`${m.label}${n ? ` : ${n} en cours` : ''}`}
                className={cn('relative flex min-h-[6.5rem] flex-col items-start gap-0.5 rounded-2xl border-2 bg-gradient-to-br p-2.5 text-start shadow-sm transition-transform active:scale-[0.97]', m.tuile)}>
                <span className="text-3xl leading-none" aria-hidden>{m.emoji}</span>
                <span className="text-sm font-extrabold leading-tight [overflow-wrap:anywhere]">{m.label}</span>
                <span className="text-[11px] leading-tight opacity-90 [overflow-wrap:anywhere]">{m.aide}</span>
                {n > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid min-w-6 h-6 place-items-center rounded-full bg-red-600 px-1.5 text-xs font-extrabold text-white shadow ring-2 ring-white dark:ring-slate-900">{n}</span>
                )}
              </button>
            );
          })}
        </div>
        {enCours.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-fuchsia-900 dark:text-fuchsia-100">⏳ En cours ({enCours.length})</p>
            {enCours.map((l) => ligneLot(l, false))}
          </div>
        )}
        {passes.length > 0 && (
          <details className="rounded-xl border border-fuchsia-200 dark:border-fuchsia-900 bg-white/60 dark:bg-slate-900/40 p-2">
            <summary className="cursor-pointer list-none text-xs font-extrabold flex items-center gap-2">🗂️ Date passée ({passes.length})<span className="ms-auto">▼</span></summary>
            <div className="mt-1.5 space-y-1.5">{passes.map((l) => ligneLot(l, true))}</div>
          </details>
        )}
      </>)}

      {form && (
        <FormulaireDevoirLibre
          key={form.mode === 'nouveau' ? `n-${form.modele}` : `m-${form.lot}`}
          mode={form.mode} modele={form.mode === 'nouveau' ? form.modele : modeleDe(copiesDuLot[0]?.libre_modele).cle}
          lot={form.mode === 'modifier' ? form.lot : null} copies={copiesDuLot}
          groupeId={groupeId} eleves={eleves} dateLimite={dateLimite} visibleA={visibleA}
          onClose={() => { setForm(null); relireBrouillon(); }} />
      )}

      <AlertDialog open={!!remplacer} onOpenChange={(o) => { if (!o) setRemplacer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Commencer un autre devoir libre ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">Tu as déjà commencé un devoir « {brouillon ? modeleDe(brouillon.modele).label : ''} ». Il ira dans la corbeille de Paramètres (tu pourras le reprendre).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const m = remplacer; setRemplacer(null); void jeterBrouillon().then((ok) => { if (ok && m) setForm({ mode: 'nouveau', modele: m }); }); }}>Oui, commencer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devoir libre ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">« {aSupprimer?.titre} » disparaîtra chez {aSupprimer?.n} élève{(aSupprimer?.n ?? 0) > 1 ? 's' : ''}. Il ira dans la corbeille de Paramètres avec les réponses déjà envoyées : tu pourras tout restaurer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void supprimerLot()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/** 🎤 Consigne audio : enregistrer au micro OU déposer un fichier audio (déposé tout de suite, 📡 Internet) */
function ConsigneAudio({ url, obligatoire, onChange, onRetirer }: { url: string | null; obligatoire: boolean; onChange: (u: string) => void; onRetirer: () => void }) {
  const { user } = useAuth();
  const rec = useAudioRecorder();
  const [envoi, setEnvoi] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const deposer = async (b: Blob) => {
    if (!user) return;
    setEnvoi(true);
    try { onChange(await deposerAudioProf(user.id, b, 'consignes')); rec.reset(); toast.success('🎧 Audio ajouté'); }
    catch (e) { toast.error(`${navigator.onLine ? '' : '📡 Nécessite Internet pour envoyer un audio. '}${errorMessage(e)}`); }
    finally { setEnvoi(false); }
  };
  return (
    <div className="rounded-xl border-2 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-2.5 space-y-2">
      <p className="text-xs font-extrabold text-orange-900 dark:text-orange-100">🎧 Audio {obligatoire ? '(obligatoire : la dictée que l\'élève écoute)' : '(facultatif)'}</p>
      {url ? (
        <div className="flex items-center gap-2">
          <AudioPrive src={url} controls preload="none" className="h-9 min-w-0 flex-1" />
          <button type="button" onClick={onRetirer} aria-label="Retirer l'audio" className="h-7 w-7 shrink-0 rounded-full bg-[#EF4444] text-white text-xs font-extrabold grid place-items-center">✕</button>
        </div>
      ) : rec.blob ? (
        <div className="space-y-2">
          <AudioApercu blob={rec.blob} dataUrl={rec.previewUrl} className="w-full h-9" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={rec.reset} className="rounded-lg border px-2 py-2 text-xs font-bold">🔁 Recommencer</button>
            <button type="button" disabled={envoi} onClick={() => void deposer(rec.blob!)} className="rounded-lg bg-orange-600 text-white px-2 py-2 text-xs font-extrabold">{envoi ? '⏳ …' : '✅ Garder cet audio'}</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rec.recording
            ? <button type="button" onClick={rec.stop} className="rounded-lg bg-red-600 text-white py-2 text-sm font-bold flex items-center justify-center gap-2"><Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)</button>
            : <button type="button" onClick={() => void rec.start()} disabled={envoi} className="rounded-lg bg-orange-500 text-white py-2 text-sm font-bold flex items-center justify-center gap-2"><Mic className="h-4 w-4" /> Enregistrer au micro</button>}
          <button type="button" disabled={envoi || rec.recording} onClick={() => fichier.current?.click()} className="rounded-lg border border-orange-400 bg-white dark:bg-card py-2 text-sm font-bold">
            {envoi ? <Loader2 className="inline h-4 w-4 animate-spin" /> : '📂'} Déposer un fichier audio
          </button>
          <input ref={fichier} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void deposer(f); }} />
        </div>
      )}
    </div>
  );
}

function FormulaireDevoirLibre({ mode, modele, lot, copies, groupeId, eleves, dateLimite, visibleA, onClose }: {
  mode: 'nouveau' | 'modifier';
  modele: ModeleLibre;
  lot: string | null;
  copies: LigneDevoir[];
  groupeId: string | null;
  eleves: Eleve[];
  dateLimite: string;
  visibleA: string | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cle = cleBrouillonLibre(groupeId);
  const m = modeleDe(modele);
  const original = useRef<FormLibre | null>(mode === 'modifier' && copies[0] ? formDepuisCopie(copies[0]) : null);
  const [f, setF] = useState<FormLibre>(() => {
    if (original.current) return original.current;
    const b = loadDraft<FormLibre>(cle);
    return b && b.modele === modele ? { ...formLibreVide(modele), ...b } : formLibreVide(modele);
  });
  const [dateModif, setDate] = useState(() => versLocal(copies[0]?.date_limite ?? null));
  // Création : toujours la date de « Pour quand ? » ; modification : la date du devoir (modifiable ici)
  const date = mode === 'nouveau' ? dateLimite : dateModif;
  const [envoi, setEnvoi] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const [retrait, setRetrait] = useState<{ pj?: PieceJointe; audio?: string } | null>(null);
  const [depot, setDepot] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const maj = (p: Partial<FormLibre>) => setF((x) => ({ ...x, ...p }));

  // 💾 Brouillon automatique (création seulement), rappelé à l'ouverture de l'appli (pendingDrafts)
  useEffect(() => {
    if (mode !== 'nouveau') return;
    if (formLibreRempli(f)) saveDraft(cle, f); else clearDraft(cle);
  }, [f, mode, cle]);

  const dejaDonnes = useMemo(() => new Set(copies.map((c) => c.student_id).filter(Boolean) as string[]), [copies]);
  const choisis = eleves.filter((e) => !f.exclus.includes(e.user_id)).map((e) => e.user_id);
  // ✏️ En modification : élèves qui n'ont pas encore ce devoir et que Nadia coche en plus (rien de coché au départ)
  const [ajouts, setAjouts] = useState<string[]>([]);
  const nouveauxEnModif = mode === 'modifier' ? ajouts.filter((id) => !dejaDonnes.has(id)) : [];
  const manques = manquesFormulaire(f);
  const sansEleve = mode === 'nouveau' && !choisis.length;
  const avecAudio = modele === 'dictee' || modele === 'texte' || modele === 'libre';
  const avecVideo = modele === 'video' || modele === 'libre';
  const avecQuestions = modele === 'video' || modele === 'libre';
  const yt = idYoutube(f.video_lien);

  const ajouterFichiers = async (files: File[]) => {
    if (!user || !files.length) return;
    setDepot(true);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const x of files) nouveaux.push(await deposerFichierDevoir(`prof/${user.id}`, x));
      setF((x) => ({ ...x, pj: [...x.pj, ...nouveaux] }));
    } catch (e) { toast.error(`${navigator.onLine ? '' : '📡 Nécessite Internet pour envoyer un fichier. '}${errorMessage(e)}`); }
    finally { setDepot(false); }
  };

  /** ✕ : en création, le fichier va tout de suite dans la corbeille (restauré dans le brouillon) ; en modification, à l'enregistrement */
  const retirer = async () => {
    if (!user || !retrait) return;
    if (mode === 'nouveau') {
      const ok = await moveToTrash(user.id, 'devoir_libre_piece', cle, `${retrait.pj ? retrait.pj.name : '🎧 Audio'} (devoir libre pas encore donné)`,
        { lot: null, cle, attachment: retrait.pj ?? null, audio_url: retrait.audio ?? null });
      if (!ok) { toast.error('📡 Mise en corbeille impossible : rien n\'a été retiré'); setRetrait(null); return; }
    }
    if (retrait.pj) setF((x) => ({ ...x, pj: x.pj.filter((p) => p.path !== retrait.pj!.path) }));
    else maj({ consigne_audio_url: null });
    toast.success(mode === 'nouveau' ? 'Retiré (dans la corbeille de Paramètres)' : 'Retiré : ira dans la corbeille quand tu enregistres');
    setRetrait(null);
  };

  const donner = async () => {
    if (!user) return;
    if (!date) { toast.error('Choisis d\'abord la date à rendre (en haut, « Pour quand ? »)'); return; }
    setEnvoi(true);
    try {
      const c = colonnesDuFormulaire(f);
      const nouveauLot = crypto.randomUUID();
      const item: ItemDevoir = {
        titre: c.titre, type: 'libre', cible: '', audio: c.audio_requis, pj: c.pieces_jointes, consigne: c.consigne_audio_url,
        label: null, emoji: null, description: c.description, lien_lecon: null, etapes: [],
        extra: { libre_modele: c.libre_modele, libre_lot: nouveauLot, libre_groupe: groupeId, reponses_attendues: c.reponses_attendues, questions: c.questions, video_lien: c.video_lien },
      };
      const r = await donnerDevoirs({ eleveIds: choisis, items: [item], date_limite: date, visible_a: visibleA, created_by: user.id });
      clearDraft(cle);
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      toast.success(r === 'ok' ? `✅ Devoir libre donné à ${choisis.length} élève${choisis.length > 1 ? 's' : ''}` : '📡 Hors connexion : gardé sur l\'appareil, envoyé au retour du réseau');
      onClose();
    } catch (e) { toast.error(`Pas donné : ${errorMessage(e)}`); }
    finally { setEnvoi(false); }
  };

  const enregistrer = async () => {
    if (!user || !lot) return;
    setEnvoi(true);
    try {
      const c = colonnesDuFormulaire(f);
      const date_limite = date ? new Date(date).toISOString() : null;
      const eleveIds = [...dejaDonnes];
      const r = await ecrireOuGarder({
        table: 'devoirs', op: 'update', col: 'libre_lot', id: lot,
        values: { ...c, pieces_jointes: c.pieces_jointes as unknown as Json, date_limite },
        push: eleveIds.length ? [{ userIds: eleveIds, category: 'hw_new', title: '✏️ {prenom}, ton devoir a été modifié', body: c.titre, data: { url: '/?open=devoirs' } }] : undefined,
      });
      // Élèves cochés en plus : ils reçoivent une copie du même devoir (même lot)
      if (nouveauxEnModif.length) {
        await donnerDevoirs({ eleveIds: nouveauxEnModif, date_limite: date, visible_a: visibleA, created_by: user.id, items: [{
          titre: c.titre, type: 'libre', cible: '', audio: c.audio_requis, pj: c.pieces_jointes, consigne: c.consigne_audio_url,
          label: null, emoji: null, description: c.description, lien_lecon: null, etapes: [],
          extra: { libre_modele: c.libre_modele, libre_lot: lot, libre_groupe: groupeId, reponses_attendues: c.reponses_attendues, questions: c.questions, video_lien: c.video_lien },
        }] });
      }
      // Fichiers / audio retirés : copie dans la corbeille (restaurés sur toutes les copies du devoir)
      const avant = original.current;
      if (avant) {
        const retires = avant.pj.filter((p) => !f.pj.some((x) => x.path === p.path));
        for (const p of retires) await moveToTrash(user.id, 'devoir_libre_piece', lot, `${p.name} (devoir libre « ${c.titre} »)`, { lot, cle, attachment: p, audio_url: null });
        if (avant.consigne_audio_url && avant.consigne_audio_url !== f.consigne_audio_url) {
          await moveToTrash(user.id, 'devoir_libre_piece', lot, `🎧 Audio (devoir libre « ${c.titre} »)`, { lot, cle, attachment: null, audio_url: avant.consigne_audio_url });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      toast.success(r === 'ok' ? '✏️ Devoir libre modifié : les élèves le voient tout de suite' : '📡 Modifié sur cet appareil : envoyé dès le retour du réseau');
      onClose();
    } catch (e) { toast.error(`Pas enregistré : ${errorMessage(e)}`); }
    finally { setEnvoi(false); }
  };

  const valider = () => {
    if (manques.length) { toast.error(`Il manque : ${manques.join(', ')}`); return; }
    if (sansEleve) { toast.error('Coche au moins un élève'); return; }
    if (mode === 'nouveau') setConfirmer(true); else void enregistrer();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent level="nested" className="max-w-lg max-h-[92dvh] overflow-y-auto">
        <DialogTitle className="pe-8 [overflow-wrap:anywhere]">{mode === 'nouveau' ? `${m.emoji} Nouveau devoir libre : ${m.label}` : `✏️ Modifier : ${m.emoji} ${m.label}`}</DialogTitle>
        <DialogDescription>{m.aide}.{mode === 'nouveau' ? ' Ce que tu écris est gardé tout seul (brouillon).' : ' Les élèves voient le changement tout de suite.'}</DialogDescription>

        <div className="space-y-3">
          <label className="block text-sm font-bold">📝 Le devoir (ce que l'élève lit dans « Devoirs à faire »)
            <Input value={f.titre} onChange={(e) => maj({ titre: e.target.value })} placeholder="Ex. : Faire la dictée et m'envoyer une photo" className="mt-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
          </label>

          <label className="block text-sm font-bold">{modele === 'texte' ? '📖 Le texte à lire' : '💬 Consigne (facultatif)'}
            <TextareaDictee value={f.consigne} onChange={(e) => maj({ consigne: e.target.value })} rows={modele === 'texte' ? 6 : 3} className="mt-1"
              placeholder={modele === 'texte' ? 'Tape le texte ici, ou ajoute un document / une image juste dessous' : 'Ex. : écoute bien jusqu\'au bout avant d\'écrire'} />
          </label>

          {avecAudio && (
            <ConsigneAudio url={f.consigne_audio_url} obligatoire={modele === 'dictee'} onChange={(u) => maj({ consigne_audio_url: u })}
              onRetirer={() => f.consigne_audio_url && setRetrait({ audio: f.consigne_audio_url })} />
          )}

          {avecVideo && (
            <div className="rounded-xl border-2 border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-2.5 space-y-2">
              <p className="text-xs font-extrabold text-violet-900 dark:text-violet-100">🎬 Vidéo {modele === 'video' ? '(un lien, ou un fichier vidéo avec 📎 juste dessous)' : '(facultatif)'}</p>
              <Input value={f.video_lien} onChange={(e) => maj({ video_lien: e.target.value })} placeholder="Lien YouTube ou lien d'un fichier vidéo"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
              {yt && <SafeYoutubeEmbed videoId={yt} title="Aperçu de la vidéo" className="rounded-xl overflow-hidden" />}
              {f.video_lien.trim() && !yt && <p className="text-[11px] text-muted-foreground">Ce n'est pas un lien YouTube : l'élève le verra comme un lecteur vidéo (fichier .mp4…) ou un lien.</p>}
            </div>
          )}

          {/* 📎 Documents : tous les modèles */}
            <div className="rounded-xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-2.5 space-y-2">
              <p className="text-xs font-extrabold text-sky-900 dark:text-sky-100">📎 {modele === 'fiche' ? 'La fiche à remplir (PDF ou image, obligatoire)' : 'Documents, images, vidéos, PDF (facultatif)'}</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={depot} onClick={() => fichierRef.current?.click()} className="rounded-lg border border-sky-400 bg-white dark:bg-card py-2 text-sm font-bold">📎 Ajouter un fichier</button>
                <button type="button" disabled={depot} onClick={() => photoRef.current?.click()} className="rounded-lg border border-sky-400 bg-white dark:bg-card py-2 text-sm font-bold">📷 Prendre une photo</button>
              </div>
              <input ref={fichierRef} type="file" multiple className="hidden" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,audio/*,video/*"
                onChange={(e) => { const l = [...(e.target.files || [])]; e.target.value = ''; void ajouterFichiers(l); }} />
              <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const l = [...(e.target.files || [])]; e.target.value = ''; void ajouterFichiers(l); }} />
              {depot && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…</p>}
              {f.pj.length > 0 && <PiecesJointesVue items={f.pj} onRemove={(a) => setRetrait({ pj: a })} />}
            </div>


          {avecQuestions && (
            <div className="rounded-xl border-2 border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-2.5 space-y-2">
              <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-100">❓ Questions {modele === 'video' ? `(1 à ${MAX_QUESTIONS}) : l'élève répond par écrit` : `(facultatif, ${MAX_QUESTIONS} au plus)`}</p>
              {f.questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 text-sm font-bold">{i + 1}.</span>
                  <Input value={q} aria-label={`Question ${i + 1}`} onChange={(e) => maj({ questions: f.questions.map((x, k) => (k === i ? e.target.value : x)) })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
                  <button type="button" aria-label={`Retirer la question ${i + 1}`} onClick={() => maj({ questions: f.questions.filter((_, k) => k !== i) })}
                    className="h-7 w-7 shrink-0 rounded-full bg-[#EF4444] text-white text-xs font-extrabold grid place-items-center">✕</button>
                </div>
              ))}
              {f.questions.length < MAX_QUESTIONS && (
                <button type="button" onClick={() => maj({ questions: [...f.questions, ''] })}
                  className="rounded-full border border-indigo-300 bg-white dark:bg-card px-3 py-1 text-xs font-extrabold text-indigo-800 dark:text-indigo-200">➕ Une question</button>
              )}
            </div>
          )}

          {modele === 'libre' && (
            <div className="rounded-xl border-2 border-fuchsia-300 dark:border-fuchsia-800 bg-fuchsia-50 dark:bg-fuchsia-950/30 p-2.5 space-y-1.5">
              <p className="text-xs font-extrabold text-fuchsia-900 dark:text-fuchsia-100">📨 L'élève me répond avec… (tout ce qui est coché est demandé)</p>
              <div className="flex flex-wrap gap-1.5">
                {(['texte', 'photo', 'audio'] as FormeReponse[]).map((x) => {
                  const on = f.formes.includes(x);
                  return (
                    <button key={x} type="button" aria-pressed={on} onClick={() => maj({ formes: on ? f.formes.filter((y) => y !== x) : [...f.formes, x] })}
                      className={cn('rounded-full border-2 px-3 py-1 text-xs font-extrabold', on ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'bg-white dark:bg-card border-fuchsia-300')}>
                      {on ? '✓ ' : ''}{LIBELLE_FORME[x]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {modele !== 'libre' && (
            <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
              📨 L'élève répond avec : {m.formes.map((x) => LIBELLE_FORME[x]).join(m.toutes ? ' + ' : ' ou ')}
            </p>
          )}

          <div className="rounded-xl border-2 border-sky-300 dark:border-sky-800 bg-white/70 dark:bg-slate-900/40 p-2.5 space-y-1.5">
            {mode === 'nouveau'
              ? <p className="text-xs font-bold">📅 À rendre : {dateFr(date ? new Date(date).toISOString() : null)} <span className="font-normal text-muted-foreground">(change-la dans « Pour quand ? »)</span></p>
              : <label className="block text-xs font-bold">📅 À rendre pour le
                  <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
                </label>}
            <p className="text-xs font-extrabold pt-1">👥 Pour qui ? {mode === 'nouveau' ? `(${choisis.length} / ${eleves.length})` : ''}</p>
            <div className="max-h-48 overflow-y-auto divide-y rounded-lg border bg-card">
              {eleves.map((e) => {
                const deja = mode === 'modifier' && dejaDonnes.has(e.user_id);
                const coche = mode === 'modifier' ? deja || ajouts.includes(e.user_id) : !f.exclus.includes(e.user_id);
                return (
                  <label key={e.user_id} className={cn('flex items-center gap-2 px-2 py-1.5 text-sm', deja ? 'opacity-80' : 'cursor-pointer')}>
                    <input type="checkbox" className="h-5 w-5 accent-fuchsia-600" checked={coche} disabled={deja}
                      onChange={(ev) => {
                        const on = ev.target.checked;
                        if (mode === 'modifier') setAjouts((x) => (on ? [...x, e.user_id] : x.filter((y) => y !== e.user_id)));
                        else maj({ exclus: on ? f.exclus.filter((x) => x !== e.user_id) : [...f.exclus, e.user_id] });
                      }} />
                    <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{e.full_name || 'Élève'}</span>
                    {deja && <span className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">déjà donné</span>}
                  </label>
                );
              })}
            </div>
            {mode === 'modifier' && <p className="text-[11px] text-muted-foreground">Pour retirer ce devoir à un seul élève : 🗑️ dans sa carte (« 📋 Déjà donnés »).</p>}
          </div>

          {manques.length > 0 && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 [overflow-wrap:anywhere]">⚠️ Il manque : {manques.join(', ')}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border py-2.5 text-sm font-bold">{mode === 'nouveau' ? 'Fermer (brouillon gardé)' : 'Annuler'}</button>
            <button type="button" disabled={envoi || depot} onClick={valider}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-extrabold disabled:opacity-50">
              {envoi ? '⏳ …' : mode === 'nouveau' ? `✅ Donner à ${choisis.length} élève${choisis.length > 1 ? 's' : ''}` : '✅ Enregistrer'}
            </button>
          </div>
        </div>

        <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Donner ce devoir libre ?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">« {f.titre} » ({m.label}) pour {choisis.length} élève{choisis.length > 1 ? 's' : ''}, à rendre {dateFr(date ? new Date(date).toISOString() : null)}.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void donner()}>Donner</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!retrait} onOpenChange={(o) => { if (!o) setRetrait(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer {retrait?.pj ? 'ce fichier' : 'cet audio'} ?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">{retrait?.pj ? `« ${retrait.pj.name} »` : 'L\'audio'} ira dans la corbeille de Paramètres, d'où tu pourras le remettre.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void retirer()}>Retirer</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

/** 3. La ligne « 📝 Devoirs libres » au-dessus de Nourania dans « Devoir commun : les matières » */
export function LigneDevoirsLibres({ devoirs, groupeId, onOuvrir }: { devoirs: LigneDevoir[]; groupeId: string | null; onOuvrir: () => void }) {
  const now = new Date();
  const enCours = lotsDuGroupe(devoirs, groupeId).filter((l) => estEnCours(l.copies[0], now));
  return (
    <button type="button" onClick={onOuvrir}
      className="flex w-full flex-wrap items-center gap-1 rounded-2xl border-2 border-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-950/50 dark:border-fuchsia-700 px-2 py-1.5 text-start text-xs font-bold text-fuchsia-950 dark:text-fuchsia-50">
      <span className="me-auto">📝 Devoirs libres</span>
      <span className="rounded-full bg-white/80 dark:bg-slate-900/60 px-2 py-0.5 text-[11px] font-extrabold">{enCours.length ? `${enCours.length} en cours ›` : 'Préparer ›'}</span>
      {enCours.length > 0 && (
        <span className="basis-full space-y-0.5 pt-1">
          {enCours.slice(0, 4).map((l) => (
            <span key={l.cle} className="block cahier-main text-sm font-normal [overflow-wrap:anywhere]">{modeleDe(l.copies[0].libre_modele).emoji} {l.copies[0].titre}</span>
          ))}
          {enCours.length > 4 && <span className="block text-[11px]">… et {enCours.length - 4} autre{enCours.length - 4 > 1 ? 's' : ''}</span>}
        </span>
      )}
    </button>
  );
}
