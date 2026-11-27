import type { CleChapelet } from '@/lib/dhikr';

/**
 * 📿 Les 8 chapelets choisis par Nadia (27/11), dessinés en SVG (dégradés radiaux + reflets) : aucun fichier image,
 * très légers, marchent hors ligne. Chaque dessin reçoit un `uid` (identifiants de dégradés uniques par chapelet affiché).
 */
export const FIL: Record<CleChapelet, string> = {
  traditionnel: '#cdb88f', nacre: '#d9b98a', emeraude: '#c8a24a', dore: '#d4a62a',
  turquoise: '#b98d4a', bois: '#8a5a2b', minimaliste: '#b9ab92', celeste: '#c9a646',
};
/** Couleurs du pompon (gland) : fil clair, fil foncé */
export const POMPON: Record<CleChapelet, [string, string]> = {
  traditionnel: ['#f4ead2', '#b89d6a'], nacre: ['#f6eef8', '#b7a6c9'], emeraude: ['#34d399', '#065f46'], dore: ['#ffe08a', '#a8780f'],
  turquoise: ['#67e8f9', '#0e7490'], bois: ['#c08a55', '#5c3517'], minimaliste: ['#e9dfcc', '#a89878'], celeste: ['#8ea2ff', '#1e2a78'],
};

