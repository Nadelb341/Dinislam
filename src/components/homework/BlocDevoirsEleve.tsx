import { useState, useEffect, useRef, useCallback } from "react";
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { withName } from '@/lib/encouragements';
import { Mic, Square, Send, CheckCircle, BookOpen, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendPushNotification } from "@/lib/pushHelper";
import { useQuery } from "@tanstack/react-query";
import { WeeklyPath } from "./WeeklyPath";
import { praiseFor, nextCourseDay, type WeeklyProgram } from "@/lib/weeklyProgram";
import { matiereOf } from "@/lib/devoirMatieres";

/** Mercredi prochain (jour du cours), aujourd'hui compris */
const prochainMercredi = () => { const d = new Date(); d.setHours(12, 0, 0, 0); while (d.getDay() !== 3) d.setDate(d.getDate() + 1); return d; };
import { useQueryClient } from "@tanstack/react-query";
import { useConfirmValidation } from "@/hooks/useConfirmValidation";
import { useConfetti } from "@/hooks/useConfetti";

type Devoir = {
  id: string;
  titre: string;
  type: string;
  description?: string;
  lien_lecon?: string;
  date_limite?: string;
  rendu: boolean;
  statut_rendu: string | null;
  commentaire_admin: string | null;
  /** L'élève a coché « J'ai travaillé ce devoir » : son diamant brille (2026-10-26) */
  travaille: boolean;
  /** Devoir en étapes (ex. « Ligne 1 », « Ligne 2 »…) et étapes déjà cochées (numéros à partir de 1) */
  etapes: string[];
  etapesFaites: number[];
  /** Date où le devoir a été donné */
  cree_le: string;
};

/** Un devoir est fait quand l'élève l'a coché, ou quand son audio est envoyé (sauf « à refaire ») */
const estFait = (d: Devoir) => d.travaille || (d.rendu && d.statut_rendu !== 'a_refaire');
const jourLong = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * 📓 Le cahier de l'élève (proposition A choisie par Nadia, 2026-10-26) : papier ligné, « Pour mercredi … : »,
 * une ligne par devoir reliée à son diamant ; toucher une ligne l'ouvre (case « J'ai travaillé », étapes, audio).
 * Chaque devoir est obligatoire : il reste dans « à faire » tant qu'il n'est pas fait.
 */
