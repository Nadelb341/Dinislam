import { useState, useEffect, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { DraftDot } from '@/components/shared/DraftDot';
import { OPEN_ADMIN_EVENT, GROUP_MESSAGE_EVENT, type OpenAdminDetail, type GroupMessageDetail } from '@/lib/adminBridge';
import { Check, Mic, MicOff } from 'lucide-react';
import { ZOOM_RACINE_ID, ZOOM_URL, basculerMicro, rejoindreCours, useZoomCours } from '@/lib/zoomCours';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BoutonEntete, PASTILLE } from '@/components/layout/IconeEntete';
import UserSettingsDialog from '@/components/settings/UserSettingsDialog';
import AccountSwitcher from '@/components/auth/AccountSwitcher';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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


const ZoomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect width="20" height="20" rx="4" fill="#2D8CFF"/>
    <rect x="2.5" y="5.5" width="9.5" height="9" rx="1.5" fill="white"/>
    <path d="M13.5 8.2l3.8-2.2v7.8l-3.8-2.2V8.2z" fill="white"/>
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
  const zoom = useZoomCours();
  const rejoindre = async () => {
    const racine = document.getElementById(ZOOM_RACINE_ID);
    if (!racine) return;
    let nom = '';
    try { nom = (await supabase.from('profiles').select('full_name').eq('user_id', user?.id ?? '').maybeSingle()).data?.full_name || ''; } catch { /* hors ligne */ }
    await rejoindreCours(racine, nom);
  };
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
        {/* 2026-11-19 (Nadia) : icônes centrées dans la barre */}
        {/* 2026-11-26 (Nadia : téléphone tourné) : en paysage peu haut, barre plus fine (44 px) et icônes de 36 px */}
        <div className="flex items-center justify-center h-14 px-1 sm:px-4 paysage:h-11">

          <div className="flex items-center gap-0 sm:gap-1 [&>button]:h-9 [&>button]:w-9 sm:[&>button]:h-10 sm:[&>button]:w-10 paysage:[&>button]:h-9 paysage:[&>button]:w-9">
            <UserSettingsDialog />
            <AccountSwitcher />
            <BoutonEntete nom="messages" onClick={handleOpenMessaging} aria-label="Messages" title="Messages">
              {unreadCount > 0 && (
                <Badge className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500 border-2 border-primary ${PASTILLE} ${hasNewMessage ? 'animate-pulse' : ''}`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              {/* Message commencé mais pas envoyé */}
              <DraftDot
                tiny
                draftKey={isAdmin ? ['dinislam_admin_new_msg', 'dinislam_admin_group_msg', 'dinislam_admin_reply_'] : user ? `messaging_student_${user.id}` : null}
                className="absolute -bottom-0.5 -right-0.5 text-[10px]"
              />
            </BoutonEntete>
            {/* 🎥 27/11 (Nadia, choix A + D) : l'élève rejoint le cours DANS Dinislam ; l'enseignante garde son appli Zoom (organisatrice) */}
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 p-1" title="Cours Zoom"><ZoomIcon /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(ZOOM_URL, '_blank', 'noopener,noreferrer')}>🎥 Ouvrir mon appli Zoom (organisatrice)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void rejoindre()}>🧪 Essayer le cours dans Dinislam (comme un élève)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => void rejoindre()} className="hover:bg-primary-foreground/10 p-1" title="Rejoindre le cours Zoom">
                <ZoomIcon />
              </Button>
            )}
            {/* 🎤 Le micro, à côté du logo Zoom, dès que la salle est ouverte : vert = ouvert, rouge = coupé */}
            {zoom.etat === 'en-cours' && (
              <button type="button" onClick={() => void basculerMicro().then((m) => { if (m) toast(m); })}
                aria-label={zoom.micro === 'ouvert' ? 'Micro ouvert : touche pour le couper' : 'Micro coupé : touche pour l\'ouvrir'}
                title={zoom.micro === 'ouvert' ? 'Micro ouvert' : 'Micro coupé'}
                className={`grid h-8 w-8 place-items-center rounded-full text-white shadow ring-2 ring-white/70 transition-transform active:scale-90 ${zoom.micro === 'ouvert' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {zoom.micro === 'ouvert' ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
            )}
            <BoutonEntete nom="classement" onClick={() => navigate('/classement')} aria-label="Classement" title="Classement" />
            <BoutonEntete nom="presence" onClick={() => navigate('/attendance')} aria-label="Présence" title="Présence" />
            {/* Admin: monitoring icon */}
            {isAdmin && (
              <BoutonEntete nom="suivi" onClick={() => navigate('/monitoring')} aria-label="Suivi" title="Suivi">
                {monitoringErrors > 0 && (
                  <Badge className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 border-2 border-primary animate-pulse ${PASTILLE}`}>
                    {monitoringErrors > 9 ? '9+' : monitoringErrors}
                  </Badge>
                )}
              </BoutonEntete>
            )}
            {/* Admin: shield icon with dynamic badge, navigates directly to /admin */}
            {isAdmin && (
              <BoutonEntete nom="bouclier" onClick={() => setShowAdminModal(true)} aria-label="Bouclier" title="Bouclier">
                {shieldTotal > 0 ? (
                  <Badge className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 border-2 border-primary animate-pulse ${PASTILLE}`}>
                    {shieldTotal > 9 ? '9+' : shieldTotal}
                  </Badge>
                ) : (
                  <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-primary flex items-center justify-center ${PASTILLE}`}>
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </BoutonEntete>
            )}
            {/* 🔄 Actualiser la page en cours (Nadia, 2026-11-18). Sans réseau : on ne recharge pas (l'appli resterait utilisable, mais rien de neuf à chercher) */}
            {/* La flèche fait un tour (idée 3, 2026-11-19), puis la page se recharge */}
            <BoutonEntete nom="actualiser" title="Actualiser" aria-label="Actualiser la page"
              onClick={() => {
                if (navigator.onLine) { window.setTimeout(() => window.location.reload(), 450); return; }
                toast('📡 Pas de connexion Internet : tu vois les dernières données gardées sur l\'appareil.');
              }} />
            {!isHome && (
              <BoutonEntete nom="accueil" onClick={() => navigate('/')} aria-label="Accueil" title="Accueil" />
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
