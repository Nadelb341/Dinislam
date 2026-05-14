// Illustrations SVG — enfant en thobe blanc + kufi, visage beige sans traits

interface SceneProps { title: string; }

// ── Personnage principal ─────────────────────────────────────────────────
// Enfant en thobe blanc islamique + kufi, sans yeux/nez/bouche
const Kid = ({
  x = 0, y = 0,
  armLeft = 0, armRight = 0,
  lean = 0, flip = false,
}: {
  x?: number; y?: number;
  armLeft?: number; armRight?: number;
  lean?: number; flip?: boolean;
}) => (
  <g transform={`translate(${x},${y}) ${flip ? 'scale(-1,1)' : ''} rotate(${lean} 0 20)`}>
    {/* Thobe — longue robe blanche */}
    <path d="M-8 13 Q-12 28 -11 43 L11 43 Q12 28 8 13 Z"
          fill="#F8F9FF" stroke="#D8D8EC" strokeWidth="0.8"/>
    {/* Col thobe */}
    <path d="M-4.5 13 Q0 15.5 4.5 13" fill="none" stroke="#C8C8DC" strokeWidth="1"/>
    {/* Pli central subtil */}
    <line x1="0" y1="15" x2="0" y2="43" stroke="#E8E8F4" strokeWidth="0.5"/>
    {/* Bras gauche */}
    <g transform={`rotate(${armLeft} -8 15)`}>
      <path d="M-8 14 L-14 28 Q-12 30 -11 29 L-7 16 Z"
            fill="#EDEDF8" stroke="#D8D8EC" strokeWidth="0.5"/>
      <ellipse cx="-12.5" cy="30" rx="3.2" ry="3" fill="#F2C08A"/>
    </g>
    {/* Bras droit */}
    <g transform={`rotate(${armRight} 8 15)`}>
      <path d="M8 14 L14 28 Q12 30 11 29 L7 16 Z"
            fill="#EDEDF8" stroke="#D8D8EC" strokeWidth="0.5"/>
      <ellipse cx="12.5" cy="30" rx="3.2" ry="3" fill="#F2C08A"/>
    </g>
    {/* Cou */}
    <rect x="-2.8" y="9" width="5.6" height="5" rx="1.8" fill="#F2C08A"/>
    {/* Visage beige — aucun trait */}
    <ellipse cx="0" cy="4" rx="7" ry="8.5" fill="#F2C08A"/>
    {/* Kufi (calotte islamique blanche) */}
    <path d="M-8 3.5 Q-8 -8 0 -10 Q8 -8 8 3.5 Z" fill="#F5F3F0" stroke="#E0DED8" strokeWidth="0.6"/>
    <ellipse cx="0" cy="3.5" rx="8" ry="3" fill="#EDEAE6" stroke="#D8D5D0" strokeWidth="0.5"/>
    {/* Sandales */}
    <ellipse cx="-4.5" cy="43.5" rx="5" ry="2.2" fill="#C49050"/>
    <ellipse cx="4.5" cy="43.5" rx="5" ry="2.2" fill="#C49050"/>
  </g>
);

// Enfant allongé (pour sommeil / maladie)
const KidLying = ({ x = 0, y = 0, shirt = '#F8F9FF' }: { x?: number; y?: number; shirt?: string }) => (
  <g transform={`translate(${x},${y})`}>
    {/* Corps thobe horizontal */}
    <rect x="-18" y="-7" width="36" height="14" rx="7" fill={shirt} stroke="#D8D8EC" strokeWidth="0.7"/>
    {/* Pli */}
    <line x1="-18" y1="0" x2="18" y2="0" stroke="#E8E8F4" strokeWidth="0.4"/>
    {/* Tête */}
    <ellipse cx="-22" cy="0" rx="7" ry="8" fill="#F2C08A"/>
    {/* Kufi */}
    <path d="M-29 -2.5 Q-29 -10 -22 -11.5 Q-15 -10 -15 -2.5 Z" fill="#F5F3F0" stroke="#E0DED8" strokeWidth="0.5"/>
    <ellipse cx="-22" cy="-2.5" rx="7" ry="2.5" fill="#EDEAE6"/>
    {/* Sandales */}
    <ellipse cx="20" cy="-3" rx="2.2" ry="5" fill="#C49050"/>
    <ellipse cx="20" cy="3" rx="2.2" ry="5" fill="#C49050"/>
  </g>
);

// ── Scènes ─────────────────────────────────────────────────────────────

