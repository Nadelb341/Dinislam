import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useSwNavigate } from "@/hooks/useSwNavigate";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

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
  } catch {}
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
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";

const Sourates = lazy(() => import("./pages/Sourates"));
const Invocations = lazy(() => import("./pages/Invocations"));
const Nourania = lazy(() => import("./pages/Nourania"));
const Priere = lazy(() => import("./pages/Priere"));
const Ramadan = lazy(() => import("./pages/Ramadan"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Ressources = lazy(() => import("./pages/Ressources"));
const Classement = lazy(() => import("./pages/Classement"));
const Attendance = lazy(() => import("./pages/Attendance"));
const AlphabetPage = lazy(() => import("./pages/AlphabetPage"));
const AllahNamesPage = lazy(() => import("./pages/AllahNamesPage"));
const GenericModulePage = lazy(() => import("./pages/GenericModulePage"));
const GrammaireConjugaisonPage = lazy(() => import("./pages/GrammaireConjugaisonPage"));
const GenericTimelinePage = lazy(() => import("./pages/GenericTimelinePage"));
const Monitoring = lazy(() => import("./pages/Monitoring"));

const queryClient = new QueryClient();


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isApproved, isAdmin } = useAuth();

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
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/sourates" element={<ProtectedRoute><Sourates /></ProtectedRoute>} />
        <Route path="/ramadan" element={<ProtectedRoute><Ramadan /></ProtectedRoute>} />
        <Route path="/alphabet" element={<ProtectedRoute><AlphabetPage /></ProtectedRoute>} />
        <Route path="/invocations" element={<ProtectedRoute><Invocations /></ProtectedRoute>} />
        <Route path="/nourania" element={<ProtectedRoute><Nourania /></ProtectedRoute>} />
        <Route path="/priere" element={<ProtectedRoute><Priere /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/ressources" element={<ProtectedRoute><Ressources /></ProtectedRoute>} />
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
        <Route path="/module/dhikr" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/hadiths" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/histoires-prophetes" element={<ProtectedRoute><GenericTimelinePage /></ProtectedRoute>} />
        <Route path="/module/:moduleId" element={<ProtectedRoute><GenericModulePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
