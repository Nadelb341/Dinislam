import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

/**
 * ⬅️ « ← Retour » en haut à gauche de CHAQUE page sauf l'accueil (règle commune de Nadia du 2026-11-05, appliquée à Dinislam le
 * 2026-11-18). Page précédente si on vient de l'appli (react-router garde l'index dans history.state.idx), sinon l'accueil :
 * jamais un bouton qui ne fait rien ou qui sort de l'appli (appli installée = pas de flèche du navigateur).
 * Le bouclier (/admin) a déjà son propre « Retour » (sous-écrans) : pas de doublon.
 */
export function BoutonRetour() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname === '/' || pathname.startsWith('/admin')) return null;
  const retour = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1); else navigate('/');
  };
  return (
    <button type="button" onClick={retour}
      className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-primary/20 bg-card px-3 py-1.5 text-sm font-bold text-primary shadow-sm hover:bg-muted">
      <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
    </button>
  );
}