const SceneReveille = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FEF3DC"/>
    {/* Ciel matinal */}
    <rect width="56" height="32" rx="12" fill="#FFE0A0" opacity="0.6"/>
    {/* Fenêtre */}
    <rect x="36" y="4" width="17" height="20" rx="2" fill="#FFF8C8" stroke="#E0C860" strokeWidth="0.8"/>
    <line x1="44.5" y1="4" x2="44.5" y2="24" stroke="#E0C860" strokeWidth="0.6" opacity="0.5"/>
    <line x1="36" y1="14" x2="53" y2="14" stroke="#E0C860" strokeWidth="0.6" opacity="0.5"/>
    {/* Rayons de soleil */}
    {[0,45,90,135,180,225,270,315].map((a,i) => (
      <line key={i}
        x1="44.5" y1="14"
        x2={44.5 + Math.cos(a*Math.PI/180)*14}
        y2={14 + Math.sin(a*Math.PI/180)*14}
        stroke="#FFCA28" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    ))}
    <circle cx="44.5" cy="14" r="6" fill="#FFCA28" opacity="0.7"/>
    {/* Parquet */}
    <rect y="44" width="56" height="12" rx="0" fill="#D4A870"/>
    <line x1="0" y1="48" x2="56" y2="48" stroke="#C09058" strokeWidth="0.5" opacity="0.5"/>
    {/* Lit */}
    <rect x="1" y="36" width="34" height="16" rx="4" fill="#FFFFFF" stroke="#DCC8B0" strokeWidth="0.8"/>
    <rect x="1" y="36" width="34" height="7" rx="4" fill="#F4A898"/>
    <ellipse cx="10" cy="39.5" rx="7.5" ry="3.5" fill="#FAF5F0" stroke="#E0CCC0" strokeWidth="0.6"/>
    {/* Enfant assis, bras levés (étirement) */}
    <Kid x={24} y={10} armLeft={-80} armRight={80}/>
  </svg>
);

const SceneCoucher = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#1C2E50"/>
    {/* Ciel étoilé */}
    {[[7,6],[15,10],[28,4],[42,8],[50,5],[5,18],[22,14],[38,16],[48,20]].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r={i%2===0?1.2:0.8} fill="#FFF" opacity={0.5+0.3*(i%3)*0.2}/>
    ))}
    {/* Lune croissant */}
    <circle cx="44" cy="11" r="7.5" fill="#FFF8D0"/>
    <circle cx="48" cy="8.5" r="6" fill="#1C2E50"/>
    {/* Sol */}
    <rect y="44" width="56" height="12" rx="0" fill="#2A1A0E"/>
    {/* Lit */}
    <rect x="1" y="36" width="54" height="16" rx="4" fill="#3A2572"/>
    <rect x="1" y="36" width="54" height="7" rx="4" fill="#5538A8"/>
    {/* Oreiller */}
    <ellipse cx="10" cy="40" rx="7" ry="3.5" fill="#7860C0" stroke="#5840A0" strokeWidth="0.7"/>
    {/* Enfant allongé */}
    <g transform="translate(32,41)">
      <KidLying shirt="#F8F9FF"/>
    </g>
    {/* ZZZ */}
    <text x="44" y="30" fontSize="7" fill="#8888CC" fontWeight="bold">z</text>
    <text x="48" y="24" fontSize="5" fill="#8888CC" fontWeight="bold">z</text>
  </svg>
);

const SceneEntrerMosquee = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    {/* Ciel */}
    <rect width="56" height="56" rx="12" fill="#D0E8F8"/>
    <rect width="56" height="36" rx="12" fill="#B8D8F0" opacity="0.4"/>
    {/* Sol/chemin */}
    <rect y="40" width="56" height="16" rx="0" fill="#D8C890"/>
    <path d="M8 56 L20 40 L36 40 L48 56 Z" fill="#E8D8A0" opacity="0.8"/>
    {/* Mosquée */}
    <rect x="28" y="18" width="26" height="26" fill="#F2ECD8" stroke="#C8B880" strokeWidth="0.7"/>
    {/* Dôme */}
    <path d="M29 18 Q41 6 53 18" fill="#E8E0C8" stroke="#C8B880" strokeWidth="0.6"/>
    <ellipse cx="41" cy="18" rx="8" ry="3" fill="#DDD4B8"/>
    {/* Minarets */}
    <rect x="28" y="6" width="5" height="15" fill="#EDE8D8" stroke="#C8B880" strokeWidth="0.5"/>
    <path d="M28 6 Q30.5 2 33 6" fill="#D8C890"/>
    <rect x="49" y="6" width="5" height="15" fill="#EDE8D8" stroke="#C8B880" strokeWidth="0.5"/>
    <path d="M49 6 Q51.5 2 54 6" fill="#D8C890"/>
    {/* Porte en arc */}
    <path d="M36 44 L36 28 Q41 23 46 28 L46 44 Z" fill="#B89058"/>
    <path d="M37.5 44 L37.5 29 Q41 25 44.5 29 L44.5 44 Z" fill="#A07840" opacity="0.5"/>
    {/* Fenêtres */}
    <path d="M30 30 L30 25 Q33 22.5 36 25 L36 30 Z" fill="#C0DCF0" stroke="#A8C8E0" strokeWidth="0.4"/>
    <path d="M46 30 L46 25 Q49 22.5 52 25 L52 30 Z" fill="#C0DCF0" stroke="#A8C8E0" strokeWidth="0.4"/>
    {/* Arbres */}
    <ellipse cx="8" cy="30" rx="5" ry="7" fill="#5A9840"/>
    <rect x="6.5" y="36" width="3" height="7" fill="#7A5028"/>
    <ellipse cx="18" cy="33" rx="4" ry="5.5" fill="#68A850"/>
    <rect x="16.5" y="38" width="3" height="5" fill="#7A5028"/>
    {/* Personnage — marche vers la mosquée */}
    <Kid x={17} y={12} armLeft={30} armRight={-25}/>
  </svg>
);

