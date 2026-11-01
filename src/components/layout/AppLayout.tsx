import { ReactNode } from 'react';
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
  const { showTop, showBottom, scrollToTop, scrollToBottom } = useWindowScrollToTop();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title={title} showBack={showBack} />
      {/* 📡 Hors connexion : l'appli reste ouverte avec les dernières données (2026-11-02) */}
      <SilentBoundary name="Bandeau hors connexion"><OfflineBanner /></SilentBoundary>
      <EmailVerificationBanner />
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''}`}>
        <div className="p-4">
          <PushAutoSubscribe />
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
