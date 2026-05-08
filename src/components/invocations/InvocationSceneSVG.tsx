// Illustrations SVG pour chaque invocation
// Personnage enfant sans visage (face beige, pas d'yeux/nez/bouche)

interface SceneProps {
  title: string;
}

// Personnage debout de face
const Kid = ({
  x = 28, y = 10,
  shirt = '#5B9BD5', pants = '#2C4A7C',
  armLeft = 0, armRight = 0, // angle bras en degrés
  lean = 0, // inclinaison corps
}: {
  x?: number; y?: number;
  shirt?: string; pants?: string;
  armLeft?: number; armRight?: number;
  lean?: number;
}) => (
  <g transform={`translate(${x},${y}) rotate(${lean} 0 18)`}>
    {/* Cheveux */}
    <ellipse cx="0" cy="-2" rx="7.5" ry="8" fill="#3D2B1F"/>
    {/* Visage beige — sans yeux/nez/bouche */}
    <ellipse cx="0" cy="2" rx="7" ry="8" fill="#F4C89A"/>
    {/* Cou */}
    <rect x="-2.5" y="9" width="5" height="4" fill="#F4C89A"/>
    {/* Corps */}
    <rect x="-7" y="12" width="14" height="13" rx="2" fill={shirt}/>
    {/* Bras gauche */}
    <g transform={`rotate(${armLeft} -7 14)`}>
      <rect x="-11" y="12" width="5" height="11" rx="2.5" fill={shirt}/>
      <rect x="-11.5" y="22" width="5" height="4" rx="2" fill="#F4C89A"/>
    </g>
    {/* Bras droit */}
    <g transform={`rotate(${armRight} 7 14)`}>
      <rect x="6" y="12" width="5" height="11" rx="2.5" fill={shirt}/>
      <rect x="6.5" y="22" width="5" height="4" rx="2" fill="#F4C89A"/>
    </g>
    {/* Jambe gauche */}
    <rect x="-7" y="24" width="6" height="12" rx="2.5" fill={pants}/>
    {/* Jambe droite */}
    <rect x="1" y="24" width="6" height="12" rx="2.5" fill={pants}/>
    {/* Chaussures */}
    <ellipse cx="-4" cy="36.5" rx="4" ry="2.5" fill="#3D2B1F"/>
    <ellipse cx="4" cy="36.5" rx="4" ry="2.5" fill="#3D2B1F"/>
  </g>
);

// ──────────────────────────────────────────────
// Scènes
// ──────────────────────────────────────────────

const SceneReveille = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    {/* Fond bleu ciel */}
    <rect width="56" height="56" rx="12" fill="#C8E6FA"/>
    {/* Fenêtre avec soleil */}
    <rect x="33" y="6" width="17" height="16" rx="2" fill="#FFF9C4"/>
    <rect x="33" y="6" width="17" height="16" rx="2" fill="none" stroke="#B0BEC5" strokeWidth="1"/>
    {/* Rayons soleil */}
    {[0,45,90,135,180,225,270,315].map((a,i) => (
      <line key={i} x1="41.5" y1="14"
        x2={41.5 + Math.cos(a*Math.PI/180)*9}
        y2={14 + Math.sin(a*Math.PI/180)*9}
        stroke="#FFCA28" strokeWidth="1.5" strokeLinecap="round"/>
    ))}
    <circle cx="41.5" cy="14" r="5" fill="#FFCA28"/>
    {/* Lit */}
    <rect x="2" y="38" width="35" height="14" rx="4" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="1"/>
    <rect x="2" y="38" width="35" height="6" rx="4" fill="#EF9A9A"/>
    {/* Oreiller */}
    <ellipse cx="12" cy="41" rx="8" ry="4" fill="#FAFAFA" stroke="#CFD8DC" strokeWidth="0.8"/>
    {/* Enfant assis dans le lit, bras levés (étirement) */}
    <Kid x="22" y="14" shirt="#FF8A65" pants="#5D4037" armLeft={-70} armRight={70}/>
  </svg>
);