const SceneSortirMosquee = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#D0E8F8"/>
    <rect width="56" height="36" rx="12" fill="#B8D8F0" opacity="0.4"/>
    <rect y="40" width="56" height="16" rx="0" fill="#D8C890"/>
    <path d="M8 56 L20 40 L36 40 L48 56 Z" fill="#E8D8A0" opacity="0.8"/>
    {/* Mosquée à gauche */}
    <rect x="2" y="18" width="26" height="26" fill="#F2ECD8" stroke="#C8B880" strokeWidth="0.7"/>
    <path d="M3 18 Q15 6 27 18" fill="#E8E0C8" stroke="#C8B880" strokeWidth="0.6"/>
    <ellipse cx="15" cy="18" rx="8" ry="3" fill="#DDD4B8"/>
    <rect x="2" y="6" width="5" height="15" fill="#EDE8D8" stroke="#C8B880" strokeWidth="0.5"/>
    <path d="M2 6 Q4.5 2 7 6" fill="#D8C890"/>
    <rect x="23" y="6" width="5" height="15" fill="#EDE8D8" stroke="#C8B880" strokeWidth="0.5"/>
    <path d="M23 6 Q25.5 2 28 6" fill="#D8C890"/>
    {/* Porte en arc — mosquée gauche */}
    <path d="M10 44 L10 28 Q15 23 20 28 L20 44 Z" fill="#B89058"/>
    <path d="M4 30 L4 25 Q7 22.5 10 25 L10 30 Z" fill="#C0DCF0" stroke="#A8C8E0" strokeWidth="0.4"/>
    <path d="M20 30 L20 25 Q23 22.5 26 25 L26 30 Z" fill="#C0DCF0" stroke="#A8C8E0" strokeWidth="0.4"/>
    {/* Enfant qui sort (dos à la mosquée, se dirige à droite) */}
    <Kid x={38} y={12} armLeft={-25} armRight={30} flip={true}/>
  </svg>
);

const SceneAvantManger = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#F0F8EC"/>
    {/* Mur */}
    <rect width="56" height="38" rx="12" fill="#E8F4E0" opacity="0.5"/>
    {/* Parquet */}
    <rect y="44" width="56" height="12" rx="0" fill="#C4906A"/>
    {/* Table */}
    <rect x="10" y="36" width="36" height="5" rx="2.5" fill="#A07848"/>
    <rect x="12" y="41" width="4" height="10" rx="1.5" fill="#8A6030"/>
    <rect x="40" y="41" width="4" height="10" rx="1.5" fill="#8A6030"/>
    {/* Nappe */}
    <rect x="10" y="34" width="36" height="4" rx="2" fill="#FAFAF0" stroke="#E8E8D0" strokeWidth="0.6"/>
    {/* Assiette */}
    <ellipse cx="30" cy="35" rx="9" ry="4.5" fill="#FFFFFF" stroke="#D8D8C8" strokeWidth="0.7"/>
    <ellipse cx="30" cy="35" rx="6" ry="3" fill="#FFF0E8"/>
    {/* Nourriture */}
    <circle cx="28" cy="34.5" r="2.5" fill="#88CC78"/>
    <circle cx="32" cy="34.5" r="2.5" fill="#F08878"/>
    {/* Verre */}
    <rect x="42" y="29" width="6" height="9" rx="1.5" fill="#C8E8F8" opacity="0.8" stroke="#A8C8E8" strokeWidth="0.6"/>
    {/* Couteau & fourchette */}
    <line x1="16" y1="33" x2="16" y2="40" stroke="#B0B0B0" strokeWidth="1" strokeLinecap="round"/>
    <line x1="20" y1="33" x2="20" y2="40" stroke="#B0B0B0" strokeWidth="1" strokeLinecap="round"/>
    {/* Personnage debout, légèrement penché */}
    <Kid x={30} y={6} armLeft={20} armRight={-20} lean={5}/>
  </svg>
);

