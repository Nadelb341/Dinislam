import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CADRE_ORIGINE, deplacer, estOrigine, lireCadre, styleCadre, type Cadre, type Cadrages } from '@/lib/cadrage';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { cn } from '@/lib/utils';

/**
 * 📐 Cadrer une photo dans ses VRAIS cadres (règle commune du 2026-11-04 ; Dinislam 2026-11-18) : on glisse la photo au doigt
 * ou à la souris, on zoome, un onglet par emplacement (la même photo peut être cadrée autrement ailleurs). Jamais destructif :
 * seul le réglage est enregistré (colonne `image_cadrage`) ; « Revenir au cadrage d'origine ». Sans réseau : gardé sur
 * l'appareil puis envoyé au retour d'Internet (ecrireOuGarder).
 */
export type EmplacementCadre = { cle: string; nom: string; classeCadre: string; classeImage?: string };

export function Cadreur({ open, onClose, src, table, id, valeur, emplacements, onEnregistre }: {
  open: boolean; onClose: () => void; src: string; table: string; id: string | number; valeur: unknown;
  emplacements: EmplacementCadre[]; onEnregistre?: () => void;
}) {
  const [onglet, setOnglet] = useState(emplacements[0]?.cle ?? '');
  const [cadres, setCadres] = useState<Cadrages>(() => Object.fromEntries(emplacements.map((e) => [e.cle, lireCadre(valeur, e.cle)])));
  const [busy, setBusy] = useState(false);
  const cadreRef = useRef<HTMLDivElement>(null);
  const glisse = useRef<{ x: number; y: number } | null>(null);
  const c: Cadre = cadres[onglet] ?? CADRE_ORIGINE;
  const emp = emplacements.find((e) => e.cle === onglet) ?? emplacements[0];
  const maj = (n: Cadre) => setCadres((x) => ({ ...x, [onglet]: n }));

  const enregistrer = async () => {
    setBusy(true);
    try {
      const r = await ecrireOuGarder({ table, op: 'update', id: String(id), values: { image_cadrage: cadres } });
      toast.success(r === 'ok' ? '📐 Cadrage enregistré' : '📐 Cadrage gardé sur l\'appareil : envoyé au retour d\'Internet');
      onEnregistre?.();
      onClose();
    } catch { toast.error('Le cadrage n\'a pas été enregistré'); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent level="nested" className="max-w-md">
        <DialogHeader>
          <DialogTitle>📐 Cadrer la photo</DialogTitle>
          <DialogDescription>Glisse la photo avec le doigt pour choisir ce qu'on voit, et zoome. La photo d'origine n'est pas modifiée.</DialogDescription>
        </DialogHeader>
        {emplacements.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {emplacements.map((e) => (
              <button key={e.cle} type="button" aria-pressed={onglet === e.cle} onClick={() => setOnglet(e.cle)}
                className={cn('rounded-full border px-3 py-1 text-sm font-bold', onglet === e.cle ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{e.nom}</button>
            ))}
          </div>
        )}
        <div ref={cadreRef} className={cn('relative mx-auto touch-none select-none overflow-hidden cursor-grab active:cursor-grabbing ring-2 ring-primary/40', emp?.classeCadre)}
          onPointerDown={(e) => { glisse.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => {
            if (!glisse.current || !cadreRef.current) return;
            const r = cadreRef.current.getBoundingClientRect();
            maj(deplacer(c, e.clientX - glisse.current.x, e.clientY - glisse.current.y, r.width, r.height));
            glisse.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => { glisse.current = null; }} onPointerCancel={() => { glisse.current = null; }}>
          <img src={src} alt="" draggable={false} className={cn('pointer-events-none h-full w-full object-cover', emp?.classeImage)} style={styleCadre(c)} />
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          🔍 Zoom
          <input type="range" min={1} max={3} step={0.05} value={c.zoom} onChange={(e) => maj({ ...c, zoom: Number(e.target.value) })} className="flex-1" aria-label="Zoom" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" disabled={estOrigine(c)} onClick={() => maj(CADRE_ORIGINE)}>↩️ Revenir au cadrage d'origine</Button>
          <Button disabled={busy} onClick={() => void enregistrer()}>💾 Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
