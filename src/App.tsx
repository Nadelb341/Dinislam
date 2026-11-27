import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useSwNavigate } from "@/hooks/useSwNavigate";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect } from 'react';
import { useEcranTourne } from '@/lib/ecranTourne';
import ErrorBoundary from '@/components/ErrorBoundary';
import RealtimeSync from '@/components/RealtimeSync';
import DevoirEnCours from '@/components/homework/DevoirEnCours';
import { SilentBoundary } from '@/components/shared/SilentBoundary';
// 🐿️ L'écureuil qui se cache dans toute l'appli (2026-11-26) : chargé à part, monté UNE fois au-dessus des pages
const EcureuilPartout = lazy(() => import('@/components/saisons/Ecureuil'));
const ZoomCours = lazy(() => import('@/components/zoom/ZoomCours'));

// Vérification automatique de version — force le rechargement si nouvelle version disponible
const checkAppVersion = async () => {
  try {
    const res = await fetch('/version.json?t=' + Date.now());
    const { version } = await res.json();
    const lastVersion = localStorage.getItem('dinislam_app_version');
    if (lastVersion && lastVersion !== version) {
      localStorage.setItem('dinislam_app_version', version);
      window.location.reload();
    } else {
      localStorage.setItem('dinislam_app_version', version);
    }
  } catch { /* fichier de version indisponible : on réessaiera à la prochaine ouverture */ }
};
checkAppVersion();

// Vérifie aussi quand l'app revient au premier plan (iOS PWA resume depuis mémoire)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkAppVersion();
});

// Écoute le service worker qui signale une nouvelle version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'FORCE_RELOAD') {
      window.location.reload();
    }
  });
}

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";
import ApprovalCheckFailed from "./pages/ApprovalCheckFailed";
const BilanPublic = lazy(() => import('./pages/BilanPublic'));

const Sourates = lazy(() => import("./pages/Sourates"));
const Invocations = lazy(() => import("./pages/Invocations"));
const Nourania = lazy(() => import("./pages/Nourania"));
const Priere = lazy(() => import("./pages/Priere"));
const Ramadan = lazy(() => import("./pages/Ramadan"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Classement = lazy(() => import("./pages/Classement"));
const Attendance = lazy(() => import("./pages/Attendance"));
const AlphabetPage = lazy(() => import("./pages/AlphabetPage"));
const PetitsPage = lazy(() => import("./pages/PetitsPage"));
const AllahNamesPage = lazy(() => import("./pages/AllahNamesPage"));
const GenericModulePage = lazy(() => import("./pages/GenericModulePage"));
const GrammaireConjugaisonPage = lazy(() => import("./pages/GrammaireConjugaisonPage"));
const GenericTimelinePage = lazy(() => import("./pages/GenericTimelinePage"));
const HistoiresProphetesPage = lazy(() => import("./pages/HistoiresProphetesPage"));
// 📿 Nouvelle carte Dhikr (2026-11-27) : page à part (chapelet, séries, bibliothèque, carnet, défi, quiz)
const DhikrPage = lazy(() => import("./pages/DhikrPage"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const CoranPage = lazy(() => import("./pages/CoranPage"));

const queryClient = new QueryClient();


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isApproved, isAdmin, approvalCheckFailed } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin && isApproved === false) {
    return <PendingApproval />;
  }

  // Vérification impossible (réseau, navigateur…) : jamais « Inscription en attente » à tort
  if (!isAdmin && approvalCheckFailed && isApproved !== true) {
    return <ApprovalCheckFailed />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  useSwNavigate();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-gold" />
      </div>
    }>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/bilan/:token" element={<BilanPublic />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/sourates" element={<ProtectedRoute><Sourates /></ProtectedRoute>} />
        <Route path="/ramadan" element={<ProtectedRoute><Ramadan /></ProtectedRoute>} />
        <Route path="/alphabet" element={<ProtectedRoute><AlphabetPage /></ProtectedRoute>} />
        {/* 🧸 Rubriques de l'accueil du Groupe 0 (2026-11-22) */}
        <Route path="/petits/:rubrique" element={<ProtectedRoute><PetitsPage /></ProtectedRoute>} />
        <Route path="/invocations" element={<ProtectedRoute><Invocations /></ProtectedRoute>} />
        <Route path="/nourania" element={<ProtectedRoute><Nourania /></ProtectedRoute>} />
        <Route path="/priere" element={<ProtectedRoute><Priere /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
        <Route path="/classement" element={<ProtectedRoute><Classement /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/module/allah-names" element={<ProtectedRoute><AllahNamesPage /></ProtectedRoute>} />
        <Route path="/allah-names" element={<ProtectedRoute><AllahNamesPage /></ProtectedRoute>} />
        <Route path="/grammaire" element={<ProtectedRoute><GrammaireConjugaisonPage /></ProtectedRoute>} />
        <Route path="/module/vocabulaire" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/lecture-coran" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/darija" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/dictionnaire" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/dhikr" element={<ProtectedRoute><DhikrPage /></ProtectedRoute>} />
        <Route path="/module/hadiths" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/histoires-prophetes" element={<ProtectedRoute><HistoiresProphetesPage /></ProtectedRoute>} />
        <Route path="/coran" element={<ProtectedRoute><CoranPage /></ProtectedRoute>} />
        <Route path="/module/:moduleId" element={<ProtectedRoute><GenericModulePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

// 📱↔️ Réglage « téléphone tourné » de cet appareil (Paramètres, 2026-11-21)
const EcranTourne = () => { useEcranTourne(); return null; };

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* React Router 7 (2026-11-27) : useTransitions={false} = même comportement qu'en v6 (changement de page immédiat,
            roue de chargement pendant qu'une page se charge), sans l'attente « transition » ajoutée par défaut en v7. */}
        <BrowserRouter useTransitions={false}>
          <AuthProvider>
            <RealtimeSync />
            <EcranTourne />
            <DevoirEnCours />
            <AppRoutes />
            <SilentBoundary name="Écureuil"><Suspense fallback={null}><EcureuilPartout /></Suspense></SilentBoundary>
            {/* 🎥 Le cours Zoom dans l'appli (27/11) : une seule fenêtre, gardée quand on change de page */}
            <SilentBoundary name="Cours Zoom"><Suspense fallback={null}><ZoomCours /></Suspense></SilentBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