const SceneApresManger = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#F4F8F0"/>
    <rect width="56" height="38" rx="12" fill="#EAF4E4" opacity="0.5"/>
    <rect y="44" width="56" height="12" rx="0" fill="#C4906A"/>
    {/* Table */}
    <rect x="10" y="36" width="36" height="5" rx="2.5" fill="#A07848"/>
    <rect x="12" y="41" width="4" height="10" rx="1.5" fill="#8A6030"/>
    <rect x="40" y="41" width="4" height="10" rx="1.5" fill="#8A6030"/>
    <rect x="10" y="34" width="36" height="4" rx="2" fill="#FAFAF0" stroke="#E8E8D0" strokeWidth="0.6"/>
    {/* Assiette vide */}
    <ellipse cx="30" cy="35" rx="9" ry="4.5" fill="#FFFFFF" stroke="#D8D8C8" strokeWidth="0.7"/>
    <ellipse cx="30" cy="35" rx="6" ry="3" fill="#F8F5F0"/>
    {/* Couverts croisés = repas terminé */}
    <line x1="27" y1="33" x2="29.5" y2="37" stroke="#B0B0B0" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="29.5" y1="33" x2="27" y2="37" stroke="#B0B0B0" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Verre vide */}
    <rect x="42" y="29" width="6" height="9" rx="1.5" fill="#F0F8FC" opacity="0.7" stroke="#A8C8E8" strokeWidth="0.6"/>
    {/* Étoiles satisfaction */}
    <text x="5" y="20" fontSize="9" opacity="0.6">✨</text>
    <text x="46" y="18" fontSize="7" opacity="0.5">✨</text>
    {/* Personnage — main sur ventre (satisfait) */}
    <Kid x={30} y={6} armLeft={0} armRight={-45} lean={-5}/>
  </svg>
);

const SceneEntrerToilettes = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#EBF5FD"/>
    {/* Mur carrelé */}
    <rect x="28" y="0" width="28" height="56" rx="0" fill="#F2F8FC"/>
    {[0,1,2,3,4].map(row => [0,1].map(col => (
      <rect key={`${row}-${col}`} x={29+col*12} y={row*11} width="11" height="10"
        fill="none" stroke="#DDEEF8" strokeWidth="0.6"/>
    )))}
    {/* Porte de la salle de bain */}
    <rect x="34" y="14" width="18" height="38" rx="2" fill="#D0C8B8" stroke="#B8AFA0" strokeWidth="0.8"/>
    <rect x="34" y="14" width="18" height="38" rx="2" fill="none" stroke="#B8AFA0" strokeWidth="0.6"/>
    <circle cx="36.5" cy="33" r="2" fill="#B8A860" stroke="#A09050" strokeWidth="0.5"/>
    {/* Poignée porte */}
    <path d="M36.5 33 L38.5 33" stroke="#A09050" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Sol parquet */}
    <rect y="48" width="56" height="8" rx="0" fill="#C4906A" opacity="0.6"/>
    {/* Mur gauche — papier peint clair */}
    <rect x="0" y="0" width="28" height="56" rx="0" fill="#EBF5FD"/>
    {/* Personnage s'approche */}
    <Kid x={18} y={12} armLeft={25} armRight={-20}/>
  </svg>
);

const SceneSortirToilettes = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E4F4FD"/>
    {/* Mur carrelé gauche */}
    <rect x="0" y="0" width="26" height="56" rx="0" fill="#F2F8FC"/>
    {[0,1,2,3,4].map(row => [0,1].map(col => (
      <rect key={`${row}-${col}`} x={1+col*12} y={row*11} width="11" height="10"
        fill="none" stroke="#DDEEF8" strokeWidth="0.6"/>
    )))}
    {/* Porte ouverte */}
    <rect x="4" y="12" width="16" height="36" rx="2" fill="#C8C0B0"
          transform="rotate(-25 4 48)" stroke="#B8AFA0" strokeWidth="0.6"/>
    {/* Lavabo / robinet */}
    <rect x="32" y="20" width="20" height="12" rx="4" fill="#E8EEF2" stroke="#B8C8D8" strokeWidth="0.8"/>
    <path d="M38 20 L38 14 Q42 11 46 14 L46 20" fill="none" stroke="#B8C8D8" strokeWidth="1.8"/>
    {/* Eau */}
    <line x1="42" y1="18" x2="41.5" y2="23" stroke="#80C4F0" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,1.5"/>
    <line x1="42" y1="18" x2="42.5" y2="23" stroke="#80C4F0" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,1.5"/>
    {/* Sol */}
    <rect y="48" width="56" height="8" rx="0" fill="#C4906A" opacity="0.6"/>
    {/* Personnage sort, bras légèrement levés */}
    <Kid x={38} y={10} armLeft={-35} armRight={35} flip={true}/>
  </svg>
);

