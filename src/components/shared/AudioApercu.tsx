import { useEffect, useState } from 'react';

/**
 * 🎧 Réécoute d'un enregistrement avant envoi (2026-10-27, bug « Erreur » signalé par Nadia).
 * Selon l'appareil, l'aperçu se lit en data URL (iPhone) ou en lien blob (Safari Mac, Chrome…) :
 * on essaie l'un puis l'autre. Si aucun ne marche, l'élève est rassuré : l'audio est bien enregistré et peut partir.
 */
export function AudioApercu({ blob, dataUrl, className = '' }: { blob: Blob | null; dataUrl: string | null; className?: string }) {
  const [essai, setEssai] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setEssai(0);
    if (!blob) { setBlobUrl(null); return; }
    const u = URL.createObjectURL(blob);
    setBlobUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  const sources = [dataUrl, blobUrl].filter((s): s is string => !!s);
  if (!blob) return null;
  if (essai >= sources.length) {
    return sources.length === 0 ? null : (
      <p className={`rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 ${className}`}>
        ✅ Ton audio est bien enregistré ({Math.max(1, Math.round(blob.size / 1024))} Ko). La réécoute ne marche pas sur cet appareil, mais tu peux l'envoyer.
      </p>
    );
  }
  return <audio key={sources[essai]} src={sources[essai]} controls preload="metadata" onError={() => setEssai((e) => e + 1)} className={className} />;
}
