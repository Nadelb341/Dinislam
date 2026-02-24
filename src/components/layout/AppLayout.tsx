import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import usePresenceHeartbeat from '@/hooks/usePresenceHeartbeat';

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
  // Track user presence (heartbeat every 60s)
  usePresenceHeartbeat();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title={title} showBack={showBack} />
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
