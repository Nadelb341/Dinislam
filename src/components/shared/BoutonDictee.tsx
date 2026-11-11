import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * 🎤 Dictée vocale (Nadia, 2026-11-11, idée 7 « gagner du temps ») : on parle, le texte s'écrit dans le champ.
 * Gratuit (reconnaissance vocale du téléphone / du navigateur). ⚠️ Sur beaucoup d'appareils elle a besoin d'Internet :
 * sans réseau, le bouton le dit (« 📡 Nécessite Internet ») au lieu d'échouer en silence. Caché si l'appareil ne sait pas faire.
 */
type Reco = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
const RecoClasse = (): (new () => Reco) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Reco; webkitSpeechRecognition?: new () => Reco };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export function BoutonDictee({ onTexte, className, langue = 'fr-FR' }: { onTexte: (texte: string) => void; className?: string; langue?: string }) {
  const [ecoute, setEcoute] = useState(false);
  const reco = useRef<Reco | null>(null);
  const cb = useRef(onTexte);
  cb.current = onTexte;
  useEffect(() => () => reco.current?.stop(), []);
  const Classe = RecoClasse();
  if (!Classe) return null;

  const basculer = () => {
    if (ecoute) { reco.current?.stop(); return; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { toast.info('📡 La dictée vocale nécessite Internet sur cet appareil'); return; }
    try {
      const r = new Classe();
      r.lang = langue; r.interimResults = false; r.continuous = true;
      r.onresult = (e) => {
        const morceaux: string[] = [];
        for (let i = 0; i < e.results.length; i++) if (e.results[i].isFinal) morceaux.push(e.results[i][0].transcript);
        const t = morceaux.join(' ').trim();
        if (t) cb.current(t);
      };
      r.onerror = (e) => {
        setEcoute(false);
        if (e.error === 'network') toast.info('📡 La dictée vocale nécessite Internet sur cet appareil');
        else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast.error('🎤 Autorise le micro pour dicter (réglages du navigateur)');
      };
      r.onend = () => setEcoute(false);
      reco.current = r;
      r.start();
      setEcoute(true);
    } catch { toast.error('🎤 Dictée impossible sur cet appareil'); }
  };

  return (
    <button type="button" onClick={basculer} aria-pressed={ecoute} aria-label={ecoute ? 'Arrêter la dictée' : 'Dicter (écrire en parlant)'} title={ecoute ? 'Arrêter la dictée' : 'Dicter'}
      className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base', ecoute ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-card hover:bg-muted', className)}>
      🎤
    </button>
  );
}

