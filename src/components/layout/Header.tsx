import { useState, useEffect, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { DraftDot } from '@/components/shared/DraftDot';
import { BoutonEntete } from '@/components/layout/BoutonEntete';
import { OPEN_ADMIN_EVENT, GROUP_MESSAGE_EVENT, type OpenAdminDetail, type GroupMessageDetail } from '@/lib/adminBridge';
import { Home, Mail, CalendarCheck, Shield, BarChart3, Trophy, RotateCw } from 'lucide-react';
import UserSettingsDialog from '@/components/settings/UserSettingsDialog';
import AccountSwitcher from '@/components/auth/AccountSwitcher';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MessagingDialog from '@/components/messaging/MessagingDialog';
import NewMessageNotification from '@/components/messaging/NewMessageNotification';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts';
import { useMonitoringErrorCount } from '@/hooks/useMonitoringErrorCount';
import { usePendingDrafts } from '@/hooks/useDrafts';
import { SilentBoundary } from '@/components/shared/SilentBoundary';
// ⚡ 2026-11-07 (audit DETTE) : le bouclier et la messagerie admin (avec leurs graphiques) ne sont téléchargés
// QUE par l'enseignante. Avant, chaque élève les recevait dans le fichier principal (≈ 2 Mo).
const AdminCommandModal = lazy(() => import('@/components/admin/AdminCommandModal'));
const AdminMessagingDialog = lazy(() => import('@/components/messaging/AdminMessagingDialog'));

const ZOOM_URL = 'https://us06web.zoom.us/j/4080361371?pwd=UHVDc1o0RDE3WFBmNTBNTENaMDJnUT09';

// Caméra Zoom en trait doré (même dessin que la page de choix du 18/11), comme les autres icônes de l'en-tête
const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="7" width="13" height="10" rx="2.5" />
    <path d="m15.5 10.5 6-3.5v10l-6-3.5z" />
  </svg>
);

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

