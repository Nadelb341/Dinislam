import { useEffect, useRef, useState } from 'react';
import { Pause, Volume2 } from 'lucide-react';
import { arreterVoix } from '@/lib/voixFabriquees';

/**
 * 🔊 Écouter la récitation des gestes du Coran de la carte Dhikr (Nadia, 27/11 soir : « 4 : oui »).
 * Récitateurs choisis par Nadia sur la page d'écoute : Mishary Al-'Afâsî (tout) et 'Abd al-Bâsit 'Abd as-Samad (Al-Ikhlâs).
 * Fichiers d'everyayah.com (usage non commercial), un par verset, allégés (AAC mono 56 kb/s, 1,7 Mo en tout), DANS l'appli :
 * `public/sons/voix/recitations/<afasy|abdelbasset>/<sourate><verset>.m4a`. Pas dans la liste « tout de suite » du service
 * worker (trop lourd pour tout le monde) : gardés dans la mémoire `dinislam-voix` dès la 1ʳᵉ écoute → ensuite hors ligne.
 * Jamais de voix de synthèse pour le Coran.
 */
const versets = (s: number, n: number) => Array.from({ length: n }, (_, i) => `${String(s).padStart(3, '0')}${String(i + 1).padStart(3, '0')}`);
const TROIS_QOUL = [...versets(112, 4), ...versets(113, 5), ...versets(114, 6)];

/** Les gestes qui ont une récitation (clé du geste → versets) */
export const RECITATIONS: Record<string, string[]> = {
  soir_ayat_kursi: ['002255'],
  soir_baqara: ['002285', '002286'],
  soir_trois_qoul: TROIS_QOUL,
  matin_trois_qoul: TROIS_QOUL,
};
const IKHLAS = versets(112, 4);
const url = (recitateur: 'afasy' | 'abdelbasset', v: string) => `/sons/voix/recitations/${recitateur}/${v}.m4a`;

export function BoutonRecitation({ cle }: { cle: string | null | undefined }) {
  const liste = cle ? RECITATIONS[cle] : undefined;
  const [enCours, setEnCours] = useState<'afasy' | 'abdelbasset' | null>(null);
  const [erreur, setErreur] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const arreter = () => { try { audio.current?.pause(); } catch { /* rien */ } audio.current = null; setEnCours(null); };
  useEffect(() => () => { try { audio.current?.pause(); } catch { /* rien */ } }, []);
  if (!liste) return null;

  const jouer = (recitateur: 'afasy' | 'abdelbasset', fichiers: string[]) => {
    if (enCours === recitateur) { arreter(); return; }
    arreter(); arreterVoix(); setErreur(false); setEnCours(recitateur);
    let i = 0;
    const suivant = () => {
      if (i >= fichiers.length) { audio.current = null; setEnCours(null); return; }
      const a = new Audio(url(recitateur, fichiers[i++]));
      audio.current = a;
      a.addEventListener('ended', suivant, { once: true });
      a.addEventListener('error', () => { setErreur(true); arreter(); }, { once: true });
      void a.play().catch(() => { setErreur(true); arreter(); });
    };
    suivant();
  };
  const bouton = 'inline-flex items-center gap-1.5 rounded-full border border-[#d8b46a] bg-white/90 px-3 py-1.5 text-xs sm:text-sm font-extrabold text-[#6b4200] shadow-sm active:scale-95';
  const avecIkhlas = liste[0] === '112001';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => jouer('afasy', liste)} className={bouton} aria-pressed={enCours === 'afasy'}>
        {enCours === 'afasy' ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Écouter (Al-'Afâsî)
      </button>
      {avecIkhlas && (
        <button type="button" onClick={() => jouer('abdelbasset', IKHLAS)} className={bouton} aria-pressed={enCours === 'abdelbasset'}>
          {enCours === 'abdelbasset' ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Al-Ikhlâs ('Abd al-Bâsit)
        </button>
      )}
      {erreur && <span className="text-xs font-bold text-red-700">📡 Nécessite Internet la 1ʳᵉ fois</span>}
    </div>
  );
}
