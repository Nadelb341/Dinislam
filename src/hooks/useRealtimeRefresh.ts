import { useEffect, useRef, useState } from 'react';
import { REALTIME_EVENT, type RealtimeEventDetail } from '@/lib/realtimeSync';

/**
 * 🔄 Recharge un écran (chargé avec useState/useEffect, sans react-query) quand une de ses tables
 * change dans la base, chez n'importe quel utilisateur (événement `dinislam:realtime` envoyé par
 * `RealtimeSync`). Plusieurs changements rapprochés = un seul rechargement.
 *
 * ⚠️ `reload` ne doit recharger QUE ce qui est affiché (listes), jamais un formulaire en cours de saisie.
 */
export function useRealtimeRefresh(tables: string[], reload: () => void, enabled = true): void {
  const reloadRef = useRef(reload);
  useEffect(() => { reloadRef.current = reload; });
  const key = tables.join(',');

  useEffect(() => {
    if (!enabled || !key) return;
    const wanted = new Set(key.split(','));
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onChange = (e: Event) => {
      const table = (e as CustomEvent<RealtimeEventDetail>).detail?.table;
      if (!table || !wanted.has(table)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        try { reloadRef.current(); } catch (err) { console.error('Rechargement en direct impossible :', err); }
      }, 50);
    };
    window.addEventListener(REALTIME_EVENT, onChange);
    return () => {
      window.removeEventListener(REALTIME_EVENT, onChange);
      if (timer) clearTimeout(timer);
    };
  }, [key, enabled]);
}

/** Variante pour un useEffect : renvoie un compteur qui augmente à chaque changement (à mettre dans ses dépendances). */
export function useRealtimeVersion(tables: string[], enabled = true): number {
  const [version, setVersion] = useState(0);
  useRealtimeRefresh(tables, () => setVersion((v) => v + 1), enabled);
  return version;
}
