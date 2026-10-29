import { useMemo } from 'react';
import { POLICES, TITRE_DEFAUT, estRamadan, useReglagesTitre, type ReglagesTitre } from '@/lib/apparence';

/**
 * 🌠 Pluie d'étoiles PERMANENTE (2026-10-29, demande de Nadia) : légère et douce, des étoiles bien dorées,
 * chacune suivie d'un petit chemin de mini-étoiles, qui tombent jusque sous le Bismillah et disparaissent en bas.
 * Positions, tailles, vitesses et retards fixes (calculés une fois) : même dessin à chaque ouverture.
 */
const ETOILES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 5) % 97,
  size: 8 + ((i * 5) % 8),
  duree: 6 + ((i * 7) % 5),
  delay: -((i * 1.3) % 9), // négatif : la pluie est déjà en cours dès l'ouverture
  char: i % 4 === 0 ? '★' : '✦',
}));
/** Couleur trop sombre pour le thème sombre ? (alors on éclaircit, sinon le nom serait illisible) */
function tropSombre(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l < 0.35;
}

const SCINTILLES = [{ l: 4, t: 18 }, { l: 92, t: 22 }, { l: 18, t: 70 }, { l: 80, t: 74 }, { l: 50, t: 4 }];

/**
 * ✨ Le haut de l'accueil (2026-10-29, choix de Nadia) : le croissant de l'icône, le nom entre deux traits dorés
 * (proposition 8), la pluie d'étoiles permanente, puis « Assalamou Alaykoum », « Bienvenue » (en bleu du logo) et le Bismillah.
 * Tout vient des réglages du bouclier › 🔧 Apparence appli › Le titre. `rejouer` relance la pluie dans l'aperçu.
 */
export function TitreAppli({ r, nom, rejouer = 0, forcerRamadan }: {
  r: ReglagesTitre; nom: string | null; apercu?: boolean; rejouer?: number; forcerRamadan?: boolean;
}) {
  const ramadan = r.ramadan && (forcerRamadan ?? estRamadan());
  const choisie = ramadan ? r.ramadanTexte : r.couleurTexte;
  const sombre = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const couleur = sombre && tropSombre(choisie) ? '#f3ead2' : choisie;
  const traits = ramadan ? r.ramadanTraits : r.couleurTraits;
  const police = POLICES.find((p) => p.v === r.police)?.css ?? POLICES[0].css;
  const texte = r.majuscules ? r.texte.toUpperCase() : r.texte;
  const bienvenue = r.bienvenue.replace('{nom}', nom || '').replace(/,\s*!/, ' !').replace(/\s+!/, ' !');
  const styleNom = useMemo(() => ({
    fontFamily: police,
    letterSpacing: `${r.espacement / 10}em`,
    color: couleur,
    textShadow: r.ombre ? `0 3px 8px ${couleur}55` : undefined,
    ...(r.reflet ? { backgroundImage: `linear-gradient(110deg, ${couleur} 35%, ${traits} 50%, ${couleur} 65%)` } : {}),
  }), [police, r.espacement, couleur, r.ombre, r.reflet, traits]);

  return (
    <div className="relative text-center py-6 animate-fade-in overflow-hidden">
      {r.pluie && (
        <div key={rejouer} aria-hidden className="absolute inset-0 pointer-events-none">
          {ETOILES.map((e, i) => (
            <span key={i} className="titre-etoile-tombe" style={{ left: `${e.left}%`, animationDuration: `${e.duree}s`, animationDelay: `${e.delay}s`, ['--or' as string]: traits }}>
              {/* Le chemin : mini-étoiles de plus en plus petites et pâles au-dessus de l'étoile */}
              <span className="titre-chemin">{'✦'.repeat(4).split('').map((c, k) => <i key={k} style={{ fontSize: Math.max(3, e.size - 3 - k * 1.5), opacity: 0.7 - k * 0.15 }}>{c}</i>)}</span>
              <span className="titre-etoile" style={{ fontSize: e.size }}>{e.char}</span>
            </span>
          ))}
        </div>
      )}

      {r.icone && (
        <div className="flex justify-center mb-2">
          <img src="/icon-192.png" alt="" width={56} height={56} className={`h-14 w-14 rounded-2xl shadow-md ${r.brillant ? 'titre-croissant-brille' : ''}`} />
        </div>
      )}

      <div className="relative inline-flex items-center justify-center gap-3 max-w-full px-2">
        {r.scintillant && SCINTILLES.map((s, i) => (
          <span key={i} aria-hidden className="titre-scintille text-xs" style={{ left: `${s.l}%`, top: `${s.t}%`, color: traits, animationDelay: `${i * 0.45}s` }}>✦</span>
        ))}
        {r.traits && <i aria-hidden className="block h-0.5 w-8 sm:w-12 shrink-0 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${traits})` }} />}
        <h1 className={`text-2xl sm:text-3xl font-bold min-w-0 [overflow-wrap:anywhere] ${r.reflet ? 'titre-reflet' : ''}`} style={styleNom}>{texte}</h1>
        {r.traits && <i aria-hidden className="block h-0.5 w-8 sm:w-12 shrink-0 rounded-full" style={{ background: `linear-gradient(270deg, transparent, ${traits})` }} />}
      </div>

      {ramadan && <p className="mt-1 text-xs font-bold" style={{ color: traits }}>🌙 Ramadan Moubarak</p>}
      {r.salutation && <p className="text-muted-foreground mt-3 mb-1">{r.salutation}</p>}
      {r.bienvenue && <h2 className="text-2xl font-bold [overflow-wrap:anywhere]" style={{ color: sombre && tropSombre(r.couleurBienvenue) ? '#9db4ff' : r.couleurBienvenue }}>{bienvenue}</h2>}
      {r.bismillah && <p className={`font-arabic mt-2 text-3xl ${r.couleurBismillah ? '' : 'text-gold'}`} style={r.couleurBismillah ? { color: r.couleurBismillah } : undefined}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}
    </div>
  );
}

/** Sur l'accueil : les réglages enregistrés (les réglages d'origine pendant le chargement) */
export function TitreAccueil({ nom, children }: { nom: string | null; children?: React.ReactNode }) {
  const { data: r = TITRE_DEFAUT } = useReglagesTitre();
  return (
    <div>
      <TitreAppli r={r} nom={nom} />
      {children}
    </div>
  );
}