const SceneCoucher = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#BBDEFB"/>
    {/* Lune + étoiles */}
    <path d="M44 8 Q50 14 44 20 Q38 14 44 8Z" fill="#FFF176"/>
    <circle cx="36" cy="7" r="1.5" fill="#FFF176"/>
    <circle cx="50" cy="10" r="1" fill="#FFF176"/>
    <circle cx="42" cy="22" r="1" fill="#FFF176"/>
    {/* Lit */}
    <rect x="2" y="36" width="52" height="16" rx="4" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1"/>
    <rect x="2" y="36" width="52" height="7" rx="4" fill="#90CAF9"/>
    {/* Oreiller */}
    <ellipse cx="12" cy="39.5" rx="8" ry="4" fill="#FAFAFA" stroke="#CFD8DC" strokeWidth="0.8"/>
    {/* Enfant allongé (couché sur le côté) */}
    <g transform="translate(28,40) rotate(-90)">
      <ellipse cx="0" cy="-2" rx="6" ry="7" fill="#3D2B1F"/>
      <ellipse cx="0" cy="2" rx="6" ry="7" fill="#F4C89A"/>
      <rect x="-5" y="8" width="10" height="10" rx="2" fill="#7986CB"/>
      <rect x="-4" y="18" width="4" height="8" rx="2" fill="#3949AB"/>
      <rect x="0" y="18" width="4" height="8" rx="2" fill="#3949AB"/>
    </g>
    {/* ZZZ */}
    <text x="40" y="30" fontSize="8" fill="#90CAF9" fontWeight="bold">z</text>
    <text x="44" y="24" fontSize="6" fill="#90CAF9" fontWeight="bold">z</text>
    <text x="47" y="20" fontSize="5" fill="#90CAF9" fontWeight="bold">z</text>
  </svg>
);

const SceneEntrerMosquee = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#F3E5F5"/>
    {/* Mosquée simplifiée */}
    <rect x="28" y="18" width="24" height="32" fill="#CE93D8"/>
    {/* Dôme */}
    <ellipse cx="40" cy="18" rx="10" ry="8" fill="#BA68C8"/>
    {/* Minaret */}
    <rect x="46" y="8" width="5" height="18" fill="#AB47BC"/>
    <ellipse cx="48.5" cy="8" rx="3" ry="2" fill="#9C27B0"/>
    {/* Porte mosquée */}
    <rect x="35" y="30" width="10" height="20" rx="5" fill="#7B1FA2"/>
    {/* Étoile */}
    <text x="38" y="24" fontSize="7" fill="#FFF176">★</text>
    {/* Enfant qui marche vers la mosquée */}
    <Kid x="18" y="18" shirt="#66BB6A" pants="#2E7D32" armLeft={30} armRight={-30}/>
    {/* Flèche directionnelle subtile */}
    <path d="M23 46 L27 43 L27 45 L31 45 L31 47 L27 47 L27 49Z" fill="#CE93D8" opacity="0.6"/>
  </svg>
);

const SceneSortirMosquee = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#F8BBD0"/>
    {/* Mosquée */}
    <rect x="2" y="18" width="24" height="32" fill="#F48FB1"/>
    <ellipse cx="14" cy="18" rx="10" ry="8" fill="#F06292"/>
    <rect x="2" y="8" width="5" height="18" fill="#EC407A"/>
    <ellipse cx="4.5" cy="8" rx="3" ry="2" fill="#E91E63"/>
    <rect x="9" y="30" width="10" height="20" rx="5" fill="#C2185B"/>
    <text x="11" y="24" fontSize="7" fill="#FFF176">★</text>
    {/* Enfant qui sort, bras levés (joie) */}
    <Kid x="38" y="18" shirt="#FF7043" pants="#BF360C" armLeft={-60} armRight={60}/>
    {/* Mains en prière */}
    <text x="32" y="56" fontSize="8">🤲</text>
  </svg>
);

