import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import AdminModuleProgress from '@/components/admin/AdminModuleProgress';
import AdminUsersList from '@/components/admin/AdminUsersList';
import AdminStudentDetails from '@/components/admin/AdminStudentDetails';
import AdminRamadanManager from '@/components/admin/AdminRamadanManager';
import AdminMessaging from '@/components/admin/AdminMessaging';
import AdminNouraniaContent from '@/components/admin/AdminNouraniaContent';
import AdminSourateContent from '@/components/admin/AdminSourateContent';
import AdminInvocationManager from '@/components/admin/AdminInvocationManager';
import AdminGenericModuleManager from '@/components/admin/AdminGenericModuleManager';
import AdminAllahNamesManager from '@/components/admin/AdminAllahNamesManager';
import AdminSourateValidations from '@/components/admin/AdminSourateValidations';
import AdminRegistrationValidations from '@/components/admin/AdminRegistrationValidations';
import AdminNouraniaValidations from '@/components/admin/AdminNouraniaValidations';
import AdminInvocationValidations from '@/components/admin/AdminInvocationValidations';
import AdminRamadanQuizTracking from '@/components/admin/AdminRamadanQuizTracking';
import AdminAttendance from '@/components/admin/AdminAttendance';
import AdminGlobalStats from '@/components/admin/AdminGlobalStats';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminContent from '@/components/admin/AdminContent';
import AdminRecitationReview from '@/components/admin/AdminRecitationReview';
import AdminCoranManager from '@/components/coran/AdminCoranManager';
import { Button } from '@/components/ui/button';

/**
 * Écrans de gestion (ex-« Tableau de bord »).
 * 2026-10-27 (demande de Nadia) : plus de grille de cartes ici. Chaque carte de l'accueil a, dans son menu ⋮,
 * « ⚙️ Gérer le contenu » et « 📖 Voir la progression » qui ouvrent ces mêmes écrans (/admin?section=…).
 * « ← Retour » revient d'où l'on vient (l'accueil le plus souvent). /admin sans écran → accueil.
 */
type ViewType = 'users' | 'students' | 'ramadan' | 'ramadan-manage' | 'ramadan-quiz-tracking' | 'nourania' | 'nourania-manage' | 'nourania-validations' | 'alphabet' | 'alphabet-manage' | 'invocations' | 'invocations-manage' | 'invocations-validations' | 'sourates' | 'sourates-manage' | 'sourates-validations' | 'registration-validations' | 'prayer' | 'prayer-manage' | 'messages' | 'homework' | 'attendance' | 'generic-module-manage' | 'grammaire-manage' | 'allah-names-manage' | 'vocabulaire-manage' | 'lecture-coran-manage' | 'darija-manage' | 'dictionnaire-manage' | 'dhikr-manage' | 'hadiths-manage' | 'histoires-prophetes-manage' | 'global-stats' | 'notifications' | 'recitations' | 'coran-manage';

const SLUG_VIEWS: Record<string, { slug: string; title: string }> = {
  'grammaire-manage': { slug: '/grammaire', title: 'Grammaire & Conjugaison' },
  'vocabulaire-manage': { slug: '/module/vocabulaire', title: 'Vocabulaire' },
  'lecture-coran-manage': { slug: '/module/lecture-coran', title: 'Lecture du Coran' },
  'darija-manage': { slug: '/module/darija', title: 'Darija (Marocain)' },
  'dictionnaire-manage': { slug: '/module/dictionnaire', title: 'Dictionnaire' },
  'dhikr-manage': { slug: '/module/dhikr', title: 'Dhikr' },
  'hadiths-manage': { slug: '/module/hadiths', title: 'Hadiths' },
  'histoires-prophetes-manage': { slug: '/module/histoires-prophetes', title: 'Histoires des Prophètes' },
};

