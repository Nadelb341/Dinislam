import { useEffect, useState } from 'react';
import { EVT_DEVOIRS_ATTENTE, distributionsEnAttente, envoyerDevoirsEnAttente } from '@/lib/devoirsEleve';

/** 📡 Devoirs donnés hors ligne (idée 9, 2026-11-11) : leur nombre, et envoi automatique au retour du réseau / à l'ouverture */
export function useDevoirsEnAttente(enabled = true) {
  const [n, setN] = useState(() => distributionsEnAttente().length);
  useEffect(() => {
    if (!enabled) return;
    const maj = () => setN(distributionsEnAttente().length);
    const tenter = () => { envoyerDevoirsEnAttente().then(maj, maj); };
    tenter();
    window.addEventListener('online', tenter);
    window.addEventListener(EVT_DEVOIRS_ATTENTE, maj);
    const t = setInterval(() => { if (distributionsEnAttente().length) tenter(); }, 30000);
    return () => { window.removeEventListener('online', tenter); window.removeEventListener(EVT_DEVOIRS_ATTENTE, maj); clearInterval(t); };
  }, [enabled]);
  return n;
}