const SceneAvantManger = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E8F5E9"/>
    {/* Table */}
    <rect x="14" y="38" width="32" height="4" rx="2" fill="#A1887F"/>
    <rect x="16" y="42" width="4" height="10" rx="1" fill="#8D6E63"/>
    <rect x="36" y="42" width="4" height="10" rx="1" fill="#8D6E63"/>
    {/* Assiette */}
    <ellipse cx="30" cy="38" rx="9" ry="4" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1"/>
    <ellipse cx="30" cy="38" rx="6" ry="2.5" fill="#FFCCBC"/>
    {/* Nourriture */}
    <circle cx="28" cy="37.5" r="2" fill="#A5D6A7"/>
    <circle cx="32" cy="37.5" r="2" fill="#EF9A9A"/>
    {/* Verre */}
    <rect x="40" y="32" width="5" height="8" rx="1" fill="#B3E5FC" opacity="0.8" stroke="#81D4FA" strokeWidth="0.8"/>
    {/* Enfant assis */}
    <Kid x="30" y="10" shirt="#42A5F5" pants="#1565C0" armLeft={20} armRight={-20} lean={0}/>
  </svg>
);

const SceneApresManger = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#F1F8E9"/>
    {/* Table */}
    <rect x="14" y="38" width="32" height="4" rx="2" fill="#A1887F"/>
    <rect x="16" y="42" width="4" height="10" rx="1" fill="#8D6E63"/>
    <rect x="36" y="42" width="4" height="10" rx="1" fill="#8D6E63"/>
    {/* Assiette vide */}
    <ellipse cx="30" cy="38" rx="9" ry="4" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1"/>
    <ellipse cx="30" cy="38" rx="6" ry="2.5" fill="#F5F5F5"/>
    {/* Fourchette et couteau croisés (repas terminé) */}
    <line x1="27" y1="36" x2="29" y2="40" stroke="#90A4AE" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="29" y1="36" x2="27" y2="40" stroke="#90A4AE" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Main sur ventre = bras courbé */}
    <Kid x="30" y="10" shirt="#8D6E63" pants="#4E342E" armLeft={0} armRight={-40}/>
    {/* Étoiles de satisfaction */}
    <text x="8" y="20" fontSize="8" opacity="0.7">✨</text>
    <text x="44" y="18" fontSize="6" opacity="0.6">✨</text>
  </svg>
);

const SceneEntrerToilettes = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E3F2FD"/>
    {/* Mur salle de bain */}
    <rect x="28" y="4" width="24" height="48" fill="#ECEFF1"/>
    {/* Carrelage */}
    {[0,1,2,3].map(row => [0,1].map(col => (
      <rect key={`${row}-${col}`} x={29+col*11} y={5+row*11} width="10" height="10"
        fill="none" stroke="#CFD8DC" strokeWidth="0.5"/>
    )))}
    {/* Porte */}
    <rect x="34" y="20" width="16" height="32" rx="2" fill="#BDBDBD"/>
    <rect x="34" y="20" width="16" height="32" rx="2" fill="none" stroke="#9E9E9E" strokeWidth="1"/>
    <circle cx="36" cy="36" r="1.5" fill="#757575"/>
    {/* Toilettes visibles */}
    <ellipse cx="42" cy="46" rx="5" ry="3" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="0.8"/>
    {/* Enfant qui avance vers la porte */}
    <Kid x="18" y="18" shirt="#26C6DA" pants="#00838F" armLeft={30} armRight={-30}/>
  </svg>
);

