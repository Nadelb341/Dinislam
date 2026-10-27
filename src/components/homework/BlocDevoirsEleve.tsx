import { useState, useEffect, useCallback } from "react";
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { withName } from '@/lib/encouragements';
import { BookOpen, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { WeeklyPath } from "./WeeklyPath";
import { praiseFor, type WeeklyProgram } from "@/lib/weeklyProgram";
import { matiereOf } from "@/lib/devoirMatieres";
import { DevoirValider } from "./DevoirValider";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirmValidation } from "@/hooks/useConfirmValidation";
import { useConfetti } from "@/hooks/useConfetti";
import { AudioProf } from "./AudioProf";
import { PretPourLeCours, ObjectifDuJour } from "./CahierDuJour";
import { CahierRotation, type DevoirRange } from "./CahierRotation";
import { useHolidays } from "@/hooks/useGroupCourse";
import { aRattraper, coursApres, coursPasses, donneLe, heureDeRendu, horairePour, rangement, renduEnRetard, type Decision } from "@/lib/rotationDevoirs";
import type { GroupSchedule } from "@/lib/groupCourse";

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
  /** Élément visé (« Commencer mon travail ») et audio demandé par l'enseignante */
  cible_id: string | null;
  audio_requis: boolean;
  /** 🎧 Consigne audio du professeur et correction audio (2026-10-26) */
  consigne_audio_url: string | null;
  correction_audio_url: string | null;
  /** Rotation à l'heure du cours (2026-10-27) */
  group_id: string | null;
  visible_a: string | null;
  rendu_at: string | null;
  decision?: Decision;
};

/** Un devoir est fait (pour l'élève) dès qu'il l'a envoyé : en attente de validation ou validé ; « à refaire » = à faire */
const estFait = (d: Devoir) => d.rendu && d.statut_rendu !== 'a_refaire';