function CahierPapier({ devoirs, pourLe, renderDetail }: { devoirs: Devoir[]; pourLe: Date; renderDetail: (d: Devoir) => React.ReactNode }) {
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const aFaire = devoirs.filter((d) => !estFait(d)).sort((a, b) => (a.date_limite || '9999').localeCompare(b.date_limite || '9999'));
  const faits = devoirs.filter(estFait).sort((a, b) => b.cree_le.localeCompare(a.cree_le));
  const ilYa7Jours = new Date(Date.now() - 7 * 86400000).toISOString();
  const faitsRecents = faits.filter((d) => d.cree_le >= ilYa7Jours);
  const anciens = faits.filter((d) => d.cree_le < ilYa7Jours);
  // Anciens devoirs faits, rangés par jour où ils ont été donnés
  const parJour = new Map<string, Devoir[]>();
  anciens.forEach((d) => { const k = d.cree_le.slice(0, 10); parJour.set(k, [...(parJour.get(k) || []), d]); });
  const now = Date.now();

  const ligne = (d: Devoir) => {
    const m = matiereOf(d.type);
    const fait = estFait(d);
    const enRetard = !fait && !!d.date_limite && new Date(d.date_limite).getTime() < now;
    const sous = d.etapes.length > 0 && !fait
      ? `💎 ${d.etapesFaites.length}/${d.etapes.length} étape${d.etapes.length > 1 ? 's' : ''}`
      : d.date_limite ? `📅 pour le ${new Date(d.date_limite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : m.label;
    const chip = d.statut_rendu === 'a_refaire' ? { t: '🔄 à refaire', c: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200' }
      : enRetard ? { t: '⚠️ en retard', c: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200' }
      : !fait ? { t: 'à faire', c: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' }
      : d.statut_rendu === 'corrige' ? { t: '✅ corrigé', c: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200' }
      : d.statut_rendu === 'rendu' ? { t: '🎧 envoyé', c: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200' }
      : { t: '✓ fait', c: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200' };
    const ouvert = ouvertId === d.id;
    return (
      <div key={d.id} id={`devoir-${d.id}`} className="scroll-mt-24">
        <button type="button" onClick={() => setOuvertId(ouvert ? null : d.id)} aria-expanded={ouvert}
          className={cn("w-full flex items-center gap-2.5 rounded-xl border bg-card/95 px-3 py-2.5 text-left shadow-sm transition-colors",
            ouvert ? "border-sky-400" : "border-border hover:border-sky-300")}>
          <span className="text-xl shrink-0">{m.emoji}</span>
          <span className="flex-1 min-w-0">
            <b className={cn("block text-sm [overflow-wrap:anywhere]", fait && "text-muted-foreground")}>{d.titre}</b>
            <span className="block text-[11px] text-muted-foreground">{sous}</span>
          </span>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold", chip.c)}>{chip.t}</span>
        </button>
        {ouvert && <div className="mt-1.5">{renderDetail(d)}</div>}
      </div>
    );
  };

  return (
    <div className="cahier-papier rounded-r-2xl px-3 pt-2 pb-3 space-y-2">
      <p className="cahier-main text-lg leading-8">Pour {jourLong(pourLe)} :</p>
      {aFaire.length ? aFaire.map(ligne) : <p className="cahier-main text-lg leading-8 text-green-700 dark:text-green-400">Rien à faire, bravo ! ✓</p>}
      {aFaire.length > 0 && (
        <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">📌 Chaque devoir compte : fais-les tous pour faire briller tes diamants et ouvrir le trésor 🎁</p>
      )}
      {faitsRecents.length > 0 && (
        <>
          <p className="cahier-main text-lg leading-8 text-muted-foreground">Déjà fait cette semaine ✓</p>
          {faitsRecents.map(ligne)}
        </>
      )}
      {parJour.size > 0 && (
        <details className="pt-1">
          <summary className="cahier-main text-lg leading-8 text-muted-foreground cursor-pointer">📅 Semaines d'avant</summary>
          <div className="space-y-2 pt-1">
            {[...parJour.entries()].map(([jour, liste]) => (
              <div key={jour} className="space-y-1.5">
                <p className="cahier-main text-base text-muted-foreground">{new Date(jour + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} ✓ tout est fait</p>
                {liste.map(ligne)}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function CarteDevoir({ devoir, onRendu, onTravaille, onEtape }: { devoir: Devoir; onRendu: (id: string, audioBlob: Blob) => void; onTravaille: (id: string, value: boolean) => void; onEtape: (id: string, step: number, value: boolean) => void }) {
  const { askValidation, validationDialog } = useConfirmValidation();
  const { user } = useAuth();
  const [enregistrement, setEnregistrement] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setEnregistrement(true);
    } catch {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setEnregistrement(false);
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setSending(true);
    await onRendu(devoir.id, audioBlob);
    setSending(false);
  };


  const isARefaire = devoir.statut_rendu === 'a_refaire';
  const isCorrige = devoir.statut_rendu === 'corrige';
  const isRendu = devoir.rendu && devoir.statut_rendu === 'rendu';
  const isAFaire = !devoir.rendu;

  return (
    <div className={cn(
      "rounded-2xl p-4 mb-3 shadow-sm border-2",
      isCorrige
        ? "border-green-400 bg-green-50 dark:bg-green-950/20 dark:border-green-700"
        : isARefaire
        ? "border-destructive bg-destructive/5"
        : isRendu
        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700"
        : "border-destructive/40 bg-destructive/5"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{matiereOf(devoir.type).emoji}</span>
          <div>
            <p className="font-bold text-foreground text-sm">{devoir.titre}</p>
            {devoir.description && (
              <p className="text-xs text-muted-foreground">{devoir.description}</p>
            )}
          </div>
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          isCorrige
            ? "bg-green-500 text-white"
            : isARefaire
            ? "bg-destructive text-destructive-foreground"
            : isRendu
            ? "bg-amber-500 text-white"
            : "bg-destructive text-destructive-foreground"
        )}>
          {isCorrige ? '✅ Corrigé'
            : isARefaire ? '🔄 À refaire'
            : isRendu ? '⏳ Rendu'
            : '⏳ À faire'}
        </span>
      </div>

      {/* 💎 Devoir en étapes : une case par étape, le diamant se remplit petit à petit (2026-10-26) */}
      {devoir.etapes.length > 0 ? (
        <div className="rounded-xl border-2 border-dashed border-sky-400 bg-white dark:bg-slate-900 p-2.5 mb-2 space-y-1.5">
          <p className="text-xs font-extrabold text-sky-700 dark:text-sky-300">💎 Coche chaque étape travaillée ({devoir.etapesFaites.length}/{devoir.etapes.length})</p>
          {devoir.etapes.map((label, k) => {
            const n = k + 1;
            const fait = devoir.etapesFaites.includes(n);
            return (
              <button key={n} type="button" aria-pressed={fait}
                onClick={() => fait ? onEtape(devoir.id, n, false) : askValidation('Étape travaillée ?', `« ${label} » sera cochée 💎`, () => onEtape(devoir.id, n, true))}
                className={cn("w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm", fait ? "bg-emerald-50 dark:bg-emerald-950/30" : "hover:bg-muted/50")}>
                <span className={cn("h-5 w-5 shrink-0 rounded-md border-2 grid place-items-center text-xs font-extrabold", fait ? "bg-emerald-500 border-emerald-500 text-white" : "border-sky-500")}>{fait ? '✓' : ''}</span>
                <span className={cn("font-semibold [overflow-wrap:anywhere]", fait && "line-through text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
      /* 💎 Case « J'ai travaillé ce devoir » : allume le diamant du chemin de la semaine (confirmation pour cocher) */
      <button type="button"
        onClick={() => devoir.travaille ? onTravaille(devoir.id, false) : askValidation("Tu as travaillé ce devoir ?", `« ${devoir.titre} » sera coché, et ton diamant va briller 💎`, () => onTravaille(devoir.id, true))}
        className={cn("w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 mb-2 text-left transition-colors",
          devoir.travaille ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-dashed border-sky-400 bg-white dark:bg-slate-900")}
        aria-pressed={devoir.travaille}>
        <span className={cn("h-6 w-6 shrink-0 rounded-md border-2 grid place-items-center text-sm font-extrabold",
          devoir.travaille ? "bg-emerald-500 border-emerald-500 text-white" : "border-sky-500")}>{devoir.travaille ? '✓' : ''}</span>
        <span className="text-sm font-bold">
          {devoir.travaille ? "✅ J'ai travaillé ce devoir · mon diamant brille 💎" : "J'ai travaillé ce devoir 💎"}
        </span>
      </button>
      )}
      {/* ⭐ Petit mot automatique, le même à chaque ouverture */}
      {devoir.travaille && user && (
        <p className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-1.5 mb-2 text-sm font-semibold">{withName(user, praiseFor(devoir.id, user.id))}</p>
      )}
      {validationDialog}

      {devoir.date_limite && (() => {
        const deadline = new Date(devoir.date_limite);
        const now = new Date();
        const isPast = deadline < now;
        const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isUrgent = !isPast && hoursLeft < 24;
        const dateStr = deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = deadline.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return (
          <div className={cn(
            "text-xs font-semibold mb-2 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5",
            isPast
              ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : isUrgent
              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
          )}>
            <span>{isPast ? '⚠️' : '⏰'}</span>
            <span>
              Tu dois rendre ce devoir avant le {dateStr} à {timeStr}
              {isPast && ' — Date dépassée !'}
            </span>
          </div>
        );
      })()}

      {/* À refaire: show feedback + re-record */}
      {isARefaire && (
        <div className="mb-3">
          <div className="bg-destructive/10 rounded-xl p-3 mb-2">
            <p className="text-destructive text-sm font-semibold">🔄 À refaire</p>
            {devoir.commentaire_admin && (
              <p className="text-destructive text-xs mt-1">
                💬 {devoir.commentaire_admin}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Show record buttons for: not submitted OR à refaire */}
      {(isAFaire || isARefaire) && (
        <div className="flex flex-col gap-2">
          {devoir.lien_lecon && (
            <a
              href={devoir.lien_lecon}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground"
            >
              <BookOpen className="w-4 h-4" />
              Voir la leçon
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <div className="flex gap-2">
            {!enregistrement && !audioBlob && (
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <Mic className="w-4 h-4" />
                {isARefaire ? 'Réenregistrer' : 'Enregistrer'}
              </button>
            )}

            {enregistrement && (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground animate-pulse"
              >
                <Square className="w-4 h-4" />
                Arrêter
              </button>
            )}

            {audioBlob && !enregistrement && (
              <>
                <audio src={audioUrl!} controls className="flex-1 h-9" />
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? '...' : 'Rendre'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rendu en attente */}
      {isRendu && (
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">
            ⏳ Devoir rendu — en attente de correction
          </p>
        </div>
      )}

      {/* Corrigé */}
      {isCorrige && (
        <div className="flex items-center gap-2 mt-1">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
            ✅ Devoir corrigé par l'enseignante
          </p>
        </div>
      )}
    </div>
  );
}

export default function BlocDevoirsEleve() {
  const { user } = useAuth();
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [devoirsTermines, setDevoirsTermines] = useState<Devoir[]>([]);
  const [loading, setLoading] = useState(true);
  // Ouvert par défaut à l'ouverture de l'appli ; la flèche le referme et le rouvre (demande de Nadia, 2026-10-26)
  const [ouvert, setOuvert] = useState(true);
  const queryClient = useQueryClient();
  const { fireSuccess } = useConfetti();

  // 💎 Chemin de la semaine (le plus récent seulement : les anciens se rangent tout seuls)
  const { data: program = null } = useQuery({
    queryKey: ['weekly-program', user?.id],
    enabled: !!user,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('weekly_program_view', { p_student: user!.id });
      if (error) throw error;
      const row = (data || [])[0];
      return row ? ({ ...row, items: (row.items ?? []) as unknown as WeeklyProgram['items'] } as WeeklyProgram) : null;
    },
  });
  const diamondsLeft = program ? program.items.filter((i) => !i.done).length : 0;

  const chargerDevoirs = useCallback(async () => {
    if (!user) return;

    const { data: groupData } = await supabase
      .from('student_group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const gIds = groupData?.map(g => g.group_id) || [];

    let orFilter = `assigned_to.eq.all,student_id.eq.${user.id}`;
    if (gIds.length > 0) {
      orFilter += `,group_id.in.(${gIds.join(',')})`;
    }

    const { data } = await supabase
      .from('devoirs')
      .select('*')
      .or(orFilter)
      .order('created_at', { ascending: false });

    // Fetch rendus for this student
    const { data: rendus } = await supabase
      .from('devoirs_rendus')
      .select('devoir_id, statut, commentaire_admin')
      .eq('student_id', user.id);
    // Cases « J'ai travaillé ce devoir »
    const { data: checks } = await supabase.from('devoir_checks').select('devoir_id').eq('student_id', user.id);
    const travailles = new Set((checks || []).map((c) => c.devoir_id));
    const { data: steps } = await supabase.from('devoir_steps').select('devoir_id, step').eq('student_id', user.id);

    const enrichis: Devoir[] = (data || []).map(d => {
      const rendu = rendus?.find(r => r.devoir_id === d.id);
      return {
        id: d.id,
        titre: d.titre,
        type: d.type,
        description: d.description || undefined,
        lien_lecon: d.lien_lecon || undefined,
        date_limite: d.date_limite || undefined,
        rendu: !!rendu,
        statut_rendu: rendu?.statut || null,
        commentaire_admin: rendu?.commentaire_admin || null,
        travaille: travailles.has(d.id),
        cree_le: d.created_at || new Date().toISOString(),
        etapes: Array.isArray(d.etapes) ? (d.etapes as unknown[]).map(String) : [],
        etapesFaites: (steps || []).filter((x) => x.devoir_id === d.id).map((x) => x.step),
      };
    });

    // "a_refaire" goes back to active list
    setDevoirs(enrichis.filter(d => !d.rendu || d.statut_rendu === 'a_refaire'));
    setDevoirsTermines(enrichis.filter(d => d.rendu && d.statut_rendu !== 'a_refaire'));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    chargerDevoirs();
  }, [chargerDevoirs]);
  // 🔄 En direct : nouveau devoir, devoir modifié/supprimé, changement de groupe
  useRealtimeRefresh(['devoirs', 'student_group_members', 'devoir_checks', 'devoir_steps'], () => { void chargerDevoirs(); }, !!user);

  // 💎 Étape d'un devoir : quand toutes les étapes sont cochées, le devoir est « travaillé » (diamant plein)
  const handleEtape = async (devoirId: string, step: number, value: boolean) => {
    if (!user) return;
    const devoir = devoirs.find((d) => d.id === devoirId);
    if (!devoir) return;
    const { error } = value
      ? await supabase.from('devoir_steps').upsert({ devoir_id: devoirId, student_id: user.id, step }, { onConflict: 'devoir_id,student_id,step' })
      : await supabase.from('devoir_steps').delete().eq('devoir_id', devoirId).eq('student_id', user.id).eq('step', step);
    if (error) { toast.error('Erreur : ' + error.message); return; }
    const faites = value ? [...new Set([...devoir.etapesFaites, step])] : devoir.etapesFaites.filter((n) => n !== step);
    const complet = faites.length >= devoir.etapes.length;
    if (complet && !devoir.travaille) { await handleTravaille(devoirId, true); return; }
    if (!complet && devoir.travaille) { await handleTravaille(devoirId, false); return; }
    if (value) { fireSuccess(); toast.success(withName(user, `💎 Étape cochée, bravo {prenom} ! (${faites.length}/${devoir.etapes.length})`)); }
    queryClient.invalidateQueries({ queryKey: ['weekly-program', user.id] });
    void chargerDevoirs();
  };

  // 💎 Coche / décoche « J'ai travaillé ce devoir » : le diamant du chemin de la semaine suit (2026-10-26)
  const handleTravaille = async (devoirId: string, value: boolean) => {
    if (!user) return;
    const { error } = value
      ? await supabase.from('devoir_checks').upsert({ devoir_id: devoirId, student_id: user.id }, { onConflict: 'devoir_id,student_id' })
      : await supabase.from('devoir_checks').delete().eq('devoir_id', devoirId).eq('student_id', user.id);
    if (error) { toast.error('Erreur : ' + error.message); return; }
    if (value) {
      fireSuccess();
      toast.success(withName(user, '💎 Bravo {prenom}, ton diamant brille !'));
      const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      const adminIds = adminRoles?.map((r) => r.user_id) || [];
      const devoir = devoirs.find((d) => d.id === devoirId);
      if (adminIds.length) sendPushNotification({ userIds: adminIds, title: '💎 Devoir travaillé', category: 'adm_hw', body: `${user.user_metadata?.full_name || 'Un élève'} a travaillé : ${devoir?.titre || 'un devoir'}`, data: { url: '/?admin=cahier-texte' } });
    }
    queryClient.invalidateQueries({ queryKey: ['weekly-program', user.id] });
    void chargerDevoirs();
  };

  const handleRendu = async (devoirId: string, audioBlob: Blob) => {
    if (!user) return;

    const mimeType = audioBlob.type || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const fileName = `${user.id}/${devoirId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('devoirs-audios')
      .upload(fileName, audioBlob, { contentType: mimeType, upsert: true });

    if (uploadError) {
      toast.error('Erreur upload: ' + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('devoirs-audios')
      .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;

    // Check if a rendu already exists (case "à_refaire")
    const { data: existingRendu } = await supabase
      .from('devoirs_rendus')
      .select('id')
      .eq('devoir_id', devoirId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existingRendu) {
      // UPDATE — re-submit
      const { error } = await supabase.from('devoirs_rendus')
        .update({
          audio_url: audioUrl,
          statut: 'rendu',
          commentaire_admin: null,
          rendu_at: new Date().toISOString()
        })
        .eq('id', existingRendu.id);
      if (error) { toast.error('Erreur: ' + error.message); return; }
    } else {
      // INSERT — first submission
      const { error } = await supabase.from('devoirs_rendus')
        .insert({
          devoir_id: devoirId,
          student_id: user.id,
          audio_url: audioUrl,
          statut: 'rendu'
        });
      if (error) { toast.error('Erreur: ' + error.message); return; }
    }

    // Notify admins
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminIds = adminRoles?.map((r) => r.user_id) || [];
    const devoir = devoirs.find(d => d.id === devoirId);

    if (adminIds.length > 0) {
      sendPushNotification({
        userIds: adminIds,
        title: '📚 Devoir rendu', category: 'adm_hw',
        body: `${user.user_metadata?.full_name || 'Un élève'} a rendu : ${devoir?.titre || 'un devoir'}`,
        data: { url: '/?admin=cahier-texte' },
      });
    }

    toast.success(withName(user, "🎉 Bravo {prenom}, ton devoir est envoyé à ton prof !"));
    chargerDevoirs();
  };

  if (loading || (devoirs.length === 0 && devoirsTermines.length === 0 && !program)) return null;

  // Devoirs pas encore faits (cochés ou audio envoyé), comme les diamants
  const totalAFaire = [...devoirs, ...devoirsTermines].filter((d) => !estFait(d)).length;
  const toutAJour = totalAFaire === 0 && diamondsLeft === 0;

  // Date butoir la plus proche parmi les devoirs non rendus
  const prochaineDateButoir = [...devoirs, ...devoirsTermines]
    .filter(d => d.date_limite && !estFait(d))
    .map(d => new Date(d.date_limite!))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <div className={cn(
      "mx-4 mb-4 rounded-2xl overflow-hidden shadow border-2",
      toutAJour ? "border-green-500 dark:border-green-600" : "border-red-600 dark:border-red-500"
    )}>
      <button
        onClick={() => setOuvert(!ouvert)}
        className={cn(
          "w-full relative flex flex-col items-center px-12 py-3 gap-0.5",
          toutAJour ? "bg-green-50 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/40"
        )}
      >
        <p className={cn(
          "font-extrabold text-xl tracking-wide text-center w-full",
          toutAJour ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
        )}>
          📚 Cahier de texte 📚
        </p>
        <p className={cn(
          "text-sm font-semibold text-center w-full",
          toutAJour ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
        )}>
          {toutAJour
            ? '✅ Tout est à jour !'
            : [
                totalAFaire > 0 ? `${totalAFaire} devoir${totalAFaire > 1 ? 's' : ''} à faire` : '',
                diamondsLeft > 0 ? `💎 ${diamondsLeft} diamant${diamondsLeft > 1 ? 's' : ''} à faire briller` : '',
              ].filter(Boolean).join(' · ')}
        </p>
        {!toutAJour && prochaineDateButoir && (
          <p className="text-xs font-medium text-center text-red-600 dark:text-red-400 w-full mt-0.5">
            ⏰ Avant le {prochaineDateButoir.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {prochaineDateButoir.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {/* Badge + flèche positionnés à droite en absolu */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {!toutAJour && totalAFaire > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {totalAFaire}
            </span>
          )}
          {toutAJour && <span className="text-xl">✅</span>}
          <span className={cn(toutAJour ? "text-green-700" : "text-red-700")}>{ouvert ? '▲' : '▼'}</span>
        </div>
      </button>

      {ouvert && (
        <div className="p-3 bg-background">
          {program && <WeeklyPath program={program} />}
          {devoirs.length === 0 && devoirsTermines.length === 0 && !program && (
            <p className="text-muted-foreground text-sm text-center py-2">
              Aucun devoir pour le moment
            </p>
          )}

          {(devoirs.length > 0 || devoirsTermines.length > 0) && (
            <CahierPapier devoirs={[...devoirs, ...devoirsTermines]}
              pourLe={program && nextCourseDay(program.week_start).getTime() >= Date.now() - 86400000 ? nextCourseDay(program.week_start) : prochainMercredi()}
              renderDetail={(d) => <CarteDevoir devoir={d} onRendu={handleRendu} onTravaille={(id, v) => void handleTravaille(id, v)} onEtape={(id, n, v) => void handleEtape(id, n, v)} />} />
          )}
        </div>
      )}
    </div>
  );
}