const Header = ({
  title = 'Dinislam',
  showBack = false
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInitial, setAdminInitial] = useState<OpenAdminDetail | null>(null);
  const [groupMessagePrefill, setGroupMessagePrefill] = useState<GroupMessageDetail | null>(null);

  // Ouvertures demandées depuis ailleurs (carte « À FAIRE » de l'accueil…)
  useEffect(() => {
    const onOpenAdmin = (e: Event) => {
      setAdminInitial((e as CustomEvent<OpenAdminDetail>).detail);
      setShowAdminModal(true);
    };
    const onGroupMessage = (e: Event) => {
      setGroupMessagePrefill((e as CustomEvent<GroupMessageDetail>).detail);
      setShowMessaging(true);
    };
    window.addEventListener(OPEN_ADMIN_EVENT, onOpenAdmin);
    window.addEventListener(GROUP_MESSAGE_EVENT, onGroupMessage);
    return () => {
      window.removeEventListener(OPEN_ADMIN_EVENT, onOpenAdmin);
      window.removeEventListener(GROUP_MESSAGE_EVENT, onGroupMessage);
    };
  }, []);
  const { unreadCount, hasNewMessage, clearNewMessageFlag } = useUnreadMessages();
  const pendingCounts = useAdminPendingCounts();
  const monitoringErrors = useMonitoringErrorCount();
  // Chiffre rouge du bouclier = choses à valider + brouillons pas terminés (2026-10-19)
  const drafts = usePendingDrafts(user?.id, isAdmin);
  const shieldTotal = pendingCounts.total + drafts.length;

  // Auto-open messaging from URL param ?open=messages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'messages') {
      clearNewMessageFlag();
      setShowMessaging(true);
      // Adresse nettoyée par le routeur (sinon un 2e lien identique n'ouvrirait plus rien, 2026-10-30)
      navigate(location.pathname, { replace: true });
    }
    // Notification touchée (enseignante) : ouvrir directement le bon écran du bouclier, ex. ?admin=sourates-validations
    const adminSection = params.get('admin');
    if (adminSection && isAdmin) {
      setAdminInitial({ section: adminSection });
      setShowAdminModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, clearNewMessageFlag, isAdmin, navigate]);

  const handleOpenMessaging = () => {
    clearNewMessageFlag();
    setShowMessaging(true);
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary via-primary to-royal-dark shadow-royal safe-top">
        {/* 2026-11-04 : 9 icônes de 40 px ne tenaient pas sur un iPhone (la maison sortait de l'écran) → 36 px et sans marge sur téléphone */}
        <div className="flex items-center justify-between h-14 px-1 sm:px-4">
          <div className="hidden sm:block w-10" />
          <div className="flex-1" />

          {/* 🎛️ 2026-11-18 : icônes en « boutons de jeu » (BoutonEntete) ; 10 icônes de 36 px tiennent sur un iPhone de 375 px */}
          <div className="flex items-center gap-0 sm:gap-1">
            <UserSettingsDialog />
            <AccountSwitcher />
            <BoutonEntete icone={<Mail />} onClick={handleOpenMessaging} aria-label="Messages" title="Messages"
              compteur={unreadCount} couleurCompteur="orange" className={hasNewMessage ? '[&>.pastille-entete]:animate-pulse' : undefined}>
              {/* Message commencé mais pas envoyé */}
              <DraftDot
                tiny
                draftKey={isAdmin ? ['dinislam_admin_new_msg', 'dinislam_admin_group_msg', 'dinislam_admin_reply_'] : user ? `messaging_student_${user.id}` : null}
                className="absolute -bottom-0.5 -right-0.5 z-[3] text-[10px]"
              />
            </BoutonEntete>
            <BoutonEntete icone={<ZoomIcon />} onClick={() => window.open(ZOOM_URL, '_blank', 'noopener,noreferrer')} aria-label="Rejoindre le cours Zoom" title="Rejoindre le cours Zoom" />
            <BoutonEntete icone={<Trophy />} onClick={() => navigate('/classement')} aria-label="Classement" title="Classement" />
            <BoutonEntete icone={<CalendarCheck />} onClick={() => navigate('/attendance')} aria-label="Ma présence" title="Ma présence" />
            {/* Admin: monitoring icon */}
            {isAdmin && (
              <BoutonEntete icone={<BarChart3 />} onClick={() => navigate('/monitoring')} aria-label="Suivi" title="Suivi"
                compteur={monitoringErrors} className="[&>.pastille-entete]:animate-pulse" />
            )}
            {/* Admin: bouclier avec compteur (rouge) ou ✓ vert quand tout est fait */}
            {isAdmin && (
              <BoutonEntete icone={<Shield />} onClick={() => setShowAdminModal(true)} aria-label="Bouclier" title="Bouclier"
                compteur={shieldTotal} ok={shieldTotal === 0} className={shieldTotal > 0 ? '[&>.pastille-entete]:animate-pulse' : undefined} />
            )}
            {/* 🔄 Actualiser la page en cours (Nadia, 2026-11-18). Sans réseau : on ne recharge pas. L'icône fait un tour avant le rechargement */}
            <BoutonEntete icone={<RotateCw />} tourne aria-label="Actualiser la page" title="Actualiser"
              onClick={() => {
                if (navigator.onLine) { window.setTimeout(() => window.location.reload(), 450); return; }
                toast('📡 Pas de connexion Internet : tu vois les dernières données gardées sur l\'appareil.');
              }} />
            {!isHome && (
              <BoutonEntete icone={<Home />} onClick={() => navigate('/')} aria-label="Accueil" title="Accueil" />
            )}
          </div>
        </div>
      </header>

      {isAdmin ? (
        <SilentBoundary><Suspense fallback={null}>
          <AdminMessagingDialog open={showMessaging} onOpenChange={(o) => { setShowMessaging(o); if (!o) setGroupMessagePrefill(null); }} onMessagesRead={clearNewMessageFlag} prefillGroupMessage={groupMessagePrefill} />
        </Suspense></SilentBoundary>
      ) : (
        <MessagingDialog open={showMessaging} onOpenChange={setShowMessaging} onMessagesRead={clearNewMessageFlag} />
      )}

      {isAdmin && (
        <SilentBoundary><Suspense fallback={null}>
        <AdminCommandModal
          open={showAdminModal}
          onOpenChange={(o) => { setShowAdminModal(o); if (!o) setAdminInitial(null); }}
          initialSection={adminInitial?.section}
          initialSearch={adminInitial?.search}
          pendingRegistrations={pendingCounts.registrations}
          pendingSourates={pendingCounts.sourates}
          pendingNourania={pendingCounts.nourania}
          pendingNouraniaLignes={pendingCounts.nouraniaLignes}
          pendingInvocations={pendingCounts.invocations}
          pendingHomework={pendingCounts.homework}
          pendingRecitations={pendingCounts.recitations}
          pendingAllahNames={pendingCounts.allahNames}
          pendingAlphabet={pendingCounts.alphabet}
          pendingLoginTrouble={pendingCounts.loginTrouble + pendingCounts.parentLinks}
          total={pendingCounts.total}
        />
        </Suspense></SilentBoundary>
      )}

      <NewMessageNotification onOpenMessages={handleOpenMessaging} />
    </>
  );
};

export default Header;
