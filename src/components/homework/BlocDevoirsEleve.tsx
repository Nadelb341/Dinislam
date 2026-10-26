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
import { praiseFor, courseDeadline, type WeeklyProgram } from "@/lib/weeklyProgram";
import { matiereOf } from "@/lib/devoirMatieres";
import { DevoirValider } from "./DevoirValider";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirmValidation } from "@/hooks/useConfirmValidation";
import { useConfetti } from "@/hooks/useConfetti";
import { AudioProf } from "./AudioProf";
import { PretPourLeCours, ObjectifDuJour } from "./CahierDuJour";

/** Mercredi prochain (jour du cours), aujourd'hui compris */
const prochainMercredi = () => { const d = new Date(); d.setHours(12, 0, 0, 0); while (d.getDay() !== 3) d.setDate(d.getDate() + 1); return d; };

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
};

/** Un devoir est fait (pour l'élève) dès qu'il l'a envoyé : en attente de validation ou validé ; « à refaire » = à faire */
const estFait = (d: Devoir) => d.rendu && d.statut_rendu !== 'a_refaire';
const jourLong = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * 📓 Le cahier de l'élève (proposition A choisie par Nadia, 2026-10-26) : papier ligné, « Pour mercredi … : »,
 * une ligne par devoir reliée à son diamant ; toucher une ligne l'ouvre (« Commencer mon travail », étapes, « Je valide mon devoir »).
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
      : d.statut_rendu === 'corrige' ? { t: '✅ validé', c: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200' }
      : d.statut_rendu === 'rendu' ? { t: '🟠 en attente', c: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200' }
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
      {/* À faire, rangé par date à rendre choisie par le professeur (pas de cours pendant les vacances) */}
      {aFaire.length ? (() => {
        const groupes = new Map<string, Devoir[]>();
        aFaire.forEach((d) => { const k = d.date_limite ? d.date_limite.slice(0, 10) : ''; groupes.set(k, [...(groupes.get(k) || []), d]); });
        return [...groupes.entries()].sort(([x], [y]) => (x || '9999').localeCompare(y || '9999')).map(([k, liste]) => (
          <div key={k || 'sans'} className="space-y-2">
            <p className="cahier-main text-lg leading-8">{k ? `Pour ${jourLong(new Date(k + 'T12:00:00'))} :` : `Pour ${jourLong(pourLe)} :`}</p>
            {liste.map(ligne)}
          </div>
        ));
      })() : <p className="cahier-main text-lg leading-8 text-green-700 dark:text-green-400">Rien à faire, bravo ! ✓</p>}
      {aFaire.length > 0 && (
        <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">📌 Chaque devoir compte : fais-les tous pour faire briller tes diamants et ouvrir le trésor 🎁</p>
      )}
      {faitsRecents.length > 0 && (
        <>
          <p className="cahier-main text-lg leading-8 text-muted-foreground">Déjà envoyé cette semaine ✓</p>
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
      .select('devoir_id, statut, commentaire_admin, correction_audio_url')
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
        cible_id: d.cible_id ?? null,
        audio_requis: !!d.audio_requis,
        consigne_audio_url: d.consigne_audio_url ?? null,
        correction_audio_url: rendu?.correction_audio_url ?? null,
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
  useRealtimeRefresh(['devoirs', 'devoirs_rendus', 'student_group_members', 'devoir_checks', 'devoir_steps'], () => { void chargerDevoirs(); }, !!user);

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
            <CahierPapier devoirs={[...devoirs, ...devoirsTermines]}
              pourLe={program ? courseDeadline(program) : prochainMercredi()}
              renderDetail={(d) => <CarteDevoir devoir={d} onEtape={(id, n, v) => void handleEtape(id, n, v)} onSent={() => void chargerDevoirs()} />} />
          )}
        </div>
      )}
    </div>
  );
}
