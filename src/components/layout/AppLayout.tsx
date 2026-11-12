import { ReactNode, useEffect } from 'react';
import { BandeauFantome } from '@/components/fantome/BandeauFantome';
import { estEnModeFantome } from '@/lib/modeFantome';
import Header from './Header';
import BottomNav from './BottomNav';
import usePresenceHeartbeat from '@/hooks/usePresenceHeartbeat';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';
import StarMascot from '@/components/mascot/StarMascot';
import VersionChangelogModal from '@/components/VersionChangelogModal';
import AdminMoonAssistant from '@/components/admin/AdminMoonAssistant';
import PushAutoSubscribe from '@/components/push/PushAutoSubscribe';
import PendingDraftsCenter from '@/components/PendingDraftsCenter';
import TrashPurgeWarning from '@/components/TrashPurgeWarning';
import AttendanceMessage from '@/components/attendance/AttendanceMessage';
import MessagesProfil from '@/components/parents/MessagesProfil';
import { SilentBoundary } from '@/components/shared/SilentBoundary';
import ComebackCelebration from '@/components/attendance/ComebackCelebration';
import { useWindowScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import OfflineBanner from '@/components/shared/OfflineBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSaisonActive } from '@/lib/saisons';
import { DecorPages } from '@/components/saisons/DecorPages';

/** 🍂 Couleurs de la saison sur toute l'appli (fond beige, cartes crème…) ; rien en « Ambiance neutre » */
function useCouleursSaison() {
  const { saison, r } = useSaisonActive();
  const actif = saison === 'automne' && r.automne.couleurs;
  const hiver = saison === 'hiver' && r.hiver.couleurs;
  const printemps = saison === 'printemps' && r.printemps.couleurs;
  const ete = saison === 'ete' && r.ete.couleurs;
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('saison-automne', actif);
    html.classList.toggle('saison-hiver', hiver);
    html.classList.toggle('saison-printemps', printemps);
    html.classList.toggle('saison-ete', ete);
  }, [actif, hiver, printemps, ete]);
  // 📱 Les animations restent vivantes même si le téléphone a « Réduire les animations » (réglable dans la carte admin)
  useEffect(() => { document.documentElement.classList.toggle('anime-toujours', r.animerToujours); }, [r.animerToujours]);
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBottomNav?: boolean;
  showBack?: boolean;
}

const AppLayout = ({
  children,
  title,
  showBottomNav = true,
  showBack = false
}: AppLayoutProps) => {
  usePresenceHeartbeat();
  useCouleursSaison();
  const { showTop, showBottom, scrollToTop, scrollToBottom } = useWindowScrollToTop();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 👻 Mode fantôme : bandeau « Revenir à mon compte » toujours en haut */}
      <SilentBoundary name="Bandeau fantôme"><BandeauFantome /></SilentBoundary>
      <Header title={title} showBack={showBack} />
      {/* 📡 Hors connexion : l'appli reste ouverte avec les dernières données (2026-11-02) */}
      <SilentBoundary name="Bandeau hors connexion"><OfflineBanner /></SilentBoundary>
      <EmailVerificationBanner />
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''}`}>
        <div className="p-4">
          {/* Pas d'abonnement aux notifications en mode fantôme : ce téléphone reste celui de l'enseignante */}
          {!estEnModeFantome() && <PushAutoSubscribe />}
          <PendingDraftsCenter />
          <TrashPurgeWarning />
          <AttendanceMessage />
          {/* 🎂 Date de naissance et 👨‍👩‍👧 enfants élèves (2026-10-28) */}
          <SilentBoundary name="Messages du profil"><MessagesProfil /></SilentBoundary>
          <ComebackCelebration />
        </div>
        {/* Filet par page : si une page plante, l'en-tête et le menu du bas restent utilisables */}
        <ErrorBoundary scope="page">{children}</ErrorBoundary>
      </main>
      {showBottomNav && <BottomNav />}
      <SilentBoundary name="Petit décor des pages"><DecorPages /></SilentBoundary>
      <VersionChangelogModal />
      <StarMascot />
      <AdminMoonAssistant />
      <ScrollButtons
        showTop={showTop}
        showBottom={showBottom}
        onScrollTop={scrollToTop}
        onScrollBottom={scrollToBottom}
        position="fixed"
      />
    </div>
  );
};

export default AppLayout;