const SceneSortirToilettes = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E0F7FA"/>
    {/* Porte ouverte */}
    <rect x="2" y="10" width="24" height="42" fill="#ECEFF1"/>
    {[0,1,2,3].map(row => [0,1].map(col => (
      <rect key={`${row}-${col}`} x={3+col*11} y={11+row*11} width="10" height="10"
        fill="none" stroke="#CFD8DC" strokeWidth="0.5"/>
    )))}
    <rect x="4" y="18" width="14" height="30" rx="2" fill="#BDBDBD" transform="rotate(-30 11 33)"/>
    <circle cx="17" cy="33" r="1.5" fill="#757575"/>
    {/* Robinet / eau (mains lavées) */}
    <rect x="34" y="22" width="18" height="10" rx="3" fill="#B0BEC5"/>
    <path d="M40 22 Q43 16 46 22" fill="none" stroke="#B0BEC5" strokeWidth="2"/>
    {/* Gouttes d'eau */}
    <ellipse cx="38" cy="20" rx="1.5" ry="2" fill="#81D4FA" opacity="0.8"/>
    <ellipse cx="43" cy="18" rx="1.5" ry="2" fill="#81D4FA" opacity="0.8"/>
    {/* Enfant qui sort, bras levés */}
    <Kid x="28" y="16" shirt="#4CAF50" pants="#2E7D32" armLeft={-55} armRight={55}/>
  </svg>
);

const SceneVoiture = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FFF3E0"/>
    {/* Route */}
    <rect x="0" y="42" width="56" height="10" fill="#78909C"/>
    <rect x="0" y="42" width="56" height="2" fill="#90A4AE"/>
    {/* Pointillés route */}
    {[0,1,2,3].map(i => (
      <rect key={i} x={4+i*14} y="46" width="8" height="2" rx="1" fill="#FFF59D"/>
    ))}
    {/* Voiture */}
    <rect x="20" y="30" width="30" height="14" rx="3" fill="#EF5350"/>
    <rect x="24" y="24" width="22" height="10" rx="3" fill="#E53935"/>
    {/* Vitres */}
    <rect x="26" y="25.5" width="8" height="7" rx="1.5" fill="#B3E5FC" opacity="0.9"/>
    <rect x="36" y="25.5" width="8" height="7" rx="1.5" fill="#B3E5FC" opacity="0.9"/>
    {/* Roues */}
    <circle cx="27" cy="44" r="5" fill="#37474F"/>
    <circle cx="27" cy="44" r="2.5" fill="#78909C"/>
    <circle cx="43" cy="44" r="5" fill="#37474F"/>
    <circle cx="43" cy="44" r="2.5" fill="#78909C"/>
    {/* Enfant à côté de la voiture */}
    <Kid x="10" y="16" shirt="#42A5F5" pants="#1A237E" armLeft={0} armRight={-20}/>
  </svg>
);

const SceneVoyage = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E8EAF6"/>
    {/* Nuages */}
    <ellipse cx="38" cy="12" rx="10" ry="6" fill="white"/>
    <ellipse cx="44" cy="10" rx="8" ry="5" fill="white"/>
    <ellipse cx="30" cy="11" rx="7" ry="5" fill="white"/>
    {/* Avion */}
    <g transform="translate(20,20) rotate(-15)">
      <rect x="0" y="5" width="22" height="7" rx="3.5" fill="#5C6BC0"/>
      <polygon points="16,5 22,0 22,5" fill="#3949AB"/>
      <rect x="5" y="0" width="10" height="5" rx="2" fill="#7986CB"/>
      <rect x="8" y="12" width="7" height="4" rx="1" fill="#7986CB"/>
      {/* Hublots */}
      <circle cx="7" cy="8.5" r="1.5" fill="#B3E5FC"/>
      <circle cx="12" cy="8.5" r="1.5" fill="#B3E5FC"/>
    </g>
    {/* Valise */}
    <rect x="2" y="40" width="12" height="10" rx="2" fill="#8D6E63"/>
    <rect x="5" y="37" width="6" height="4" rx="1" fill="#795548"/>
    <line x1="2" y1="45" x2="14" y2="45" stroke="#6D4C41" strokeWidth="0.8"/>
    {/* Enfant avec valise */}
    <Kid x="18" y="20" shirt="#EC407A" pants="#880E4F" armLeft={40} armRight={10}/>
  </svg>
);

