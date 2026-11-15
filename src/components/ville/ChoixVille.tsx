import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { chercherVilles, type VilleTrouvee } from '@/lib/ville';

/**
 * 📍 Choisir sa ville (inscription + Paramètres du profil, 2026-11-15) : on tape, l'appli propose jusqu'à 5 villes
 * (région et pays écrits), on touche la bonne. Rien de choisi = pas d'horaires de sa ville.
 */
export function ChoixVille({ id = 'choix-ville', choisie, onChoix, texteDepart = '' }: {
  id?: string; choisie: VilleTrouvee | null; onChoix: (v: VilleTrouvee | null) => void; texteDepart?: string;
}) {
  const [texte, setTexte] = useState(choisie?.nom ?? texteDepart);
  const [liste, setListe] = useState<VilleTrouvee[] | null>(null);
  const [etat, setEtat] = useState<'' | 'cherche' | 'rien' | 'reseau'>('');
  const dernier = useRef('');
  useEffect(() => {
    const t = texte.trim();
    if (choisie && t === choisie.nom) return;
    if (t.length < 2) { setListe(null); setEtat(''); return; }
    const minuterie = setTimeout(async () => {
      dernier.current = t; setEtat('cherche');
      try {
        const r = await chercherVilles(t);
        if (dernier.current !== t) return;
        setListe(r); setEtat(r.length ? '' : 'rien');
      } catch { if (dernier.current === t) { setListe(null); setEtat('reseau'); } }
    }, 450);
    return () => clearTimeout(minuterie);
  }, [texte, choisie]);

  return (
    <div className="space-y-1.5">
      <Input id={id} value={texte} autoComplete="address-level2" placeholder="ex. Clermont-l'Hérault"
        onChange={(e) => { setTexte(e.target.value); if (choisie) onChoix(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (liste?.length) { onChoix(liste[0]); setTexte(liste[0].nom); setListe(null); } } }} />
      {choisie && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 [overflow-wrap:anywhere]">✅ {choisie.label}</p>}
      {etat === 'cherche' && <p className="text-xs text-muted-foreground">🔍 Je cherche…</p>}
      {etat === 'rien' && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">❓ Ville introuvable : vérifie l'orthographe (ex. « Clermont-l'Hérault »).</p>}
      {etat === 'reseau' && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">📡 Nécessite Internet pour chercher ta ville.</p>}
      {!choisie && liste && liste.length > 0 && (
        <div role="listbox" aria-label="Villes trouvées" className="grid gap-1">
          <p className="text-xs text-muted-foreground">Touche ta ville :</p>
          {liste.map((v) => (
            <button key={`${v.lat},${v.lon}`} type="button" role="option" aria-selected={false}
              onClick={() => { onChoix(v); setTexte(v.nom); setListe(null); }}
              className="rounded-lg border bg-card px-3 py-1.5 text-start text-sm font-semibold hover:bg-muted [overflow-wrap:anywhere]">📍 {v.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
