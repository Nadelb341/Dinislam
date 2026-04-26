import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import usePresenceHeartbeat from '@/hooks/usePresenceHeartbeat';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';
import StarMascot from '@/components/mascot/StarMascot';
import VersionChangelogModal from '@/components/VersionChangelogModal';
import AdminMoonAssistant from '@/components/admin/AdminMoonAssistant';
import PushAutoSubscribe from '@/components/push/PushAutoSubscribe';
import { useWindowScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';

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
      <EmailVerificationBanner />
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''}`}>
        <div className="p-4">
          <PushAutoSubscribe />
        </div>
        {children}
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