const SceneMatin = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FFF9C4"/>
    {/* Soleil levant */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
      <line key={i} x1="40" y1="14"
        x2={40 + Math.cos(a*Math.PI/180)*12}
        y2={14 + Math.sin(a*Math.PI/180)*12}
        stroke="#FFCA28" strokeWidth="1.5" strokeLinecap="round"/>
    ))}
    <circle cx="40" cy="14" r="8" fill="#FFEE58"/>
    {/* Sol */}
    <rect x="0" y="48" width="56" height="8" fill="#C8E6C9"/>
    {/* Herbe */}
    {[4,10,16,22,28,34,40,46,52].map(x => (
      <line key={x} x1={x} y1="48" x2={x-2} y2="44" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round"/>
    ))}
    {/* Enfant debout, bras légèrement ouverts */}
    <Kid x="24" y="14" shirt="#26A69A" pants="#004D40" armLeft={-30} armRight={30}/>
  </svg>
);

const SceneNuit = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#1A237E"/>
    {/* Étoiles */}
    {[[8,8],[15,15],[30,6],[44,12],[50,7],[6,22],[20,28]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1.2" fill="#FFF176"/>
    ))}
    {/* Lune */}
    <path d="M44 8 Q52 16 44 24 Q36 16 44 8Z" fill="#FFF176"/>
    {/* Lit */}
    <rect x="2" y="38" width="52" height="14" rx="4" fill="#4A148C"/>
    <rect x="2" y="38" width="52" height="7" rx="4" fill="#6A1B9A"/>
    {/* Oreiller */}
    <ellipse cx="10" cy="41.5" rx="7" ry="3.5" fill="#CE93D8" stroke="#AB47BC" strokeWidth="0.8"/>
    {/* Enfant allongé */}
    <g transform="translate(30,42) rotate(-90)">
      <ellipse cx="0" cy="-2" rx="6" ry="7" fill="#3D2B1F"/>
      <ellipse cx="0" cy="2" rx="6" ry="7" fill="#F4C89A"/>
      <rect x="-5.5" y="8.5" width="11" height="11" rx="2" fill="#9C27B0"/>
      <rect x="-5" y="19" width="4.5" height="7" rx="2" fill="#6A1B9A"/>
      <rect x="0.5" y="19" width="4.5" height="7" rx="2" fill="#6A1B9A"/>
    </g>
  </svg>
);

const SceneEntrerMaison = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E8F5E9"/>
    {/* Ciel */}
    <rect x="0" y="0" width="56" height="30" rx="12" fill="#BBDEFB"/>
    <circle cx="40" cy="12" r="6" fill="#FFF9C4"/>
    {/* Maison */}
    <polygon points="15,26 41,26 41,50 15,50" fill="#FFCC80"/>
    <polygon points="11,28 45,28 28,10" fill="#EF5350"/>
    {/* Porte */}
    <rect x="22" y="36" width="12" height="14" rx="2" fill="#8D6E63"/>
    <circle cx="32" cy="43" r="1.2" fill="#FFCA28"/>
    {/* Fenêtre */}
    <rect x="15" y="32" width="8" height="7" rx="1" fill="#B3E5FC"/>
    <line x1="19" y1="32" x2="19" y2="39" stroke="#90CAF9" strokeWidth="0.8"/>
    {/* Sol */}
    <rect x="0" y="50" width="56" height="6" fill="#A5D6A7"/>
    {/* Enfant qui marche vers la porte */}
    <Kid x="10" y="20" shirt="#FF8A65" pants="#5D4037" armLeft={25} armRight={-25}/>
  </svg>
);

