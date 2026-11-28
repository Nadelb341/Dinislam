import { useId } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useJournee, useMaintenant } from '@/hooks/useDhikrLocal';
import { dhikrDuMoment, type CleQuotidien } from '@/lib/dhikr';
import { cn } from '@/lib/utils';
import { DefsPerles, Perle } from './Perles';

/**
 * 📿 IDÉE 5 · Petite carte « Dhikr du moment » de l'accueil (élèves).
 * 27/11 (2ᵉ demande, d'après la capture de Nadia) : cadre crème arrondi à liseré doré, étiquette « 🍂 Dhikr du jour » en haut ;
 * à gauche un petit chapelet de perles NACRÉES en cercle avec « 0 /33 » au centre et un cœur doré en haut ; à droite l'arabe
 * en grand, la phonétique dorée en italique, le sens et un gros bouton orange-doré « ▶ Commencer mon dhikr ».
 * Logique inchangée : jusqu'à midi = la série du matin ; de midi à 19 h = 3 dhikr du quotidien au choix (chacun disparaît une
 * fois fait, puis « Tous faits aujourd'hui, ma shâ' Allah ✨ ») ; après 19 h = la série du soir.
 * Tout est lu sur l'appareil (marche sans réseau). Aucun hook après un `return` (règle « l'appli doit toujours s'ouvrir »).
 * Textes courts écrits ici (pas d'import du gros fichier du contenu : la carte de l'accueil reste légère).
 */
