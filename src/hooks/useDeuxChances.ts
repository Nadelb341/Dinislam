import { useEffect, useRef, useState } from 'react';
import { sonCristal } from '@/lib/sonSaison';
import { sonErreur } from '@/lib/sonsErreur';
import { dureeMessage } from '@/lib/dureeMessage';

/**
 * 🎯 Règle des quiz (Nadia, 22/11) :
 * - bonne réponse du 1er coup → son « scintillement » (celui de la feuille d'or) et question suivante TOUTE SEULE ;
 * - erreur → son doux et une 2e chance ;
 * - à la 2e chance (juste OU fausse) → message éphémère avec la bonne réponse et une courte explication
 *   (5 s pour 3-4 mots, plus long si le texte est long), puis question suivante toute seule.
 * Score : 1 point du 1er coup, ½ point à la 2e chance.
 */
export interface MessageQuiz { ok: boolean; bonne: string; explication: string | null; duree: number }

export function useDeuxChances({ nb, estBonne, texteBonne, explication }: {
  nb: number;
  estBonne: (etape: number, choix: number) => boolean;
  texteBonne: (etape: number) => string;
  explication: (etape: number) => string | null;
}) {
  const [etape, setEtape] = useState(0);
  const [rates, setRates] = useState<number[]>([]);
  const [trouve, setTrouve] = useState<number | null>(null);
  const [message, setMessage] = useState<MessageQuiz | null>(null);
  const [score, setScore] = useState(0);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (minuteur.current) clearTimeout(minuteur.current); }, []);

  const suivante = (apres: number) => {
    minuteur.current = setTimeout(() => { setEtape((e) => e + 1); setRates([]); setTrouve(null); setMessage(null); }, apres);
  };
  const montrer = (ok: boolean) => {
    const bonne = texteBonne(etape), ex = explication(etape);
    const duree = dureeMessage(`${bonne} ${ex ?? ''}`);
    setMessage({ ok, bonne, explication: ex, duree });
    suivante(duree);
  };
  const toucher = (choix: number) => {
    if (etape >= nb || trouve !== null || message || rates.includes(choix)) return;
    const deuxieme = rates.length > 0;
    if (estBonne(etape, choix)) {
      sonCristal();
      setTrouve(choix);
      setScore((s) => s + (deuxieme ? 0.5 : 1));
      if (deuxieme) montrer(true); else suivante(1100);
    } else {
      sonErreur();
      setRates((r) => [...r, choix]);
      if (deuxieme) montrer(false);
    }
  };
  /** Passer le message tout de suite (toucher le message) */
  const passer = () => { if (!message) return; if (minuteur.current) clearTimeout(minuteur.current); suivante(0); };
  const recommencer = () => { if (minuteur.current) clearTimeout(minuteur.current); setEtape(0); setRates([]); setTrouve(null); setMessage(null); setScore(0); };
  return { etape, fini: etape >= nb, rates, trouve, message, score, toucher, passer, recommencer };
}