function CarteDevoir({ devoir, onEtape, onSent }: { devoir: Devoir; onEtape: (id: string, step: number, value: boolean) => void; onSent: () => void }) {
  const { askValidation, validationDialog } = useConfirmValidation();
  const { user } = useAuth();
  const statut = devoir.rendu ? devoir.statut_rendu : null;

  return (
    <div className={cn(
      "rounded-2xl p-4 mb-3 shadow-sm border-2 space-y-2",
      statut === 'corrige' ? "border-green-400 bg-green-50 dark:bg-green-950/20 dark:border-green-700"
        : statut === 'a_refaire' ? "border-destructive bg-destructive/5"
        : statut === 'rendu' ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-700"
        : "border-sky-300 bg-sky-50/60 dark:bg-sky-950/20 dark:border-sky-800"
    )}>
      <div className="flex items-start gap-2">
        <span className="text-2xl">{matiereOf(devoir.type).emoji}</span>
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm [overflow-wrap:anywhere]">{devoir.titre}</p>
          {devoir.description && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{devoir.description}</p>}
          {devoir.date_limite && (
            <p className="text-xs font-semibold mt-0.5">📅 À rendre pour le {new Date(devoir.date_limite).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}{devoir.audio_requis ? ' · 🎙️ audio demandé' : ''}</p>
          )}
        </div>
      </div>

      {/* 🎧 Consigne audio du professeur */}
      <AudioProf url={devoir.consigne_audio_url} kind="consigne" />

      {/* 💎 Devoir en étapes : une case par étape, le diamant se remplit petit à petit (2026-10-26) */}
      {devoir.etapes.length > 0 && statut !== 'corrige' && (
        <div className="rounded-xl border-2 border-dashed border-sky-400 bg-white dark:bg-slate-900 p-2.5 space-y-1.5">
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
      )}

      {devoir.lien_lecon && statut !== 'corrige' && (
        <a href={devoir.lien_lecon} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground">
          <BookOpen className="w-4 h-4" /> Voir la leçon <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {/* ▶️ Commencer mon travail · ✅ Je valide mon devoir (audio si demandé) · états envoyé / validé / à refaire */}
      <DevoirValider onSent={onSent}
        devoir={{ id: devoir.id, titre: devoir.titre, type: devoir.type, cible_id: devoir.cible_id, audio_requis: devoir.audio_requis, statut, commentaire: devoir.commentaire_admin, correction_audio_url: devoir.correction_audio_url }} />

      {/* ⭐ Petit mot automatique quand le devoir est validé */}
      {statut === 'corrige' && user && (
        <p className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-1.5 text-sm font-semibold">{withName(user, praiseFor(devoir.id, user.id))}</p>
      )}
      {validationDialog}
    </div>
  );
}

export default function BlocDevoirsEleve() {
  const { user } = useAuth();
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [devoirsTermines, setDevoirsTermines] = useState<Devoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [contexte, setContexte] = useState<{ gIds: string[]; horaires: GroupSchedule[]; arrivee: string | null }>({ gIds: [], horaires: [], arrivee: null });
  const { data: holidays = [] } = useHolidays();
  // L'heure avance toute seule : à l'heure du cours, les devoirs changent d'onglet sans recharger
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
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
      .select('devoir_id, statut, commentaire_admin, correction_audio_url, rendu_at')
      .eq('student_id', user.id);
    // Cases « J'ai travaillé ce devoir »
    const { data: checks } = await supabase.from('devoir_checks').select('devoir_id').eq('student_id', user.id);
    const travailles = new Set((checks || []).map((c) => c.devoir_id));
    const { data: steps } = await supabase.from('devoir_steps').select('devoir_id, step').eq('student_id', user.id);
    // 🔄 Rotation : heures de cours de ses groupes, choix du professeur (à rattraper / historique), date d'arrivée
    const [{ data: horaires }, { data: decisions }, { data: profil }] = await Promise.all([
      gIds.length ? supabase.from('group_schedules').select('group_id, weekday, start_time').in('group_id', gIds) : Promise.resolve({ data: [] as GroupSchedule[] }),
      supabase.from('devoir_decisions').select('devoir_id, decision').eq('student_id', user.id),
      supabase.from('profiles').select('created_at').eq('user_id', user.id).maybeSingle(),
    ]);
    setContexte({ gIds, horaires: (horaires || []) as GroupSchedule[], arrivee: profil?.created_at ?? null });

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
        cible_id: d.cible_id ?? null,
        audio_requis: !!d.audio_requis,
        consigne_audio_url: d.consigne_audio_url ?? null,
        correction_audio_url: rendu?.correction_audio_url ?? null,
        etapes: Array.isArray(d.etapes) ? (d.etapes as unknown[]).map(String) : [],
        etapesFaites: (steps || []).filter((x) => x.devoir_id === d.id).map((x) => x.step),
        group_id: d.group_id ?? null,
        visible_a: d.visible_a ?? null,
        rendu_at: rendu?.rendu_at ?? null,
        decision: decisions?.find((x) => x.devoir_id === d.id)?.decision as Decision | undefined,
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
  useRealtimeRefresh(['devoirs', 'devoirs_rendus', 'student_group_members', 'devoir_checks', 'devoir_steps', 'devoir_decisions', 'group_schedules'], () => { void chargerDevoirs(); }, !!user);

  // 💎 Étape d'un devoir : le diamant se remplit ; ensuite l'élève touche « Je valide mon devoir »
  const handleEtape = async (devoirId: string, step: number, value: boolean) => {
    if (!user) return;
    const devoir = [...devoirs, ...devoirsTermines].find((d) => d.id === devoirId);
    if (!devoir) return;
    const { error } = value
      ? await supabase.from('devoir_steps').upsert({ devoir_id: devoirId, student_id: user.id, step }, { onConflict: 'devoir_id,student_id,step' })
      : await supabase.from('devoir_steps').delete().eq('devoir_id', devoirId).eq('student_id', user.id).eq('step', step);
    if (error) { toast.error('Erreur : ' + error.message); return; }
    const faites = value ? [...new Set([...devoir.etapesFaites, step])].length : devoir.etapesFaites.length - 1;
    if (value) {
      fireSuccess();
      toast.success(faites >= devoir.etapes.length
        ? withName(user, '💎 Toutes les étapes sont cochées, bravo {prenom} ! Touche « Je valide mon devoir » ✅')
        : withName(user, `💎 Étape cochée, bravo {prenom} ! (${faites}/${devoir.etapes.length})`));
    }
    queryClient.invalidateQueries({ queryKey: ['weekly-program', user.id] });
    void chargerDevoirs();
  };

  if (loading || (devoirs.length === 0 && devoirsTermines.length === 0 && !program)) return null;

  // 🔄 Rotation à l'heure du cours de son groupe (mercredi 14 h si aucune heure n'est réglée)
  const tous = [...devoirs, ...devoirsTermines];
  const ranges: (Devoir & DevoirRange)[] = tous.map((d) => {
    const horaire = horairePour(d.group_id, contexte.gIds, contexte.horaires, holidays);
    const ligneR = { id: d.id, created_at: d.cree_le, visible_a: d.visible_a, date_limite: d.date_limite };
    const heureRendu = heureDeRendu(ligneR, horaire, holidays);
    const rang = rangement(ligneR, horaire, holidays, now);
    return { ...d, rang, heureRendu, rattraper: aRattraper(ligneR, estFait(d), rang, d.decision, contexte.arrivee), retard: renduEnRetard(d.rendu_at, heureRendu) };
  });
  const horairePrincipal = horairePour(null, contexte.gIds, contexte.horaires, holidays);
  const prochainCours = coursApres(horairePrincipal, holidays, now);
  const premier = tous.length ? new Date(Math.min(...tous.map((d) => donneLe({ id: d.id, created_at: d.cree_le, visible_a: d.visible_a }).getTime()))) : now;
  // Bande de semaines : tous les cours passés sauf le dernier (celui de « Semaine passée »)
  const coursHisto = coursPasses(horairePrincipal, holidays, premier, now).slice(0, -1);

  // Devoirs pas encore faits (cochés ou audio envoyé), comme les diamants
  // Seulement ce qui compte encore : la semaine en cours + « À rattraper » (l'historique « pas fait » n'est plus compté)
  const enCours = ranges.filter((d) => !estFait(d) && (d.rang === 'semaine' || d.rattraper));
  const totalAFaire = enCours.length;
  const toutAJour = totalAFaire === 0 && diamondsLeft === 0;

  // Date butoir la plus proche parmi les devoirs non rendus
  const prochaineDateButoir = enCours
    .filter(d => d.date_limite && d.rang === 'semaine')
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
          {/* 🎒 Prêt pour le cours (veille 18 h → début du cours + 1 h) et 🎯 objectif du jour */}
          <PretPourLeCours />
          <ObjectifDuJour devoirs={[...devoirs, ...devoirsTermines]} />
          {program && <WeeklyPath program={program} />}
          {devoirs.length === 0 && devoirsTermines.length === 0 && !program && (
            <p className="text-muted-foreground text-sm text-center py-2">
              Aucun devoir pour le moment
            </p>
          )}

          {(devoirs.length > 0 || devoirsTermines.length > 0) && (
            <CahierRotation devoirs={ranges} prochainCours={prochainCours} coursHistorique={coursHisto} pageKey={`dinislam_cahier_page_${user?.id}`}
              renderDetail={(r) => { const d = tous.find((x) => x.id === r.id); return d ? <CarteDevoir devoir={d} onEtape={(id, n, v) => void handleEtape(id, n, v)} onSent={() => void chargerDevoirs()} /> : null; }} />
          )}
        </div>
      )}
    </div>
  );
}