const SceneSortirMaison = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#F3E5F5"/>
    {/* Ciel */}
    <rect x="0" y="0" width="56" height="30" rx="12" fill="#E1F5FE"/>
    <circle cx="10" cy="12" r="6" fill="#FFF9C4"/>
    {/* Maison */}
    <polygon points="12,26 40,26 40,50 12,50" fill="#CE93D8"/>
    <polygon points="8,28 44,28 26,10" fill="#9C27B0"/>
    {/* Porte ouverte */}
    <rect x="19" y="36" width="12" height="14" rx="2" fill="#7B1FA2" transform="rotate(-30 19 50)"/>
    <circle cx="29" cy="43" r="1.2" fill="#FFCA28"/>
    {/* Fenêtre */}
    <rect x="29" y="32" width="8" height="7" rx="1" fill="#B3E5FC"/>
    <line x1="33" y1="32" x2="33" y2="39" stroke="#90CAF9" strokeWidth="0.8"/>
    {/* Sol */}
    <rect x="0" y="50" width="56" height="6" fill="#CE93D8"/>
    {/* Enfant qui sort */}
    <Kid x="44" y="20" shirt="#AB47BC" pants="#4A148C" armLeft={-25} armRight={25}/>
  </svg>
);

const SceneAblutions = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E3F2FD"/>
    {/* Lavabo */}
    <rect x="28" y="32" width="22" height="12" rx="4" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="1"/>
    {/* Robinet */}
    <rect x="35" y="24" width="8" height="10" rx="2" fill="#B0BEC5"/>
    <path d="M37 24 L37 20 Q39 18 41 20 L41 24" fill="none" stroke="#90A4AE" strokeWidth="1.5"/>
    {/* Eau qui coule */}
    <line x1="39" y1="30" x2="38" y2="35" stroke="#64B5F6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,1"/>
    <line x1="39" y1="30" x2="40" y2="35" stroke="#64B5F6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,1"/>
    {/* Gouttes */}
    <ellipse cx="36" cy="34" rx="1.5" ry="2" fill="#42A5F5" opacity="0.7"/>
    <ellipse cx="41" cy="36" rx="1.5" ry="2" fill="#42A5F5" opacity="0.7"/>
    {/* Enfant penché vers le lavabo */}
    <Kid x="20" y="14" shirt="#29B6F6" pants="#0277BD" armLeft={-45} armRight={45} lean={15}/>
  </svg>
);

const SceneHabits = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FFF8E1"/>
    {/* T-shirt flottant */}
    <path d="M30 12 L22 18 L24 24 L28 22 L28 38 L42 38 L42 22 L46 24 L48 18 L40 12 Z"
      fill="#FF8A65" stroke="#E64A19" strokeWidth="0.8"/>
    {/* Col */}
    <path d="M34 12 Q35 16 36 12" fill="none" stroke="#E64A19" strokeWidth="0.8"/>
    {/* Enfant bras levés (met le t-shirt) */}
    <Kid x="22" y="22" shirt="#F5F5F5" pants="#5D4037" armLeft={-80} armRight={80}/>
  </svg>
);

const ScenePluie = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#ECEFF1"/>
    {/* Nuage */}
    <ellipse cx="28" cy="14" rx="14" ry="8" fill="#90A4AE"/>
    <ellipse cx="20" cy="16" rx="10" ry="7" fill="#90A4AE"/>
    <ellipse cx="36" cy="16" rx="10" ry="7" fill="#90A4AE"/>
    <ellipse cx="28" cy="18" rx="14" ry="6" fill="#B0BEC5"/>
    {/* Pluie */}
    {[14,20,26,32,38,44].map((x,i) => (
      <line key={i} x1={x} y1={22+i%2*4} x2={x-2} y2={32+i%2*4}
        stroke="#64B5F6" strokeWidth="1.2" strokeLinecap="round"/>
    ))}
    {/* Parapluie */}
    <ellipse cx="28" cy="36" rx="14" ry="6" fill="#EF5350"/>
    <line x1="28" y1="36" x2="28" y2="52" stroke="#795548" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M26 52 Q28 55 30 52" fill="none" stroke="#795548" strokeWidth="1.5"/>
    {/* Enfant sous parapluie */}
    <Kid x="28" y="36" shirt="#FF7043" pants="#BF360C"/>
  </svg>
);