const PROGRESS_VIEWS = ['ramadan', 'nourania', 'alphabet', 'invocations', 'sourates', 'prayer'] as const;

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType | null>(() => searchParams.get('section') as ViewType | null);
  const [moduleId, setModuleId] = useState<string | null>(() => searchParams.get('module'));

  // Un nouvel écran demandé alors que la page est déjà ouverte (notification, bouclier, menu ⋮ de l'accueil)
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setCurrentView(section as ViewType);
      setModuleId(searchParams.get('module'));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: learningModules, isLoading: loadingModules, refetch: refetchModules } = useQuery({
    queryKey: ['admin-learning-modules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_modules').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
  });

  if (loading) {
    return (
      <AppLayout title="Gestion">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;
  // Plus de grille de cartes : sans écran demandé, on revient à l'accueil
  if (!currentView) return <Navigate to="/" replace />;

  // Retour : là d'où l'on vient (accueil, Monitoring…), sinon l'accueil (appli ouverte directement sur cet écran)
  const handleBack = () => { if (((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0) navigate(-1); else navigate('/'); };
  const page = (children: React.ReactNode) => <AppLayout title="Gestion"><div className="p-4">{children}</div></AppLayout>;
  const withBack = (children: React.ReactNode) => page(<><Button variant="ghost" onClick={handleBack} className="mb-4">← Retour</Button>{children}</>);

  switch (currentView) {
    case 'users': return page(<AdminUsersList onBack={handleBack} />);
    case 'students': return page(<AdminStudentDetails onBack={handleBack} />);
    case 'ramadan-manage': return page(<AdminRamadanManager onBack={handleBack} />);
    case 'ramadan-quiz-tracking': return page(<AdminRamadanQuizTracking onBack={handleBack} />);
    case 'nourania-manage': return withBack(<AdminNouraniaContent />);
    case 'sourates-manage': return withBack(<AdminSourateContent />);
    // L'Alphabet se gère dans sa nouvelle carte (📎 ressources dans la fiche de chaque lettre), choix de Nadia du 2026-10-27
    case 'alphabet-manage': return <Navigate to="/alphabet" replace />;
    case 'invocations-manage': return page(<AdminInvocationManager onBack={handleBack} />);
    case 'sourates-validations': return page(<AdminSourateValidations onBack={handleBack} />);
    case 'nourania-validations': return page(<AdminNouraniaValidations onBack={handleBack} />);
    case 'invocations-validations': return page(<AdminInvocationValidations onBack={handleBack} />);
    case 'registration-validations': return page(<AdminRegistrationValidations onBack={handleBack} />);
    case 'messages': return withBack(<AdminMessaging />);
    // Le cahier de texte est dans la carte « Cahier de texte » de l'accueil depuis le 2026-10-26
    case 'homework': return <Navigate to="/?open=todo&cahier=1" replace />;
    case 'recitations': return page(<AdminRecitationReview onBack={handleBack} />);
    case 'attendance': return page(<AdminAttendance onBack={handleBack} />);
    case 'global-stats': return page(<AdminGlobalStats onBack={handleBack} />);
    case 'notifications': return withBack(<AdminNotifications />);
    case 'prayer-manage': return withBack(<AdminContent />);
    case 'allah-names-manage': return page(<AdminAllahNamesManager onBack={handleBack} />);
    case 'coran-manage': return page(<AdminCoranManager onBack={handleBack} />);
    default: break;
  }

  // Carte ajoutée à la main (module non intégré) : /admin?section=generic-module-manage&module=<id>
  if (currentView === 'generic-module-manage' && moduleId) {
    const mod = learningModules?.find((m) => m.id === moduleId);
    if (mod) return page(<AdminGenericModuleManager moduleId={mod.id} moduleTitle={mod.title} onBack={handleBack} />);
  }

  if (currentView in SLUG_VIEWS) {
    const info = SLUG_VIEWS[currentView];
    const mod = learningModules?.find((m) => m.builtin_path === info.slug);
    if (mod) return page(<AdminGenericModuleManager moduleId={mod.id} moduleTitle={info.title} onBack={handleBack} />);
  }

  if ((PROGRESS_VIEWS as readonly string[]).includes(currentView)) {
    return page(<AdminModuleProgress module={currentView as (typeof PROGRESS_VIEWS)[number]} onBack={handleBack} />);
  }

  // Module pas (encore) trouvé
  return withBack(
    loadingModules ? (
      <p className="text-sm text-muted-foreground">Chargement…</p>
    ) : (
      <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4 space-y-3">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">⚠️ Cet écran n'a pas été trouvé.</p>
        <Button size="sm" variant="outline" onClick={() => refetchModules()}>🔄 Actualiser</Button>
      </div>
    ),
  );
};

export default Admin;
