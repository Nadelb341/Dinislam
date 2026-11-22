import { useState, useEffect, useRef } from 'react';
import { AdminAlphabetValidations } from '@/components/admin/AdminAlphabetValidations';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { LoginTroubleBanner } from '@/components/admin/LoginTroubleBanner';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { CorrectionsGrille, RienACorriger, totalCorrections, useTuilesCorrections } from '@/components/admin/CorrectionsGrille';
import AdminInvocationValidations from '@/components/admin/AdminInvocationValidations';
import AdminRegistrationValidations from '@/components/admin/AdminRegistrationValidations';
import AdminSourateValidations from '@/components/admin/AdminSourateValidations';
import AdminNouraniaValidations from '@/components/admin/AdminNouraniaValidations';
import AdminGlobalStats from '@/components/admin/AdminGlobalStats';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminStudentDetails from '@/components/admin/AdminStudentDetails';
import AdminAttendance from '@/components/admin/AdminAttendance';
import AdminRecitationReview from '@/components/admin/AdminRecitationReview';
import AdminMyDrafts from '@/components/admin/AdminMyDrafts';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingDrafts } from '@/hooks/useDrafts';
import { useMonitoringErrorCount } from '@/hooks/useMonitoringErrorCount';
import { requestDraftResume, type PendingDraft } from '@/lib/pendingDrafts';
import { useHolidays } from '@/hooks/useGroupCourse';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { periodeBilan } from '@/lib/bilanTrimestriel';
import { ChoixFantomeDialog } from '@/components/fantome/ChoixFantomeDialog';
import { depuisJour } from '@/lib/depuisJour';

interface AdminCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRegistrations: number;
  pendingSourates: number;
  pendingNourania: number;
  pendingInvocations: number;
  /** ☑️ Lignes Nourania cochées à valider (2026-11-15) */
  pendingNouraniaLignes?: number;
  pendingHomework: number;
  pendingRecitations: number;
  pendingAllahNames?: number;
  /** Exercices et demandes de validation d'Alphabet en attente */
  pendingAlphabet?: number;
  total: number;
  /** Élèves qui n'arrivent pas à se connecter + liens parent à confirmer (pastille sur « Élèves », 2026-11-18) */
  pendingLoginTrouble?: number;
  /** Écran à ouvrir directement (ex. depuis la carte « À FAIRE ») */
  initialSection?: string;
  /** Recherche pré-remplie dans la liste des élèves */
  initialSearch?: string;
}

/* ✅ 2026-11-15 (Nadia) : les lignes « Devoirs à corriger, Alphabet à valider, Sourates à corriger, Nourania à valider,
 * 99 noms à valider » sont rangées dans la carte « ✅ Corrections » (une tuile par carte de l'accueil, en grille) ;
 * la ligne « ✉️ Messages non lus » est retirée (l'enveloppe ✉️ de l'en-tête suffit). */
const BOUTON_CORRECTIONS = { id: 'corrections', label: 'Corrections', section: 'corrections', emoji: '✅' };

const BOUTONS_MODULES = [
  { id: 'eleves', label: 'Élèves', section: 'eleves', emoji: '👨‍🎓' },
  { id: 'registre', label: 'Registre', section: 'registre-presence', emoji: '📋' },
  // « Cahier de texte » retiré le 2026-10-27 (demande de Nadia) : il est dans la carte « Cahier de texte » de l'accueil
  { id: 'inscriptions', label: 'Inscriptions', section: 'users', emoji: '📝' },
];

/** « Mes brouillons » (idée B, 2026-10-16) : bouton à part, orange quand un brouillon attend */
const BOUTON_BROUILLONS = { id: 'brouillons', label: 'Mes brouillons', section: 'brouillons', emoji: '🗒️' };

