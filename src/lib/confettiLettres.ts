import confetti from 'canvas-confetti';

/**
 * 🎉 Confettis en forme de LETTRES ARABES (Nadia, 2026-11-21, onglet « Pour les tout-petits ») :
 * quand l'enfant réussit, une pluie de jolies lettres colorées. Formes calculées une seule fois.
 * Respecte « réduire les animations » du téléphone (rien ne s'affiche alors).
 */
const LETTRES = ['ا', 'ب', 'ت', 'ج', 'د', 'ر', 'س', 'ع', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
let formes: ReturnType<typeof confetti.shapeFromText>[] | null = null;

const sansAnimation = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export function confettiLettres(lettresEnPlus: string[] = []) {
  if (sansAnimation()) return;
  try {
    if (!formes) formes = LETTRES.map((text) => confetti.shapeFromText({ text, scalar: 3 }));
    // La ou les lettres de l'enfant en plus grand nombre
    const siennes = lettresEnPlus.filter(Boolean).map((text) => confetti.shapeFromText({ text, scalar: 3 }));
    const shapes = [...formes, ...siennes, ...siennes, ...siennes];
    const base = { shapes, scalar: 3, zIndex: 9999, ticks: 220, gravity: 0.7, colors: ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'] };
    confetti({ ...base, particleCount: 26, spread: 70, startVelocity: 42, origin: { x: 0.2, y: 0.75 } });
    confetti({ ...base, particleCount: 26, spread: 70, startVelocity: 42, origin: { x: 0.8, y: 0.75 } });
    setTimeout(() => confetti({ ...base, particleCount: 30, spread: 110, startVelocity: 30, origin: { x: 0.5, y: 0.6 } }), 250);
  } catch { /* canvas indisponible : pas de confettis, rien ne casse */ }
}
