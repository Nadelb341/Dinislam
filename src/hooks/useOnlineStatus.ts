// 📡 Copie de l'Agenda (2026-11-02) : vraie connexion vérifiée + dernière connexion réussie, pour le bandeau « Hors connexion ».
import { useEffect, useRef, useState } from "react";

const LAST_ONLINE_KEY = "dinislam_last_online_at";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const PROBE_TIMEOUT_MS = 5000;
const PROBE_INTERVAL_MS = 15000;

function readLastOnline(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ONLINE_KEY);
    return raw ? Number(raw) : null;
  } catch { return null; }
}

// `navigator.onLine` ne reflète que l'état de l'interface réseau (wifi/ethernet active),
// jamais si internet est RÉELLEMENT accessible — un wifi relié à un routeur/box en panne
// reste "onLine" pour le navigateur alors qu'aucune requête n'aboutit. Incident réel du
// 2026-09-24 (Nadia) : le bandeau rouge hors ligne ne s'est jamais affiché malgré une vraie
// absence de connexion, car `navigator.onLine` valait toujours `true`. Seule une vraie requête
// bornée dans le temps (AbortController, jamais laissée en attente indéfiniment) permet de
// savoir si l'appli peut vraiment fonctionner. Requête vers l'auth Supabase (`/auth/v1/health`,
// domaine différent de l'appli et hors du champ du service worker — ne passe donc jamais par
// le cache hors ligne, qui fausserait le résultat).
async function probeConnectivity(): Promise<boolean> {
  if (!SUPABASE_URL) return navigator.onLine;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/health`, { method: "GET", signal: controller.signal, cache: "no-store" });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Toujours la dernière connexion RÉELLEMENT vérifiée (un wifi sans Internet dit « en ligne »).
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(() => readLastOnline());
  const probingRef = useRef(false);

  useEffect(() => {
    const markOnline = () => {
      const now = Date.now();
      try { localStorage.setItem(LAST_ONLINE_KEY, String(now)); } catch { /* stockage bloqué */ }
      setLastOnlineAt(now);
      setIsOnline(true);
    };
    const markOffline = () => setIsOnline(false);

    const runProbe = async () => {
      if (probingRef.current) return;
      probingRef.current = true;
      const ok = await probeConnectivity();
      probingRef.current = false;
      if (ok) markOnline();
      else markOffline();
    };

    // L'événement "offline" du navigateur (interface coupée) reste fiable tel quel — pas
    // besoin de sonder, c'est sûrement hors ligne. L'événement "online", en revanche, ne
    // garantit rien de plus qu'une interface réseau active — toujours vérifié par une vraie
    // requête avant d'enlever le bandeau.
    const goOnline = () => { runProbe(); };
    const goOffline = () => markOffline();

    if (navigator.onLine) runProbe(); else markOffline();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Sonde active répétée tant que l'appli est ouverte — seul moyen de détecter une perte ou
    // un retour de connectivité réelle quand `navigator.onLine` lui-même ne change pas.
    const interval = setInterval(runProbe, PROBE_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, lastOnlineAt };
}