const SceneVoiture = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FFF4E0"/>
    {/* Ciel */}
    <rect width="56" height="32" rx="12" fill="#FFE8B0" opacity="0.4"/>
    {/* Route */}
    <rect y="40" width="56" height="16" rx="0" fill="#7A8C98"/>
    <rect y="40" width="56" height="2" fill="#8FA0AC"/>
    {[0,1,2,3].map(i => (
      <rect key={i} x={3+i*14} y="47" width="9" height="2.5" rx="1.2" fill="#FFEE80" opacity="0.9"/>
    ))}
    {/* Voiture */}
    <rect x="22" y="28" width="32" height="14" rx="3.5" fill="#E84040"/>
    <path d="M25 28 L28 20 L46 20 L50 28 Z" fill="#D03030"/>
    {/* Vitres */}
    <rect x="29" y="21" width="9" height="7" rx="1.5" fill="#B8DCF8" opacity="0.9"/>
    <rect x="40" y="21" width="8" height="7" rx="1.5" fill="#B8DCF8" opacity="0.9"/>
    {/* Roues */}
    <circle cx="30" cy="42" r="5.5" fill="#2A3038"/>
    <circle cx="30" cy="42" r="2.8" fill="#6A7480"/>
    <circle cx="46" cy="42" r="5.5" fill="#2A3038"/>
    <circle cx="46" cy="42" r="2.8" fill="#6A7480"/>
    {/* Phare avant */}
    <ellipse cx="53" cy="32" rx="1.5" ry="2.5" fill="#FFFFC0" opacity="0.9"/>
    {/* Personnage à côté */}
    <Kid x={11} y={12} armLeft={0} armRight={-25}/>
  </svg>
);

const SceneVoyage = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#DDE8F8"/>
    {/* Nuages */}
    <ellipse cx="38" cy="11" rx="11" ry="6.5" fill="white" opacity="0.9"/>
    <ellipse cx="44" cy="9" rx="9" ry="5.5" fill="white" opacity="0.9"/>
    <ellipse cx="30" cy="10" rx="8" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="10" cy="18" rx="8" ry="5" fill="white" opacity="0.8"/>
    <ellipse cx="16" cy="16" rx="7" ry="4.5" fill="white" opacity="0.8"/>
    {/* Avion */}
    <g transform="translate(18,22) rotate(-15)">
      <rect x="0" y="4" width="24" height="8" rx="4" fill="#4A60C8"/>
      <path d="M18 4 L24 -1 L24 4 Z" fill="#3848A8"/>
      <rect x="5" y="-1" width="12" height="5" rx="2" fill="#6878D8"/>
      <rect x="8" y="12" width="8" height="4" rx="1.5" fill="#6878D8"/>
      <circle cx="7" cy="8" r="1.8" fill="#B8D8F8"/>
      <circle cx="13" cy="8" r="1.8" fill="#B8D8F8"/>
      <circle cx="19" cy="8" r="1.8" fill="#B8D8F8"/>
    </g>
    {/* Sol */}
    <rect y="44" width="56" height="12" rx="0" fill="#C8B880"/>
    {/* Valise */}
    <rect x="2" y="37" width="13" height="10" rx="2.5" fill="#8A6030"/>
    <rect x="5" y="34" width="7" height="5" rx="1.5" fill="#705020"/>
    <line x1="2" y1="42" x2="15" y2="42" stroke="#604010" strokeWidth="0.8"/>
    {/* Poignée */}
    <path d="M6 34 Q8.5 32 11 34" fill="none" stroke="#604010" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Personnage avec valise */}
    <Kid x={28} y={12} armLeft={40} armRight={15}/>
  </svg>
);

const SceneMatin = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FFFCE0"/>
    {/* Dégradé de lever de soleil */}
    <rect width="56" height="35" rx="12" fill="#FFE040" opacity="0.3"/>
    {/* Soleil */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
      <line key={i} x1="42" y1="14"
        x2={42+Math.cos(a*Math.PI/180)*14}
        y2={14+Math.sin(a*Math.PI/180)*14}
        stroke="#FFCC00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    ))}
    <circle cx="42" cy="14" r="9" fill="#FFD700" opacity="0.9"/>
    <circle cx="42" cy="14" r="6.5" fill="#FFE840"/>
    {/* Sol */}
    <rect y="44" width="56" height="12" rx="0" fill="#98C860"/>
    {/* Herbe */}
    {[3,8,13,18,23,28,33,38,43,48,53].map(xx => (
      <line key={xx} x1={xx} y1="44" x2={xx-1.5} y2="40" stroke="#70A840" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
    ))}
    {/* Personnage, bras légèrement ouverts — louange du matin */}
    <Kid x={22} y={10} armLeft={-35} armRight={35}/>
  </svg>
);