const SceneMaladie = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#FCE4EC"/>
    {/* Lit */}
    <rect x="2" y="36" width="52" height="16" rx="4" fill="#FAFAFA" stroke="#F48FB1" strokeWidth="1"/>
    <rect x="2" y="36" width="52" height="7" rx="4" fill="#F8BBD0"/>
    {/* Oreiller */}
    <ellipse cx="10" cy="40" rx="7" ry="3.5" fill="#FCE4EC" stroke="#F48FB1" strokeWidth="0.8"/>
    {/* Enfant allongé malade */}
    <g transform="translate(30,41) rotate(-90)">
      <ellipse cx="0" cy="-2" rx="6" ry="7" fill="#3D2B1F"/>
      <ellipse cx="0" cy="2" rx="6" ry="7" fill="#F4C89A"/>
      <rect x="-5.5" y="8.5" width="11" height="11" rx="2" fill="#EF9A9A"/>
      <rect x="-5" y="19" width="4.5" height="7" rx="2" fill="#E57373"/>
      <rect x="0.5" y="19" width="4.5" height="7" rx="2" fill="#E57373"/>
    </g>
    {/* Thermomètre */}
    <rect x="40" y="20" width="4" height="14" rx="2" fill="#FFCC02" stroke="#FFA000" strokeWidth="0.8"/>
    <circle cx="42" cy="34" r="4" fill="#FF5252"/>
    {/* Petites étoiles/points de douleur */}
    <text x="6" y="32" fontSize="10">💊</text>
    <text x="26" y="18" fontSize="8" fill="#F48FB1">+</text>
    <text x="34" y="14" fontSize="6" fill="#F48FB1">+</text>
  </svg>
);

const SceneDefaut = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="12" fill="#E8EAF6"/>
    {/* Particules de lumière */}
    {[[8,10],[48,8],[6,38],[50,42],[28,6]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1.5" fill="#9FA8DA" opacity="0.6"/>
    ))}
    {/* Enfant en position de prière (mains tendues) */}
    <Kid x="28" y="12" shirt="#5C6BC0" pants="#283593" armLeft={-50} armRight={50}/>
    {/* Mains ouvertes */}
    <ellipse cx="10" cy="40" rx="5" ry="3" fill="#F4C89A" transform="rotate(-30 10 40)"/>
    <ellipse cx="46" cy="40" rx="5" ry="3" fill="#F4C89A" transform="rotate(30 46 40)"/>
    {/* Lumière divine */}
    {[0,60,120,180,240,300].map((a,i) => (
      <line key={i} x1="28" y1="6"
        x2={28 + Math.cos(a*Math.PI/180)*6}
        y2={6 + Math.sin(a*Math.PI/180)*6}
        stroke="#FFD54F" strokeWidth="0.8" opacity="0.7"/>
    ))}
    <circle cx="28" cy="6" r="3" fill="#FFD54F" opacity="0.5"/>
  </svg>
);

// ──────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────

export const InvocationSceneSVG = ({ title }: SceneProps) => {
  const t = title.toLowerCase();

  if (t.includes('réveille') || t.includes('reveille') || t.includes('lever') || t.includes('levé'))
    return <SceneReveille />;
  if (t.includes('couche') || t.includes('coucher') || t.includes('dormir') || t.includes('sommeil'))
    return <SceneCoucher />;
  if (t.includes('mosquée') && (t.includes('entrant') || t.includes('entrer') || t.includes('entré')))
    return <SceneEntrerMosquee />;
  if (t.includes('mosquée') && (t.includes('sortant') || t.includes('sortir')))
    return <SceneSortirMosquee />;
  if (t.includes('avant') && (t.includes('manger') || t.includes('repas')))
    return <SceneAvantManger />;
  if (t.includes('après') && (t.includes('manger') || t.includes('mangé') || t.includes('repas')))
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