const AdminCommandModal = ({
  open,
  onOpenChange,
  pendingRegistrations,
  pendingSourates,
  pendingNourania,
  pendingInvocations,
  pendingNouraniaLignes = 0,
  pendingHomework,
  pendingRecitations,
  pendingAllahNames = 0,
  pendingAlphabet = 0,
  pendingLoginTrouble = 0,
  initialSection,
  initialSearch,
}: AdminCommandModalProps) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const drafts = usePendingDrafts(user?.id, isAdmin);
  // Erreurs et plantages « chat qui pleure » pas encore réglés (rouge + pastille)
  const monitoringErrors = useMonitoringErrorCount();
  const [modalSection, setModalSection] = useState<string | null>(null);
  // Écran ouvert depuis une tuile de « Corrections » : « Retour » / ✕ y ramène
  const [depuisCorrections, setDepuisCorrections] = useState(false);
  const [fantomeOuvert, setFantomeOuvert] = useState(false);
  // Panneau principal : il défile quand il dépasse l'écran (bandeau ouvert…), le titre et la croix restent visibles
  const {
    scrollRef: panelScrollRef, handleScroll: handlePanelScroll, showTop: panelShowTop, showBottom: panelShowBottom,
    scrollToTop: panelScrollTop, scrollToBottom: panelScrollBottom,
  } = useScrollToTop();
  useEffect(() => { if (open && initialSection) setModalSection(initialSection); }, [open, initialSection]);
  // Flèche ⬇️ dès l'ouverture et quand le contenu change de hauteur (bandeau ouvert/fermé)
  useEffect(() => {
    if (!open) return;
    const el = panelScrollRef.current;
    if (!el) return;
    handlePanelScroll();
    const ro = new ResizeObserver(() => handlePanelScroll());
    Array.from(el.children).forEach((c) => ro.observe(c));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, panelScrollRef, handlePanelScroll]);

  const comptesCorrections = {
    homework: pendingHomework, alphabet: pendingAlphabet, nourania: pendingNourania, nouraniaLignes: pendingNouraniaLignes,
    recitations: pendingRecitations, sourates: pendingSourates, invocations: pendingInvocations, allahNames: pendingAllahNames,
  };
  const tuiles = useTuilesCorrections(comptesCorrections);
  const compteurs: Record<string, number> = {
    corrections: totalCorrections(comptesCorrections),
    inscriptions: pendingRegistrations,
    eleves: pendingLoginTrouble,
    // Brouillons pas terminés : comptés dans le chiffre rouge du bouclier (demande de Nadia, 2026-10-19)
    brouillons: drafts.length,
  };

  const onClose = () => onOpenChange(false);

  if (!open) return null;

  const totalBadge = Object.values(compteurs).reduce((a, b) => a + b, 0);

  const allBoutons = [BOUTON_CORRECTIONS, ...BOUTONS_MODULES, BOUTON_BROUILLONS,
    ...tuiles.map((t) => ({ id: t.id, label: t.label, section: t.section, emoji: t.emoji })),
    { id: 'invocations', label: 'Invocations', section: 'invocations-validations', emoji: '🤲' }];
  const fermerSection = () => {
    if (depuisCorrections && modalSection !== 'corrections') { setModalSection('corrections'); setDepuisCorrections(false); return; }
    setDepuisCorrections(false);
    setModalSection(null);
  };

  // « Continuer » un brouillon : on ferme le bouclier et on ouvre la fiche, déjà remplie
  const continueDraft = (d: PendingDraft) => {
    setModalSection(null);
    onClose();
    requestDraftResume(d.key);
    navigate(d.def.routeOf ? d.def.routeOf(d.key) : d.def.route);
  };

  return (
    <>
      <ChoixFantomeDialog open={fantomeOuvert} onClose={() => setFantomeOuvert(false)} />
      {/* Popup principale — centrée */}
      <div
        className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-background rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (toujours visible : le contenu défile en dessous) */}
          <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <h2 className="text-lg font-bold text-foreground">Administration</h2>
              {totalBadge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalBadge}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-destructive text-destructive-foreground w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={panelScrollRef} onScroll={handlePanelScroll} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-5 space-y-3">
            <LoginTroubleBanner onOpenStudents={() => setModalSection('eleves')} />
            {/* ✅ Corrections (2026-11-15) : toutes les cartes à corriger, en grille, dans une seule carte */}
            {(() => { const n = compteurs.corrections; return (
              <button type="button" onClick={() => setModalSection('corrections')}
                className={`relative w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 ${n > 0 ? 'bg-destructive' : 'bg-emerald-500'}`}>
                <span className="text-2xl">✅</span>
                <span>Corrections</span>
                {n > 0 && <span className="bg-white text-destructive text-xs font-bold min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center">{n}</span>}
              </button>
            ); })()}

            {/* Séparateur */}
            <div className="border-t border-border pt-1" />

            {/* Boutons modules — 3 par ligne (Élèves, Registre, Inscriptions) */}
            <div className="grid grid-cols-3 gap-2">
              {BOUTONS_MODULES.map((btn) => {
                const count = compteurs[btn.id] || 0;
                const hasAction = count > 0;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setModalSection(btn.section)}
                    className={`relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 ${hasAction ? 'bg-destructive' : 'bg-emerald-500'}`}
                  >
                    {hasAction && (
                      <span className="absolute top-1.5 right-1.5 bg-white text-destructive text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {count}
                      </span>
                    )}
                    <span className="text-xl">{btn.emoji}</span>
                    <span className="text-xs">{btn.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setModalSection(BOUTON_BROUILLONS.section)}
                className={`col-span-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${drafts.length > 0 ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white'}`}
              >
                <span>{BOUTON_BROUILLONS.emoji} {BOUTON_BROUILLONS.label}</span>
                {drafts.length > 0 && (
                  <span className="bg-white text-amber-900 text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                    {drafts.length}
                  </span>
                )}
              </button>
              {/* 📊 Bilan trimestriel (2026-10-28, demande de Nadia : juste sous « Brouillons ») */}
              <BoutonBilanTrimestriel onOpen={() => { onClose(); navigate('/admin?section=bilan-trimestriel'); }} />
              {/* 🗂️ Qui voit quoi (2026-11-11) : quelles cartes sont ouvertes à quels groupes et élèves */}
              <button onClick={() => { onClose(); navigate('/admin?section=cartes-acces'); }}
                className="col-span-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
                <span>🗂️ Qui voit quelles cartes</span>
              </button>
              {/* 🔧 Apparence appli (2026-10-29) : le titre de l'accueil et ses effets */}
              <button onClick={() => { onClose(); navigate('/admin?section=apparence'); }}
                className="col-span-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                <span>🔧 Apparence appli</span>
              </button>
              {/* ⚙️ Réglages des devoirs (22/11) : chemin de la semaine 💎, relance du jeudi, groupes, diamants de la classe */}
              <button onClick={() => { onClose(); navigate('/admin?section=reglages-devoirs'); }}
                className="col-span-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100">
                <span>⚙️ Réglages des devoirs (diamants 💎)</span>
              </button>
              {/* 👻 Mode fantôme (2026-11-05) : entrer dans le compte d'un élève et agir comme lui */}
              <button onClick={() => setFantomeOuvert(true)}
                className="col-span-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/50 dark:text-fuchsia-100">
                <span>👻 Mode fantôme</span>
              </button>
            </div>

            {/* Séparateur */}
            <div className="border-t border-border pt-1" />

            {/* « Voir le tableau de bord complet » retiré le 2026-10-27 : chaque carte de l'accueil se gère par son menu ⋮ */}

            {/* Boutons navigation en grille */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setModalSection('monitoring')}
                className={`relative py-2 rounded-xl border text-xs font-semibold ${monitoringErrors > 0 ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground'}`}
              >
                📊 Monitoring
                {monitoringErrors > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                    {monitoringErrors > 9 ? '9+' : monitoringErrors}
                  </span>
                )}
              </button>
              <button
                onClick={() => setModalSection('stats')}
                className="py-2 rounded-xl border border-border text-muted-foreground text-xs font-semibold"
              >
                📈 Stats
              </button>
              <button
                onClick={() => setModalSection('notifications')}
                className="py-2 rounded-xl border border-border text-muted-foreground text-xs font-semibold"
              >
                🔔 Notifs
              </button>
            </div>
          </div>
          <ScrollButtons showTop={panelShowTop} showBottom={panelShowBottom} onScrollTop={panelScrollTop} onScrollBottom={panelScrollBottom} position="absolute" />
        </div>
      </div>

      {/* Modale section à 80% */}
      {modalSection && (
        <div
          className="fixed inset-0 bg-black/60 z-[500] flex items-end justify-center"
          onClick={fermerSection}
        >
          <div
            className="bg-background rounded-t-3xl w-full max-w-lg"
            style={{ height: '80vh', overflowY: 'auto', overflowX: 'visible' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between rounded-t-3xl z-10">
              <h3 className="font-bold text-lg text-foreground">
                {allBoutons.find((b) => b.section === modalSection)?.emoji}{' '}
                {allBoutons.find((b) => b.section === modalSection)?.label || modalSection}
              </h3>
              <button
                onClick={fermerSection}
                className="bg-[#EF4444] text-white shadow-md hover:bg-[#DC2626] rounded-full w-8 h-8 flex items-center justify-center"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" strokeWidth={2.75} />
              </button>
            </div>
            <div className="p-4" style={{ overflowY: 'auto', overflowX: 'visible', minHeight: '100%' }}>
              {modalSection === 'corrections' ? (
                <CorrectionsGrille tuiles={tuiles} onOuvrir={(t) => { setDepuisCorrections(true); setModalSection(t.section); }} />
              ) : modalSection.startsWith('rien:') ? (
                <RienACorriger tuile={tuiles.find((t) => t.section === modalSection)}
                  onOuvrirCarte={(() => { const c = tuiles.find((t) => t.section === modalSection)?.chemin; return c ? () => { setModalSection(null); setDepuisCorrections(false); onClose(); navigate(c); } : undefined; })()} />
              ) : (
              <AdminSectionRenderer
                section={modalSection}
                initialSearch={initialSearch}
                onClose={fermerSection}
                onContinueDraft={continueDraft}
                onNavigate={(path) => {
                  setModalSection(null);
                  onClose();
                  navigate(path);
                }}
              />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function AdminSectionRenderer({
  section,
  initialSearch,
  onClose,
  onNavigate,
  onContinueDraft,
}: {
  section: string;
  initialSearch?: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onContinueDraft: (d: PendingDraft) => void;
}) {
  switch (section) {
    case 'brouillons':
      return <AdminMyDrafts onContinue={onContinueDraft} />;
    case 'users':
      return <AdminRegistrationValidations onBack={onClose} />;
    case 'sourates-validations':
      return <AdminSourateValidations onBack={onClose} />;
    case 'nourania-validations':
      return <AdminNouraniaValidations onBack={onClose} />;
    case 'invocations-validations':
      return <AdminInvocationValidations onBack={onClose} />;
    case 'alphabet-validations':
      return <AdminAlphabetValidations onBack={onClose} />;
    case 'cahier-texte':
    case 'cahier-texte-module':
      // Le cahier de texte est maintenant dans la carte « Cahier de texte » de l'accueil (2026-10-26) : simple raccourci
      return <CahierRedirect onGo={() => onNavigate('/?open=todo&cahier=1')} />;
    case 'recitations-audio':
      return <AdminRecitationReview onBack={onClose} kind="sourates" />;
    case 'allah-names-audio':
      return <AdminRecitationReview onBack={onClose} kind="names" />;
    case 'monitoring':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Accédez au monitoring complet</p>
          <button
            onClick={() => onNavigate('/monitoring')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
          >
            Ouvrir le Monitoring →
          </button>
        </div>
      );
    case 'stats':
      return <AdminGlobalStats onBack={onClose} />;
    case 'notifications':
      return <AdminNotifications />;
    case 'eleves':
      return <AdminStudentDetails onBack={onClose} initialSearch={initialSearch} />;
    case 'registre-presence':
      return <AdminAttendance onBack={onClose} />;
    default:
      return (
        <p className="text-muted-foreground text-center py-8">
          Section en cours de développement
        </p>
      );
  }
}

export default AdminCommandModal;

/** Raccourci du bouclier : ouvre la carte « Cahier de texte » de l'accueil (le cahier y a été déplacé le 2026-10-26) */
function CahierRedirect({ onGo }: { onGo: () => void }) {
  const done = useRef(false);
  useEffect(() => { if (done.current) return; done.current = true; onGo(); }, [onGo]);
  return <p className="py-8 text-center text-sm text-muted-foreground">📓 Ouverture du cahier de texte…</p>;
}

/** Bouton « 📊 Bilan trimestriel » : rappelle les vacances qui approchent (7 jours avant),
 *  ✅ quand des parents viennent de lire un bilan (idée 6) et ⏰ les bilans pas lus depuis 3 jours (idée 3) */
function BoutonBilanTrimestriel({ onOpen }: { onOpen: () => void }) {
  const { data: holidays = [] } = useHolidays();
  const { prochaines } = periodeBilan(holidays);
  const jours = prochaines ? Math.ceil((new Date(`${prochaines.start_date}T00:00:00`).getTime() - Date.now()) / 86400000) : null;
  const bientot = jours !== null && jours >= 0 && jours <= 7;
  const { data: suivi } = useQuery({
    queryKey: ['bilan-trimestriel', 'bouclier'],
    queryFn: async () => {
      let vu = '1970-01-01';
      try { vu = localStorage.getItem('dinislam_bilans_lus_vus') || vu; } catch { /* stockage indisponible */ }
      const il3j = depuisJour(3);
      const [{ count: nouveauxLus }, { data: envoyes }, { data: lus }] = await Promise.all([
        supabase.from('bilan_reads').select('report_id', { count: 'exact', head: true }).gt('read_at', vu),
        supabase.from('student_reports').select('id').not('sent_at', 'is', null).not('snapshot', 'is', null).lt('sent_at', il3j),
        supabase.from('bilan_reads').select('report_id'),
      ]);
      const luIds = new Set((lus || []).map((r) => r.report_id));
      return { nouveauxLus: nouveauxLus ?? 0, pasLus: (envoyes || []).filter((r) => !luIds.has(r.id)).length };
    },
  });
  return (
    <button onClick={onOpen}
      className={`col-span-3 flex flex-wrap items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${bientot ? 'bg-violet-600 text-white ring-4 ring-violet-200 dark:ring-violet-900' : 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100'}`}>
      <span>📊 Bilan trimestriel</span>
      {bientot && <span className="bg-white text-violet-800 text-xs font-bold px-2 h-5 rounded-full flex items-center">vacances dans {jours} j</span>}
      {!!suivi?.nouveauxLus && <span className="bg-emerald-500 text-white text-xs font-bold px-2 h-5 rounded-full flex items-center" title="Bilans lus par les parents depuis ta dernière visite">✅ {suivi.nouveauxLus} lu{suivi.nouveauxLus > 1 ? 's' : ''}</span>}
      {!!suivi?.pasLus && <span className="bg-orange-500 text-white text-xs font-bold px-2 h-5 rounded-full flex items-center" title="Envoyés il y a plus de 3 jours, pas encore lus">⏰ {suivi.pasLus} pas lu{suivi.pasLus > 1 ? 's' : ''}</span>}
    </button>
  );
}
