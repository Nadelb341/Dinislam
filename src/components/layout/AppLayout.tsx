import { ReactNode, useEffect } from 'react';
import { BandeauFantome } from '@/components/fantome/BandeauFantome';
import Header from './Header';
import BottomNav from './BottomNav';
import usePresenceHeartbeat from '@/hooks/usePresenceHeartbeat';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';
import StarMascot from '@/components/mascot/StarMascot';
import VersionChangelogModal from '@/components/VersionChangelogModal';
import AdminMoonAssistant from '@/components/admin/AdminMoonAssistant';
import BandeauActivation from '@/components/push/BandeauActivation';
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
import { TapisPromeneur } from '@/components/saisons/TapisPromeneur';
import { FondEcran } from '@/components/fonds/FondEcran';
import { NumeroPremiereConnexion } from '@/components/parents/NumeroPremiereConnexion';
import { BoutonRetour } from '@/components/layout/BoutonRetour';

/** 🍂 Couleurs de la saison sur toute l'appli (fond beige, cartes crème…) ; rien en « Ambiance neutre » */
function useCouleursSaison() {
  const { saison, r } = useSaisonActive();
  const actif = saison === 'automne' && r.automne.couleurs;
  const hiver = saison === 'hiver' && r.hiver.couleurs;
  const printemps = saison === 'printemps' && r.printemps.couleurs;
  const ete = saison === 'ete' && r.ete.couleurs;
  const ramadan = saison === 'ramadan' && r.ramadan.couleurs;
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('saison-automne', actif);
    html.classList.toggle('saison-hiver', hiver);
    html.classList.toggle('saison-printemps', printemps);
    html.classList.toggle('saison-ete', ete);
    html.classList.toggle('saison-ramadan', ramadan);
  }, [actif, hiver, printemps, ete, ramadan]);
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
    <div className="app-racine min-h-screen flex flex-col bg-background">
      {/* 🖼️ Fond d'écran jour / nuit (2026-11-22), derrière tout */}
      <SilentBoundary name="Fond d'écran"><FondEcran /></SilentBoundary>
      {/* 👻 Mode fantôme : bandeau « Revenir à mon compte » toujours en haut */}
      <SilentBoundary name="Bandeau fantôme"><BandeauFantome /></SilentBoundary>
      <Header title={title} showBack={showBack} />
      {/* 🟥 Installer l'appli / activer les notifications : rappelé tant que ce n'est pas fait (2026-11-18) */}
      <SilentBoundary name="Bandeau d'activation"><BandeauActivation /></SilentBoundary>
      {/* 📡 Hors connexion : l'appli reste ouverte avec les dernières données (2026-11-02) */}
      <SilentBoundary name="Bandeau hors connexion"><OfflineBanner /></SilentBoundary>
      <EmailVerificationBanner />
      {/* 2026-11-26 (Nadia : téléphone tourné) : menu du bas de 48 px en paysage peu haut → marge réduite */}
      {/* 2026-11-26 : le menu du bas peut faire 1 à 4 lignes → marge = sa hauteur réelle (--menu-bas) + 1 rem */}
      <main className={`flex-1 ${showBottomNav ? 'pb-[calc(var(--menu-bas,4rem)+1rem)]' : ''}`}>
        <div className="p-4">
          <PendingDraftsCenter />
          <TrashPurgeWarning />
          <AttendanceMessage />
          {/* 🎂 Date de naissance et 👨‍👩‍👧 enfants élèves (2026-10-28) */}
          <SilentBoundary name="Messages du profil"><MessagesProfil /></SilentBoundary>
          {/* 📱 Numéro d'un parent (moins de 20 ans) ou le sien, demandé tant qu'il manque (2026-11-15) */}
          <SilentBoundary name="Numéro de téléphone"><NumeroPremiereConnexion /></SilentBoundary>
          <ComebackCelebration />
        </div>
        {/* ⬅️ « ← Retour » en haut à gauche de chaque page (sauf l'accueil), règle commune du 2026-11-05 */}
        <div className="px-4"><BoutonRetour /></div>
        {/* Filet par page : si une page plante, l'en-tête et le menu du bas restent utilisables */}
        <ErrorBoundary scope="page">{children}</ErrorBoundary>
      </main>
      {showBottomNav && <BottomNav />}
      {/* 🍂 2026-11-26 (Nadia) : plus aucun décor qui tombe dans les pages des cours (l'ancien « petit décor des pages » est retiré) ;
          l'objet qui se promène (tapis, feuille dorée…) ne s'affiche plus que sur l'accueil. L'écureuil, lui, est partout (App.tsx). */}
      <SilentBoundary name="Tapis volant"><TapisPromeneur /></SilentBoundary>
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