const SceneNuit = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#0E1C3C"/>
    {/* Ciel nocturne */}
    {[[6,5],[14,11],[26,4],[40,7],[50,4],[4,18],[20,22],[36,16],[48,19]].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r={i%3===0?1.4:0.9} fill="#FFFFFF" opacity={0.5+0.4*(i%2)*0.3}/>
    ))}
    {/* Lune */}
    <circle cx="44" cy="12" r="8" fill="#FFF8D0"/>
    <circle cx="48.5" cy="9" r="6.5" fill="#0E1C3C"/>
    {/* Croissant brillant */}
    <path d="M40 7 Q36 12 40 17" fill="none" stroke="#FFF8D0" strokeWidth="0.5" opacity="0.4"/>
    {/* Sol */}
    <rect y="46" width="56" height="10" rx="0" fill="#1A1008"/>
    {/* Personnage invocation du soir */}
    <Kid x={22} y={10} armLeft={-45} armRight={45}/>
  </svg>
);

const SceneEntrerMaison = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E8F0D8"/>
    {/* Ciel */}
    <rect width="56" height="30" rx="12" fill="#C8E8F8" opacity="0.7"/>
    {/* Nuages */}
    <ellipse cx="14" cy="10" rx="9" ry="5" fill="white" opacity="0.8"/>
    <ellipse cx="20" cy="8" rx="7" ry="4" fill="white" opacity="0.8"/>
    {/* Maison */}
    <polygon points="13,26 43,26 43,52 13,52" fill="#FFCC80"/>
    <polygon points="9,28 47,28 28,10" fill="#E05050"/>
    {/* Porte */}
    <rect x="20" y="36" width="12" height="16" rx="2" fill="#8A5020"/>
    <path d="M20 36 Q26 32 32 36" fill="#A06028"/>
    <circle cx="30" cy="44" r="1.5" fill="#FFCC20"/>
    {/* Fenêtre */}
    <rect x="14" y="30" width="9" height="8" rx="1.5" fill="#B8DCF0"/>
    <line x1="18.5" y1="30" x2="18.5" y2="38" stroke="#90B8D0" strokeWidth="0.7"/>
    <line x1="14" y1="34" x2="23" y2="34" stroke="#90B8D0" strokeWidth="0.7"/>
    {/* Sol */}
    <rect y="50" width="56" height="6" rx="0" fill="#A0C870"/>
    {/* Allée */}
    <path d="M22 56 L24 50 L32 50 L34 56 Z" fill="#D8C890"/>
    {/* Personnage approche */}
    <Kid x={9} y={14} armLeft={25} armRight={-20}/>
  </svg>
);

const SceneSortirMaison = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E8F0D8"/>
    <rect width="56" height="30" rx="12" fill="#C8E8F8" opacity="0.7"/>
    <ellipse cx="42" cy="10" rx="9" ry="5" fill="white" opacity="0.8"/>
    <ellipse cx="36" cy="8" rx="7" ry="4" fill="white" opacity="0.8"/>
    {/* Maison */}
    <polygon points="10,26 40,26 40,52 10,52" fill="#CE93D8" opacity="0.8"/>
    <polygon points="6,28 44,28 25,10" fill="#8020A0"/>
    {/* Porte ouverte */}
    <rect x="17" y="36" width="12" height="16" rx="2" fill="#7B1FA2"
          transform="rotate(-20 17 52)"/>
    <circle cx="27" cy="44" r="1.5" fill="#FFCC20"/>
    {/* Fenêtre */}
    <rect x="30" y="30" width="8" height="7" rx="1.5" fill="#B8DCF0"/>
    <line x1="34" y1="30" x2="34" y2="37" stroke="#90B8D0" strokeWidth="0.7"/>
    {/* Sol */}
    <rect y="50" width="56" height="6" rx="0" fill="#A0C870"/>
    <path d="M19 56 L21 50 L29 50 L31 56 Z" fill="#D8C890"/>
    {/* Personnage sort */}
    <Kid x={44} y={14} armLeft={-20} armRight={25} flip={true}/>
  </svg>
);

const SceneAblutions = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E0F0FC"/>
    {/* Carrelage mural */}
    <rect x="26" y="0" width="30" height="56" rx="0" fill="#EEF5FA"/>
    {[0,1,2,3,4].map(row => [0,1].map(col => (
      <rect key={`${row}-${col}`} x={27+col*13} y={row*11} width="12" height="10"
        fill="none" stroke="#D8EAF5" strokeWidth="0.7"/>
    )))}
    {/* Lavabo */}
    <rect x="28" y="28" width="24" height="14" rx="5" fill="#F0F5F8" stroke="#C0D8E8" strokeWidth="1"/>
    {/* Robinet */}
    <rect x="35" y="18" width="10" height="12" rx="3" fill="#C8D8E0" stroke="#A8C0CC" strokeWidth="0.8"/>
    <path d="M37 18 Q40 13 43 18" fill="none" stroke="#A8C0CC" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="40" cy="14" rx="3" ry="1.5" fill="#C8D8E0"/>
    {/* Eau qui coule */}
    <line x1="40" y1="28" x2="39.5" y2="33" stroke="#60B0E8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2,1.5"/>
    <line x1="40" y1="28" x2="40.5" y2="33" stroke="#60B0E8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2,1.5"/>
    {/* Gouttes */}
    <ellipse cx="37" cy="32" rx="1.5" ry="2" fill="#50A8E0" opacity="0.7"/>
    <ellipse cx="43" cy="34" rx="1.5" ry="2" fill="#50A8E0" opacity="0.6"/>
    {/* Sol */}
    <rect y="48" width="56" height="8" rx="0" fill="#B8C8D0" opacity="0.5"/>
    {/* Personnage penché vers le lavabo */}
    <Kid x={18} y={10} armLeft={-50} armRight={50} lean={18}/>
  </svg>
);