export function DefsPerles({ uid, style }: { uid: string; style: CleChapelet }) {
  const g = (id: string) => `${uid}-${id}`;
  switch (style) {
    case 'traditionnel':
      return (<defs>
        <radialGradient id={g('p')} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fffdf6" /><stop offset=".55" stopColor="#efe3c6" /><stop offset="1" stopColor="#bfa978" /></radialGradient>
      </defs>);
    case 'nacre':
      return (<defs>
        {/* 27/11 (2ᵉ demande) : vraie NACRE crème, brillante et irisée (reflets rosés / dorés), jamais mate */}
        <radialGradient id={g('p')} cx="36%" cy="30%" r="80%"><stop offset="0" stopColor="#ffffff" /><stop offset=".22" stopColor="#fffaf2" /><stop offset=".5" stopColor="#f8eadc" /><stop offset=".74" stopColor="#ecd6c2" /><stop offset=".92" stopColor="#d6b99c" /><stop offset="1" stopColor="#b8977a" /></radialGradient>
        <linearGradient id={g('i')} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#ffc9d9" stopOpacity=".55" /><stop offset=".35" stopColor="#ffe6b8" stopOpacity=".38" /><stop offset=".62" stopColor="#e9f6ee" stopOpacity=".18" /><stop offset="1" stopColor="#f6d2ea" stopOpacity=".45" /></linearGradient>
        <radialGradient id={g('b')} cx="50%" cy="88%" r="55%"><stop offset="0" stopColor="#fff6e3" stopOpacity=".85" /><stop offset="1" stopColor="#fff6e3" stopOpacity="0" /></radialGradient>
      </defs>);
    case 'emeraude':
      return (<defs>
        <linearGradient id={g('p')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8ef0c4" /><stop offset=".45" stopColor="#10a36f" /><stop offset="1" stopColor="#064e3b" /></linearGradient>
        <linearGradient id={g('f')} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d1fae5" stopOpacity=".9" /><stop offset="1" stopColor="#34d399" stopOpacity=".1" /></linearGradient>
      </defs>);
    case 'dore':
      return (<defs>
        <radialGradient id={g('p')} cx="34%" cy="28%" r="80%"><stop offset="0" stopColor="#fffbe0" /><stop offset=".3" stopColor="#ffe27a" /><stop offset=".65" stopColor="#d9a21f" /><stop offset="1" stopColor="#7a5508" /></radialGradient>
      </defs>);
    case 'turquoise':
      return (<defs>
        <radialGradient id={g('p')} cx="36%" cy="30%" r="78%"><stop offset="0" stopColor="#c9fbff" /><stop offset=".45" stopColor="#3cc4c9" /><stop offset="1" stopColor="#0d6b66" /></radialGradient>
      </defs>);
    case 'bois':
      return (<defs>
        <radialGradient id={g('p')} cx="38%" cy="32%" r="78%"><stop offset="0" stopColor="#e2b685" /><stop offset=".5" stopColor="#a8693a" /><stop offset="1" stopColor="#5e3416" /></radialGradient>
      </defs>);
    case 'minimaliste':
      return (<defs>
        <linearGradient id={g('p')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1e9da" /><stop offset="1" stopColor="#d6c7ac" /></linearGradient>
      </defs>);
    case 'celeste':
      return (<defs>
        <radialGradient id={g('p')} cx="36%" cy="30%" r="80%"><stop offset="0" stopColor="#5b7cff" /><stop offset=".5" stopColor="#22307f" /><stop offset="1" stopColor="#090d2e" /></radialGradient>
      </defs>);
  }
}

/** Une perle dessinée autour de (0, 0), rayon r. `n` = numéro de la perle (varie les veines du bois / de la turquoise) */
export function Perle({ uid, style, r, n = 0 }: { uid: string; style: CleChapelet; r: number; n?: number }) {
  const g = (id: string) => `url(#${uid}-${id})`;
  const reflet = <ellipse cx={-r * 0.34} cy={-r * 0.38} rx={r * 0.32} ry={r * 0.2} fill="#fff" opacity=".75" transform={`rotate(-28 ${-r * 0.34} ${-r * 0.38})`} />;
  const petitReflet = <circle cx={r * 0.38} cy={r * 0.36} r={r * 0.09} fill="#fff" opacity=".35" />;
  const sens = n % 2 ? 1 : -1;
  switch (style) {
    case 'traditionnel':
      return <g><circle r={r} fill={g('p')} stroke="#a8915f" strokeOpacity=".35" strokeWidth=".8" />{reflet}{petitReflet}</g>;
    case 'nacre':
      return (<g>
        <circle r={r} fill={g('p')} />
        <circle r={r} fill={g('i')} />
        {/* Lumière renvoyée par le bas (effet perle) + liseré clair */}
        <circle r={r} fill={g('b')} />
        <circle r={r * 0.97} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth={Math.max(0.9, r * 0.06)} />
        <circle r={r} fill="none" stroke="#a88566" strokeOpacity=".35" strokeWidth=".8" />
        {/* Reflet blanc principal, net, et 2 petits éclats */}
        <ellipse cx={-r * 0.32} cy={-r * 0.4} rx={r * 0.36} ry={r * 0.22} fill="#fff" opacity=".92" transform={`rotate(-30 ${-r * 0.32} ${-r * 0.4})`} />
        <circle cx={-r * 0.46} cy={-r * 0.46} r={r * 0.09} fill="#fff" />
        <ellipse cx={r * 0.4} cy={r * 0.42} rx={r * 0.16} ry={r * 0.08} fill="#fff" opacity=".55" transform={`rotate(-30 ${r * 0.4} ${r * 0.42})`} />
      </g>);
    case 'emeraude': {
      // Perle facettée : un octogone et ses facettes
      const pts = Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 8) + (i * Math.PI) / 4; return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`; }).join(' ');
      const inner = Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 8) + (i * Math.PI) / 4; return `${(r * 0.55 * Math.cos(a)).toFixed(2)},${(r * 0.55 * Math.sin(a)).toFixed(2)}`; }).join(' ');
      return (<g>
        <polygon points={pts} fill={g('p')} stroke="#064e3b" strokeOpacity=".5" strokeWidth=".8" />
        <polygon points={inner} fill={g('f')} opacity=".55" />
        <path d={`M${-r * 0.92} ${-r * 0.38} L${-r * 0.5} ${-r * 0.2} M${r * 0.38} ${-r * 0.92} L${r * 0.2} ${-r * 0.5}`} stroke="#ecfdf5" strokeOpacity=".7" strokeWidth=".9" />
        <circle cx={-r * 0.3} cy={-r * 0.35} r={r * 0.14} fill="#fff" opacity=".85" />
      </g>);
    }
    case 'dore':
      return <g><circle r={r} fill={g('p')} stroke="#7a5508" strokeOpacity=".4" strokeWidth=".8" />{reflet}<circle cx={-r * 0.38} cy={-r * 0.42} r={r * 0.1} fill="#fff" /><path d={`M${r * 0.15} ${r * 0.7} q${r * 0.35} ${-r * 0.1} ${r * 0.55} ${-r * 0.45}`} stroke="#fff3b0" strokeOpacity=".55" strokeWidth="1.1" fill="none" /></g>;
    case 'turquoise':
      return (<g>
        <circle r={r} fill={g('p')} />
        <path d={`M${-r * 0.8} ${sens * r * 0.1} q${r * 0.4} ${-sens * r * 0.35} ${r * 0.75} ${sens * r * 0.05} t${r * 0.75} ${-sens * r * 0.2}`} stroke="#3a3328" strokeOpacity=".55" strokeWidth=".9" fill="none" />
        <path d={`M${-r * 0.2} ${r * 0.85} q${r * 0.1} ${-r * 0.4} ${r * 0.5} ${-r * 0.55}`} stroke="#3a3328" strokeOpacity=".45" strokeWidth=".7" fill="none" />
        {reflet}
      </g>);
    case 'bois':
      return (<g>
        <circle r={r} fill={g('p')} />
        {[-0.45, 0, 0.45].map((k, i) => <path key={i} d={`M${-r * 0.9} ${r * k + sens * r * 0.08} Q0 ${r * k - sens * r * 0.25} ${r * 0.9} ${r * k + sens * r * 0.06}`} stroke="#4a2810" strokeOpacity=".38" strokeWidth=".8" fill="none" />)}
        <ellipse cx={-r * 0.3} cy={-r * 0.4} rx={r * 0.26} ry={r * 0.14} fill="#fff" opacity=".35" transform={`rotate(-25 ${-r * 0.3} ${-r * 0.4})`} />
      </g>);
    case 'minimaliste':
      return <g><ellipse rx={r} ry={r * 0.74} fill={g('p')} stroke="#b3a487" strokeOpacity=".6" strokeWidth=".8" /></g>;
    case 'celeste':
      return (<g>
        <circle r={r} fill={g('p')} stroke="#c9a646" strokeOpacity=".5" strokeWidth=".7" />
        {[[0.35, -0.1, 0.07], [-0.2, 0.45, 0.06], [0.05, 0.15, 0.045], [0.5, 0.4, 0.05]].map(([x, y, s], i) => <circle key={i} cx={r * x} cy={r * y} r={r * s} fill="#fff" opacity=".9" />)}
        <path d={`M${-r * 0.38} ${-r * 0.55} l${r * 0.06} ${r * 0.14} l${r * 0.14} ${r * 0.06} l${-r * 0.14} ${r * 0.06} l${-r * 0.06} ${r * 0.14} l${-r * 0.06} ${-r * 0.14} l${-r * 0.14} ${-r * 0.06} l${r * 0.14} ${-r * 0.06} z`} fill="#fff4c4" opacity=".95" />
      </g>);
  }
}

/** Le pompon (gland) au bout du chapelet, accroché en (0, 0) et qui pend vers le bas */
export function Pompon({ uid, style, taille = 1 }: { uid: string; style: CleChapelet; taille?: number }) {
  const [clair, fonce] = POMPON[style];
  const s = taille;
  return (
    <g>
      {/* La grosse perle « imam » allongée, puis la coiffe et les fils */}
      <ellipse cx="0" cy={16 * s} rx={7 * s} ry={12 * s} fill={`url(#${uid}-p)`} stroke={fonce} strokeOpacity=".35" strokeWidth=".8" />
      <ellipse cx={-2.4 * s} cy={11 * s} rx={2 * s} ry={3.4 * s} fill="#fff" opacity=".6" />
      <path d={`M${-5 * s} ${30 * s} h${10 * s} l${-1.5 * s} ${5 * s} h${-7 * s} z`} fill={fonce} />
      {Array.from({ length: 9 }, (_, i) => {
        const x = (-6 + i * 1.5) * s;
        return <path key={i} d={`M${x * 0.5} ${35 * s} Q${x * 0.9} ${50 * s} ${x * 1.25} ${66 * s}`} stroke={i % 2 ? clair : fonce} strokeWidth={1.6 * s} strokeLinecap="round" fill="none" />;
      })}
      <path d={`M${-5 * s} ${40 * s} h${10 * s}`} stroke={clair} strokeWidth={1.8 * s} strokeLinecap="round" />
    </g>
  );
}

/** Petit aperçu d'un chapelet (pour le choix) */
export function ApercuChapelet({ style, uid }: { style: CleChapelet; uid: string }) {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-auto" aria-hidden>
      <DefsPerles uid={uid} style={style} />
      <path d="M8 14 Q60 92 112 14" stroke={FIL[style]} strokeWidth="1.4" fill="none" />
      {[0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map((t, i) => {
        const x = (1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 60 + t * t * 112;
        const y = (1 - t) * (1 - t) * 14 + 2 * (1 - t) * t * 92 + t * t * 14;
        return <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><Perle uid={uid} style={style} r={7.5} n={i} /></g>;
      })}
      <g transform="translate(8 14) scale(.42)"><Pompon uid={uid} style={style} /></g>
    </svg>
  );
}
