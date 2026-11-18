import { describe, expect, it } from 'vitest';
import { deplacer, estOrigine, lireCadre, styleCadre } from './cadrage';

describe('📐 cadrage des photos', () => {
  it('rien d\'enregistré = cadrage d\'origine', () => {
    expect(lireCadre(null, 'carte')).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(estOrigine(lireCadre({}, 'carte'))).toBe(true);
  });
  it('un réglage par emplacement, bornes respectées', () => {
    const c = { carte: { x: 20, y: 80, zoom: 2 }, detail: { x: 150, y: -5, zoom: 9 } };
    expect(lireCadre(c, 'carte')).toEqual({ x: 20, y: 80, zoom: 2 });
    expect(lireCadre(c, 'detail')).toEqual({ x: 100, y: 0, zoom: 3 });
  });
  it('glisser vers la droite fait voir la partie gauche (la photo suit le doigt)', () => {
    const c = deplacer({ x: 50, y: 50, zoom: 1 }, 100, 0, 300, 100);
    expect(c.x).toBeLessThan(50);
    expect(c.y).toBe(50);
  });
  it('style : position + zoom', () => {
    expect(styleCadre({ x: 30, y: 70, zoom: 1.5 })).toEqual({ objectPosition: '30% 70%', transform: 'scale(1.5)', transformOrigin: '30% 70%' });
  });
});
