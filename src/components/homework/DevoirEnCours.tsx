import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { matiereOf } from '@/lib/devoirMatieres';
import { DevoirValider } from './DevoirValider';
import { AudioProf } from './AudioProf';

/**
 * 📚 Bandeau « devoir en cours » (2026-10-26) : quand l'élève arrive dans une carte par « Commencer mon travail »
 * (`?devoir=<id>`), la consigne et le bouton « ✅ Je valide mon devoir » restent en bas de l'écran pendant qu'il travaille.
 * Monté une seule fois dans App.tsx ; protégé : une erreur ici n'empêche jamais l'appli de s'ouvrir.
 */
class SilentBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: Error) { console.error('Devoir en cours :', e); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Panel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const devoirId = params.get('devoir');
  const [reduit, setReduit] = useState(false);

  const { data } = useQuery({
    queryKey: ['devoir-en-cours', devoirId, user?.id],
    enabled: !!devoirId && !!user,
    queryFn: async () => {
      const [{ data: d }, { data: r }] = await Promise.all([
        supabase.from('devoirs').select('id, titre, type, description, cible_id, audio_requis, date_limite, consigne_audio_url').eq('id', devoirId!).maybeSingle(),
        supabase.from('devoirs_rendus').select('statut, commentaire_admin, correction_audio_url').eq('devoir_id', devoirId!).eq('student_id', user!.id).maybeSingle(),
      ]);
      return d ? { d, r } : null;
    },
  });
  if (!devoirId || !data) return null;
  const { d, r } = data;
  const m = matiereOf(d.type);
  const fermer = () => { const n = new URLSearchParams(params); n.delete('devoir'); setParams(n, { replace: true }); };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto rounded-2xl border-2 border-sky-400 bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 bg-sky-600 text-white px-3 py-2">
          <span className="text-lg">{m.emoji}</span>
          <p className="flex-1 min-w-0 text-sm font-extrabold [overflow-wrap:anywhere]">📚 Mon devoir : {d.titre}</p>
          <button type="button" onClick={() => setReduit((v) => !v)} className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold" aria-label={reduit ? 'Agrandir' : 'Réduire'}>{reduit ? '▲' : '▼'}</button>
          <button type="button" onClick={fermer} className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold" aria-label="Fermer le bandeau">✕</button>
        </div>
        {!reduit && (
          <div className="p-3 space-y-2">
            {d.description && <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{d.description}</p>}
            {d.date_limite && <p className="text-xs font-semibold">📅 À rendre pour le {new Date(d.date_limite).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
            <AudioProf url={d.consigne_audio_url} kind="consigne" />
            <DevoirValider dansLaCarte devoir={{ id: d.id, titre: d.titre, type: d.type, cible_id: d.cible_id, audio_requis: d.audio_requis, statut: r?.statut ?? null, commentaire: r?.commentaire_admin, correction_audio_url: r?.correction_audio_url }} />
            <button type="button" onClick={() => navigate('/?open=devoirs')} className="w-full text-center text-xs font-bold text-sky-700 dark:text-sky-300">📚 Retour à mon cahier de texte</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DevoirEnCours() {
  return <SilentBoundary><Panel /></SilentBoundary>;
}
