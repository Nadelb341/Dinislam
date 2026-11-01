import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * 📡 Bandeau « Hors connexion » (règle « l'appli s'ouvre toujours, même sans réseau », 2026-11-02).
 * Dit à l'élève que ce qu'il voit est la dernière version enregistrée, et depuis quand.
 */
const pad = (n: number) => String(n).padStart(2, '0');

function lastConnectionText(at: number | null): string {
  if (!at) return '';
  const d = new Date(at);
  const today = new Date().toDateString() === d.toDateString();
  const day = today ? "aujourd'hui" : `le ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return ` — dernière connexion ${day} à ${pad(d.getHours())} h ${pad(d.getMinutes())}`;
}

export default function OfflineBanner() {
  const { isOnline, lastOnlineAt } = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b-2 border-amber-400 bg-amber-100 px-3 py-2 text-center">
      <WifiOff className="h-4 w-4 shrink-0 text-amber-800" />
      <span className="min-w-0 text-xs font-medium text-amber-900 [overflow-wrap:anywhere]">
        Hors connexion{lastConnectionText(lastOnlineAt)} · tes dernières données sont affichées, les envois reprendront au retour du réseau
      </span>
    </div>
  );
}