const SceneHabits = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FFF8E8"/>
    {/* Armoire / fond chambre */}
    <rect x="36" y="4" width="18" height="40" rx="2" fill="#D8C0A0" stroke="#C0A880" strokeWidth="0.8"/>
    <line x1="45" y1="4" x2="45" y2="44" stroke="#C0A880" strokeWidth="0.6"/>
    <circle cx="43" cy="24" r="1.5" fill="#A08040"/>
    <circle cx="47" cy="24" r="1.5" fill="#A08040"/>
    {/* Thobe flottant (neuf) */}
    <path d="M24 6 L16 14 L18 22 L22 20 L22 42 L36 42 L36 20 L40 22 L42 14 L34 6 Z"
          fill="#F8F9FF" stroke="#D0D0E8" strokeWidth="0.8" opacity="0.95"/>
    <path d="M28 6 Q29 11 30 6" fill="none" stroke="#C8C8DC" strokeWidth="0.8"/>
    {/* Col */}
    <ellipse cx="29" cy="10" rx="3" ry="2" fill="#EDEAE6" stroke="#D8D5D0" strokeWidth="0.5"/>
    {/* Personnage bras levés (enfile le thobe) */}
    <Kid x={24} y={18} armLeft={-85} armRight={85}/>
  </svg>
);

const ScenePluie = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#D8E8F0"/>
    {/* Nuages gris */}
    <ellipse cx="28" cy="12" rx="15" ry="8" fill="#90A0B0"/>
    <ellipse cx="18" cy="14" rx="12" ry="7" fill="#90A0B0"/>
    <ellipse cx="38" cy="14" rx="12" ry="7" fill="#90A0B0"/>
    <ellipse cx="28" cy="17" rx="16" ry="7" fill="#A0B0C0"/>
    {/* Pluie */}
    {[8,14,20,26,32,38,44,50].map((x,i) => (
      <line key={i} x1={x} y1={22+i%3*4} x2={x-3} y2={34+i%3*4}
        stroke="#70A0D0" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    ))}
    {/* Parapluie */}
    <path d="M12 36 Q28 24 44 36 Z" fill="#E84040"/>
    <path d="M14 36 Q28 26 42 36" fill="none" stroke="#C02020" strokeWidth="0.5"/>
    {/* Manche parapluie */}
    <line x1="28" y1="36" x2="28" y2="52" stroke="#6A4020" strokeWidth="2" strokeLinecap="round"/>
    <path d="M26 52 Q28 56 30 52" fill="none" stroke="#6A4020" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Personnage sous le parapluie */}
    <Kid x={28} y={30} armLeft={-55} armRight={-10}/>
    {/* Sol mouillé */}
    <rect y="50" width="56" height="6" rx="0" fill="#8898A8" opacity="0.5"/>
    {/* Flaques */}
    <ellipse cx="12" cy="53" rx="5" ry="1.5" fill="#70A0C0" opacity="0.5"/>
    <ellipse cx="44" cy="53" rx="4" ry="1.5" fill="#70A0C0" opacity="0.4"/>
  </svg>
);