interface Affiche { arabe: string; phonetique: string; sens: string; nombre: number }
const QUOTIDIENS_TEXTE: Record<CleQuotidien, { court: string; lien: string; affiche: Affiche }> = {
  apres_priere: {
    court: '33 · 33 · 33 + Lâ ilâha illa-llâh', lien: '/module/dhikr?onglet=apres',
    affiche: { arabe: 'سُبْحَانَ اللَّهِ', phonetique: 'Soubhâna-llâh · Al-hamdou lillâh · Allâhou akbar', sens: 'Le tasbih d\'après la prière', nombre: 33 },
  },
  astaghfirullah: {
    court: '100 × Astaghfirou-llâh', lien: '/module/dhikr?onglet=chapelet&dhikr=astaghfirullah',
    affiche: { arabe: 'أَسْتَغْفِرُ اللَّهَ', phonetique: 'Astaghfirou-llâh', sens: 'Je demande pardon à Allah', nombre: 100 },
  },
  subhanallah_wabihamdihi: {
    court: '100 × Soubhâna-llâhi wa bihamdihi', lien: '/module/dhikr?onglet=chapelet&dhikr=subhanallah_wabihamdihi',
    affiche: { arabe: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', phonetique: 'Soubhâna-llâhi wa bihamdihi', sens: 'Gloire et louange à Allah', nombre: 100 },
  },
};
/** Ce qu'on montre pour les séries (un dhikr de la série, compté au chapelet) */
const SERIE_TEXTE: Record<'matin' | 'soir', Affiche & { titre: string; phrase: string }> = {
  matin: { titre: '🌅 La série du matin', phrase: 'Pour bien commencer la journée', arabe: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', phonetique: 'Soubhâna-llâhi wa bihamdihi', sens: 'Gloire et louange à Allah', nombre: 100 },
  soir: { titre: '🌙 La série du soir · avant de dormir', phrase: 'Quelques gestes, et tu dors protégé', arabe: 'سُبْحَانَ اللَّهِ', phonetique: 'Soubhâna-llâh', sens: 'Gloire à Allah', nombre: 33 },
};

/** Le petit chapelet nacré : 11 perles en cercle, « 0 /33 » au centre, un cœur doré en haut */
function PetitChapelet({ nombre }: { nombre: number }) {
  const uid = useId().replace(/:/g, '');
  const perles = Array.from({ length: 11 }, (_, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / 11;
    return { i, x: 60 + 44 * Math.cos(a), y: 62 + 44 * Math.sin(a) };
  });
  return (
    <div className="relative w-[104px] sm:w-[120px] aspect-square shrink-0" aria-hidden>
      <svg viewBox="-4.5 -9 129 129" className="absolute inset-0 w-full h-full">
        <DefsPerles uid={uid} style="nacre" />
        <defs><filter id={`${uid}-o`} x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.3" floodColor="#7a4b1e" floodOpacity=".3" /></filter></defs>
        <circle cx="60" cy="62" r="44" stroke="#d9b98a" strokeWidth="1.2" fill="none" />
        <circle cx="60" cy="62" r="31" fill="#fffdf8" stroke="#ecd6aa" strokeWidth="1" />
        {perles.map((p) => (
          <g key={p.i} transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`} filter={`url(#${uid}-o)`}><Perle uid={uid} style="nacre" r={9} n={p.i} /></g>
        ))}
        {/* Le cœur doré, en haut */}
        <defs><linearGradient id={`${uid}-c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9dc85" /><stop offset="1" stopColor="#c98f1f" /></linearGradient></defs>
        <path transform="translate(0 -9)" d="M60 24 C60 24 51 18 51 12.5 C51 9 53.6 7 56.2 7 C58 7 59.3 8.2 60 9.6 C60.7 8.2 62 7 63.8 7 C66.4 7 69 9 69 12.5 C69 18 60 24 60 24 Z"
          fill={`url(#${uid}-c)`} stroke="#fff6dc" strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-[10%]">
        <p className="font-black tabular-nums leading-none text-[#2b1630]"><span className="text-2xl">0</span><span className="text-sm text-[#8a5300]"> /{nombre}</span></p>
      </div>
    </div>
  );
}

/**
 * 🍂 28/11 (Nadia) : en automne, la carte est posée sur SON image (`public/images/accueil/automne-dhikr.jpg`, 788×1110, carte
 * « Dhikr du jour » dessinée vide) : la vraie carte (chapelet, dhikr du jour, bouton) recouvre exactement la carte dessinée
 * (mesures en % de la largeur de l'image, `cqw`), on voit le ciel, la mosquée et les feuilles autour.
 */
export interface FondCarteDhikr { url: string; haut: number; hauteur: number }
/** `haut` / `hauteur` en % de la largeur de l'image (cqw) : jour = carte dessinée de 39,6 % à 66,2 %, nuit = de 43,8 % à 72,6 % (valeurs dans Index.tsx) */

export default function DhikrDuMoment({ fond = null }: { fond?: FondCarteDhikr | null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const maintenant = useMaintenant();
  const journee = useJournee(user?.id);
  const carte = dhikrDuMoment(maintenant, journee);

  const serie = carte.creneau === 'journee' ? null : SERIE_TEXTE[carte.creneau === 'soir' ? 'soir' : 'matin'];
  const premier = carte.creneau === 'journee' ? carte.restants[0] ?? null : null;
  const autres = carte.creneau === 'journee' ? carte.restants.slice(1) : [];
  const affiche: Affiche | null = serie ?? (premier ? QUOTIDIENS_TEXTE[premier].affiche : null);
  const faite = carte.creneau !== 'journee' && carte.faite;
  const ouvrir = () => {
    if (carte.creneau !== 'journee') navigate(`/module/dhikr?onglet=series&serie=${carte.creneau === 'soir' ? 'soir' : 'matin'}`);
    else if (premier) navigate(QUOTIDIENS_TEXTE[premier].lien);
  };

  const carteJsx = (
    <section aria-label="Dhikr du moment" style={fond ? { minHeight: `${fond.hauteur}cqw` } : undefined}
      className={cn('relative border-2 border-[#e3b341] bg-[#fffaf1] text-[#2b1630] shadow-[0_4px_16px_rgba(150,100,30,.18)] px-3 pb-3 pt-4 mt-3 animate-fade-in',
        fond ? 'rounded-[2rem] outline outline-1 outline-offset-[-6px] outline-[#ecd6aa] flex flex-col justify-center' : 'rounded-3xl')}>
      {/* L'étiquette en haut, posée sur le liseré doré (au milieu sur l'image d'automne, comme la carte dessinée) */}
      <span className={cn('absolute -top-3 rounded-full border-2 border-[#e3b341] bg-gradient-to-b from-[#fff6df] to-[#fbe7b8] px-3 py-0.5 text-xs font-extrabold text-[#6b4200] shadow-sm whitespace-nowrap',
        fond ? 'left-1/2 -translate-x-1/2 sm:text-sm' : 'left-4')}>
        🍂 Dhikr du jour
      </span>
      {affiche ? (
        <div className="flex items-center gap-3">
          <PetitChapelet nombre={affiche.nombre} />
          <div className="flex-1 min-w-0 text-center space-y-0.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#8a5300] [overflow-wrap:anywhere]">{serie ? serie.titre : premier ? `☀️ ${QUOTIDIENS_TEXTE[premier].court}` : ''}</p>
            <p dir="rtl" lang="ar" className="font-arabic text-2xl sm:text-3xl font-bold leading-[1.7] text-[#2b1630] [overflow-wrap:anywhere]">{affiche.arabe}</p>
            <p className="text-sm italic font-bold text-[#a86a00] [overflow-wrap:anywhere]">{affiche.phonetique}</p>
            <p className="text-xs text-[#5b3a52] [overflow-wrap:anywhere]">{faite ? '✅ Faite aujourd\'hui, ma shâ\' Allah ✨' : serie ? `${affiche.sens} · ${serie.phrase}` : affiche.sens}</p>
            <button type="button" onClick={ouvrir}
              className={cn('mt-1.5 w-full rounded-full py-2.5 px-3 text-sm sm:text-base font-black shadow-[0_3px_10px_rgba(205,120,20,.4)] ring-2 ring-white/80 active:scale-[0.98] transition-transform',
                faite ? 'bg-white text-[#6b4200] border border-[#e3b341]' : 'bg-gradient-to-b from-[#ffc164] via-[#f5a03a] to-[#e2861f] text-[#3d1f00]')}>
              {faite ? '🔁 Revoir' : '▶ Commencer mon dhikr'}
            </button>
          </div>
        </div>
      ) : (
        <p className="py-2 text-center text-sm font-bold">Tous faits aujourd'hui, ma shâ' Allah ✨</p>
      )}
      {autres.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {autres.map((k) => (
            <button key={k} type="button" onClick={() => navigate(QUOTIDIENS_TEXTE[k].lien)}
              className="rounded-full border-2 border-[#e3b341] bg-white px-3 py-1.5 text-xs sm:text-sm font-bold text-[#4a2c1a] active:scale-95 [overflow-wrap:anywhere]">
              📿 {QUOTIDIENS_TEXTE[k].court}
            </button>
          ))}
        </div>
      )}
    </section>
  );
  if (!fond) return carteJsx;
  return (
    <div className="relative overflow-hidden rounded-3xl [container-type:inline-size]"
      style={{ backgroundColor: '#f3cfa8', backgroundImage: `url("${fond.url}")`, backgroundSize: '100% auto', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }}>
      {/* La carte dessinée commence à 36,8 % de la largeur (son bord du haut) et occupe 13 % → 87 % : la vraie carte la recouvre */}
      <div style={{ paddingTop: `calc(${fond.haut}cqw - 0.75rem)`, paddingBottom: '7cqw', paddingLeft: 'clamp(10px, 13cqw - 40px, 13cqw)', paddingRight: 'clamp(10px, 13cqw - 40px, 13cqw)' }}>
        {carteJsx}
      </div>
    </div>
  );
}
