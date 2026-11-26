import { describe, it, expect } from 'vitest';
import { cheminTraces, choisirCachette, couperSegment, fenetreCachette, gene, pointVisible } from './cacheCacheLogique';

const ZONE = { x0: 14, y0: 64, x1: 376, y1: 830 };
const angle = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.atan2(b.y - a.y, b.x - a.x);

describe('🙈 cache-cache : la fenêtre de sa cachette', () => {
  it('par le haut : collée au bord haut de l\'élément, le long du bord', () => {
    const f = fenetreCachette({ left: 100, top: 300, width: 200, height: 160 }, 'haut', 1);
    expect(f).toEqual({ left: 252, top: 256, width: 48, height: 44 });
    // bord = 0.25 : la ligne où il se cache descend dans l'élément (dessin avec du vide autour)
    expect(fenetreCachette({ left: 0, top: 100, width: 100, height: 100 }, 'haut', 0, 0.25).top).toBe(125 - 44);
  });
  it('par la gauche / la droite : collée au côté', () => {
    const el = { left: 200, top: 500, width: 112, height: 96 };
    expect(fenetreCachette(el, 'gauche', 0).left + 44).toBe(200);
    expect(fenetreCachette(el, 'droite', 0).left).toBe(312);
  });
  it('le point visé = le bout de lui qui dépasse', () => {
    const f = { left: 252, top: 256, width: 48, height: 44 };
    expect(pointVisible(f, 'haut')).toEqual({ x: 276, y: 290 });
  });
});

describe('🐾 les traces vont TOUJOURS vers lui (bug du 26/11)', () => {
  it('personnage visible : toutes les traces sont sur la ligne bulle → personnage, et la dernière est juste avant lui', () => {
    const depart = { x: 60, y: 200 }, arrivee = { x: 320, y: 700 };
    const t = cheminTraces(depart, arrivee, ZONE);
    expect(t.length).toBeGreaterThan(3);
    const der = t[t.length - 1];
    const dist = Math.hypot(arrivee.x - der.x, arrivee.y - der.y);
    expect(dist).toBeGreaterThan(18);
    expect(dist).toBeLessThan(36);
    // toutes sur la ligne bulle → personnage (à l'écart du pied gauche / pied droit près : 7 px)
    const L = Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y);
    for (const p of t) expect(Math.abs((arrivee.x - depart.x) * (depart.y - p.y) - (depart.x - p.x) * (arrivee.y - depart.y)) / L).toBeLessThan(7.5);
  });
  it('après un défilement (le personnage est passé sous l\'écran) : les traces s\'arrêtent au bord du bas, dans sa direction', () => {
    const depart = { x: 60, y: 200 }, arrivee = { x: 320, y: 1500 };
    const t = cheminTraces(depart, arrivee, ZONE);
    const der = t[t.length - 1];
    expect(der.y).toBeGreaterThan(ZONE.y1 - 12);
    expect(Math.abs(angle(depart, der) - angle(depart, arrivee))).toBeLessThan(0.03);
  });
  it('la bulle et lui hors de l\'écran du même côté : du milieu de l\'écran vers le bord, vers lui', () => {
    const t = cheminTraces({ x: 60, y: -900 }, { x: 300, y: -400 }, ZONE);
    expect(t.length).toBeGreaterThan(0);
    const der = t[t.length - 1];
    expect(der.y).toBeLessThan(ZONE.y0 + 12);
  });
  it('découpe un segment dans la zone de l\'écran', () => {
    expect(couperSegment({ x: 0, y: 0 }, { x: 10, y: 0 }, { x0: 2, y0: -1, x1: 8, y1: 1 })).toEqual([{ x: 2, y: 0 }, { x: 8, y: 0 }]);
    expect(couperSegment({ x: 0, y: 5 }, { x: 10, y: 5 }, { x0: 2, y0: -1, x1: 8, y1: 1 })).toBeNull();
  });
});

describe('🙈 choix de la cachette et boutons protégés', () => {
  it('une fois sur deux dans le décor, sinon une carte ; jamais rien d\'impossible', () => {
    expect(choisirCachette(3, 10, 0.2, 0.99)).toEqual({ type: 'decor', i: 2 });
    expect(choisirCachette(3, 10, 0.7, 0)).toEqual({ type: 'carte', i: 0 });
    expect(choisirCachette(0, 10, 0.1, 0.5)?.type).toBe('carte');
    expect(choisirCachette(4, 0, 0.9, 0.5)?.type).toBe('decor');
    expect(choisirCachette(0, 0, 0.5, 0.5)).toBeNull();
  });
  it('ne se pose jamais sur un petit bouton, mais une grande carte ne gêne pas', () => {
    const b = { left: 100, top: 100, width: 48, height: 44 };
    expect(gene(b, [{ left: 120, top: 120, width: 44, height: 44 }], 6 * 48 * 44)).toBe(true);
    expect(gene(b, [{ left: 0, top: 0, width: 360, height: 200 }], 6 * 48 * 44)).toBe(false);
    expect(gene(b, [{ left: 200, top: 120, width: 44, height: 44 }], 6 * 48 * 44)).toBe(false);
  });
});