const SceneMaladie = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FCE8F0"/>
    <rect width="56" height="40" rx="12" fill="#FAD8E8" opacity="0.4"/>
    {/* Parquet */}
    <rect y="46" width="56" height="10" rx="0" fill="#C07858"/>
    {/* Lit */}
    <rect x="1" y="34" width="54" height="18" rx="4" fill="#FAFAFA" stroke="#F0C0D0" strokeWidth="0.8"/>
    <rect x="1" y="34" width="54" height="8" rx="4" fill="#F8B0C0"/>
    {/* Oreiller */}
    <ellipse cx="10" cy="38" rx="7.5" ry="3.5" fill="#FCE4EC" stroke="#F4B0C8" strokeWidth="0.7"/>
    {/* Enfant allongé malade */}
    <g transform="translate(32,40)">
      <KidLying shirt="#FCEEF5"/>
    </g>
    {/* Thermomètre */}
    <rect x="42" y="16" width="4.5" height="16" rx="2.2" fill="#FFF0B0" stroke="#E0C020" strokeWidth="0.8"/>
    <circle cx="44.25" cy="32" r="4.5" fill="#FF5050"/>
    <rect x="43.25" y="20" width="2" height="12" rx="1" fill="#FF8080" opacity="0.6"/>
    {/* Médicaments */}
    <rect x="8" y="24" width="10" height="6" rx="3" fill="#FF8888"/>
    <rect x="10" y="24" width="6" height="6" rx="3" fill="#FFAAAA"/>
    <text x="5" y="22" fontSize="8" opacity="0.5">💊</text>
    {/* Étoiles de douleur */}
    <text x="26" y="16" fontSize="7" fill="#F080A0" opacity="0.7">+</text>
    <text x="34" y="12" fontSize="5" fill="#F080A0" opacity="0.6">+</text>
  </svg>
);

const SceneDefaut = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#EEF0FC"/>
    {/* Lumière douce */}
    {[0,60,120,180,240,300].map((a,i) => (
      <line key={i} x1="28" y1="10"
        x2={28+Math.cos(a*Math.PI/180)*18}
        y2={10+Math.sin(a*Math.PI/180)*18}
        stroke="#C8C8F8" strokeWidth="1" opacity="0.4"/>
    ))}
    <circle cx="28" cy="10" r="5" fill="#D0D0F8" opacity="0.5"/>
    {/* Sol */}
    <rect y="48" width="56" height="8" rx="0" fill="#D0C8E8" opacity="0.4"/>
    {/* Mains ouvertes en dua */}
    <ellipse cx="8" cy="40" rx="6" ry="3.5" fill="#F2C08A" transform="rotate(-20 8 40)"/>
    <ellipse cx="48" cy="40" rx="6" ry="3.5" fill="#F2C08A" transform="rotate(20 48 40)"/>
    {/* Personnage en position de invocation (dua) */}
    <Kid x={28} y={8} armLeft={-55} armRight={55}/>
    {/* Particules de lumière */}
    {[[6,14],[50,18],[10,30],[46,28],[28,4]].map(([px,py],i) => (
      <circle key={i} cx={px} cy={py} r="1.5" fill="#A0A0E8" opacity="0.4"/>
    ))}
  </svg>
);

// ── Routeur principal ───────────────────────────────────────────────────
export const InvocationSceneSVG = ({ title }: SceneProps) => {
  const t = title.toLowerCase();

  if (t.includes('réveille') || t.includes('reveille') || t.includes('lever') || t.includes('levé'))
    return <SceneReveille />;
  if (t.includes('couche') || t.includes('coucher') || t.includes('dormir') || t.includes('sommeil'))
    return <SceneCoucher />;
  if (t.includes('mosquée') && (t.includes('entrant') || t.includes('entrer') || t.includes('entré') || t.includes('allant')))
    return <SceneEntrerMosquee />;
  if (t.includes('mosquée') && (t.includes('sortant') || t.includes('sortir')))
    return <SceneSortirMosquee />;
  if (t.includes('avant') && (t.includes('manger') || t.includes('repas')))
    return <SceneAvantManger />;
  if ((t.includes('après') || t.includes('apres')) && (t.includes('manger') || t.includes('mangé') || t.includes('repas')))
    return <SceneApresManger />;
  if ((t.includes('entrant') || t.includes('entrer')) && (t.includes('toilet') || t.includes('wc') || t.includes('salle')))
    return <SceneEntrerToilettes />;
  if ((t.includes('sortant') || t.includes('sortir')) && (t.includes('toilet') || t.includes('wc') || t.includes('salle')))
    return <SceneSortirToilettes />;
  if (t.includes('voiture') || t.includes('véhicule') || t.includes('vehicule') || t.includes('montant dans'))
    return <SceneVoiture />;
  if (t.includes('voyage') || t.includes('transport'))
    return <SceneVoyage />;
  if (t.includes('matin'))
    return <SceneMatin />;
  if (t.includes('nuit') || t.includes('soir') || t.includes('veillée'))
    return <SceneNuit />;
  if (t.includes('maison') && (t.includes('entrant') || t.includes('entrer') || t.includes('entré')))
    return <SceneEntrerMaison />;
  if (t.includes('maison') && (t.includes('sortant') || t.includes('sortir')))
    return <SceneSortirMaison />;
  if (t.includes('ablution'))
    return <SceneAblutions />;
  if (t.includes('habit') || t.includes('vêtement') || t.includes('vetement'))
    return <SceneHabits />;
  if (t.includes('pluie'))
    return <ScenePluie />;
  if (t.includes('maladie') || t.includes('malade'))
    return <SceneMaladie />;
  return <SceneDefaut />;
};

export default InvocationSceneSVG;
