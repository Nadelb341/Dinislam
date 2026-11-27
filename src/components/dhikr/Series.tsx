import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prochainGeste } from '@/lib/dhikr';
import { noterDhikr, useAvancee } from '@/hooks/useDhikr';
import { useConfetti } from '@/hooks/useConfetti';
import type { DhikrGeste } from '@/data/dhikrContenu';
import { Chapelet } from './Chapelet';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import type { Couleurs } from './Ambiance';
import { STATUTS } from './EditeurDhikr';

/** Arabe doré, phonétique en italique, sens (même présentation partout) */
export function TexteDhikr({ arabe, phonetique, sens, ambiance, grand }: { arabe?: string | null; phonetique?: string | null; sens?: string | null; ambiance: Couleurs; grand?: boolean }) {
  const lignes = (t: string) => t.split('\n').filter(Boolean);
  return (
    <div className="space-y-2 text-center">
      {arabe && lignes(arabe).map((l, i) => (
        <p key={i} dir="rtl" lang="ar" className={cn('font-arabic font-bold leading-[2] [overflow-wrap:anywhere]', grand && arabe.length < 140 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl')}
          style={{ color: ambiance.or, textShadow: ambiance.nom === 'nuit' ? '0 0 12px rgba(245,210,122,.3)' : '0 1px 0 rgba(255,255,255,.7)' }}>{l}</p>
      ))}
      {phonetique && lignes(phonetique).map((l, i) => <p key={i} className="italic font-semibold [overflow-wrap:anywhere]">{l}</p>)}
      {sens && <p className="text-sm [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>{sens}</p>}
    </div>
  );
}

export const BadgeStatut = ({ g }: { g: { statut: string; visible: boolean } }) => (
  <>
    {!g.visible && <span className="rounded-full bg-slate-700 text-white px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">🙈 Caché aux élèves</span>}
    {g.statut !== 'ok' && <span className="rounded-full bg-amber-200 text-amber-950 px-2 py-0.5 text-[10px] font-bold [overflow-wrap:anywhere]">{STATUTS[g.statut] ?? g.statut}</span>}
  </>
);

/** Le cercle doré : un point par geste, qui s'allume quand le geste est fait */
function CercleDore({ ids, faits, courant, onChoisir, nuit }: { ids: string[]; faits: string[]; courant: number; onChoisir: (i: number) => void; nuit: boolean }) {
  const n = ids.length;
  return (
    <svg viewBox="0 0 140 140" className="w-28 h-28 sm:w-32 sm:h-32 shrink-0" role="group" aria-label={`${faits.length} gestes faits sur ${n}`}>
      <defs><radialGradient id="dhk-point"><stop offset="0" stopColor="#fff6cf" /><stop offset=".6" stopColor="#f5c542" /><stop offset="1" stopColor="#b8860b" /></radialGradient></defs>
      <circle cx="70" cy="70" r="52" fill="none" stroke="#e3b341" strokeWidth="3" opacity=".85" />
      <circle cx="70" cy="70" r="44" fill={nuit ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.55)'} />
      {ids.map((id, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = 70 + 52 * Math.cos(a), y = 70 + 52 * Math.sin(a);
        const fait = faits.includes(id);
        return (
          <g key={id} onClick={() => onChoisir(i)} className="cursor-pointer" role="button" aria-label={`Geste ${i + 1}${fait ? ', fait' : ''}`}>
            {fait && <circle cx={x} cy={y} r="13" fill="#f5c542" opacity=".35" />}
            <circle cx={x} cy={y} r={i === courant ? 10 : 8} fill={fait ? 'url(#dhk-point)' : nuit ? '#1d2a66' : '#fff'} stroke="#c9961f" strokeWidth={i === courant ? 3 : 2} />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill={fait ? '#5a3d00' : nuit ? '#f5d27a' : '#8a6200'}>{fait ? '✓' : i + 1}</text>
          </g>
        );
      })}
      <text x="70" y="66" textAnchor="middle" fontSize="12" fontWeight="800" fill={nuit ? '#f5d27a' : '#8a6200'}>{faits.length}/{n}</text>
      <text x="70" y="82" textAnchor="middle" fontSize="9" fontWeight="700" fill={nuit ? '#c9d3f5' : '#3b5277'}>gestes</text>
    </svg>
  );
}

const sommeCompteur = (g: DhikrGeste) => (g.compteur?.length ? g.compteur.reduce((s, e) => s + e.nombre, 0) : 1);

/**
 * 🌅🌙 C · Les séries « 5 gestes » (Nadia, 27/11) : le cercle doré, « Geste 2/5 · Ayat al-Kursi », la source ;
 * les gestes comptés se font avec le chapelet ; on reprend là où on s'était arrêté (gardé jusqu'à la fin de la journée).
 * Marche avec le nombre de gestes visibles (3 à 5). Série terminée = 1 ligne en base par jour → points du barème.
 */
export function SerieGestes({ serie, gestes, userId, isAdmin, ambiance, onEditer }: {
  serie: 'matin' | 'soir'; gestes: DhikrGeste[]; userId: string | null; isAdmin: boolean; ambiance: Couleurs;
  onEditer: (g: DhikrGeste) => void;
}) {
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
  const { avancee, ecrire } = useAvancee(userId, serie);
  const intro = gestes.find((g) => g.serie === serie && g.genre === 'intro');
  const liste = useMemo(() => gestes.filter((g) => g.serie === serie && g.genre === 'geste' && g.visible).sort((a, b) => a.position - b.position), [gestes, serie]);
  const final = gestes.find((g) => g.serie === serie && g.genre === 'final' && g.visible);
  const ids = liste.map((g) => g.id);
  const prochain = prochainGeste(ids, avancee.faits);
  const [courant, setCourant] = useState(() => (prochain === -1 ? liste.length : prochain));
  useEffect(() => { if (courant > liste.length) setCourant(liste.length); }, [courant, liste.length]);
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/75 border-white';
  const sousTitre = (intro?.consigne ?? '').replace(/\d+\s+gestes/, `${liste.length} gestes`);

  const faire = (g: DhikrGeste) => {
    const faits = avancee.faits.includes(g.id) ? avancee.faits : [...avancee.faits, g.id];
    ecrire({ ...avancee, faits });
    const p = prochainGeste(ids, faits);
    setCourant(p === -1 ? liste.length : p);
  };
  const defaire = (g: DhikrGeste) => ecrire({ ...avancee, faits: avancee.faits.filter((x) => x !== g.id), finie: false });
  const terminer = async () => {
    const nombre = liste.reduce((s, g) => s + sommeCompteur(g), 0) + (final ? 1 : 0);
    ecrire({ ...avancee, finie: true });
    fireConfetti();
    toast.success(`🤲 Qu'Allah accepte ta série ${serie === 'matin' ? 'du matin' : 'du soir'} ! ✨`);
    await noterDhikr(userId, { moment: serie, nombre, journee: `serie:${serie}`, serie, dhikr: { cle: `serie:${serie}`, titre: serie === 'matin' ? 'Série du matin' : 'Série du soir' } });
  };

  const g = liste[courant];
  return (
    <div className="space-y-3">
      <div className={cn('flex items-center gap-3 rounded-3xl border p-3', carte)}>
        <CercleDore ids={ids} faits={avancee.faits} courant={courant} onChoisir={setCourant} nuit={nuit} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-black [overflow-wrap:anywhere]">{intro?.titre ?? (serie === 'matin' ? 'La série du matin' : 'La série du soir')}{sousTitre && <span className="font-semibold"> · {sousTitre}</span>}</h2>
          {g ? <p className="text-sm font-bold mt-1 [overflow-wrap:anywhere]" style={{ color: ambiance.or }}>Geste {courant + 1}/{liste.length} · {g.titre}</p>
            : <p className="text-sm font-bold mt-1" style={{ color: ambiance.or }}>{avancee.finie ? '✅ Série faite aujourd\'hui, ma shâ\' Allah' : 'Tous les gestes sont faits ✨'}</p>}
          {g?.source && <p className="text-xs mt-0.5" style={{ color: ambiance.doux }}>📚 {g.source} <PastilleSource source={g.source} degre={g.degre} divergence={g.degre_divergence} compact className="ml-1" /></p>}
          {isAdmin && intro && <button type="button" onClick={() => onEditer(intro)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold underline"><Pencil className="h-3 w-3" /> Titre de la série</button>}
        </div>
      </div>
      {!liste.length && <p className="text-center font-bold">🛠️ En cours de mise à jour</p>}

      {g && (
        <div key={g.id} className={cn('dhk-apparait rounded-3xl border p-4 space-y-3', carte)}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold flex-1 min-w-0 [overflow-wrap:anywhere]">{g.titre}</h3>
            {isAdmin && <BadgeStatut g={g} />}
            {isAdmin && <button type="button" onClick={() => onEditer(g)} aria-label="Modifier ce geste" className="h-8 w-8 grid place-items-center rounded-full bg-white text-slate-800 border shadow-sm"><Pencil className="h-4 w-4" /></button>}
          </div>
          {g.consigne && <p className="text-sm font-semibold [overflow-wrap:anywhere]">{g.consigne}</p>}
          {g.compteur?.length ? (
            <>
              {g.arabe && <details className="rounded-2xl border border-amber-300/60 p-2"><summary className="cursor-pointer text-sm font-bold">📖 Le texte en entier</summary><TexteDhikr arabe={g.arabe} phonetique={g.phonetique} sens={g.sens} ambiance={ambiance} /></details>}
              <Chapelet key={g.id} etapes={g.compteur} merite={g.merite} source={g.source} degre={g.degre} divergence={g.degre_divergence} ambiance={ambiance}
                onTerminer={() => faire(g)} libelleTerminer={courant + 1 < liste.length ? 'Geste suivant ›' : 'Terminer la série ›'} />
            </>
          ) : (
            <>
              <TexteDhikr arabe={g.arabe} phonetique={g.phonetique} sens={g.sens} ambiance={ambiance} grand />
              {g.merite && <p className="text-sm text-center [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>✨ {g.merite}{g.source && <b className="whitespace-nowrap"> — {g.source}</b>}{g.source && <PastilleSource source={g.source} degre={g.degre} divergence={g.degre_divergence} compact className="ml-1" />}</p>}
              <div className="flex flex-wrap justify-center gap-2">
                {g.lien && <button type="button" onClick={() => navigate(g.lien!)} className="rounded-full border-2 border-amber-400 bg-white text-slate-900 px-4 py-2 text-sm font-bold">📖 Ouvrir dans l'appli</button>}
                {avancee.faits.includes(g.id)
                  ? <button type="button" onClick={() => defaire(g)} className="rounded-full border bg-white/80 text-slate-700 px-4 py-2 text-sm font-bold">↩️ Pas encore fait</button>
                  : <button type="button" onClick={() => faire(g)} className="rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2.5 font-extrabold shadow active:scale-95">✅ C'est fait</button>}
              </div>
            </>
          )}
        </div>
      )}

      {!g && liste.length > 0 && (
        <div className={cn('dhk-apparait rounded-3xl border p-4 space-y-3 text-center', carte)}>
          {final && (
            <>
              <h3 className="text-base sm:text-lg font-extrabold [overflow-wrap:anywhere]">{final.titre}
                {isAdmin && <button type="button" onClick={() => onEditer(final)} aria-label="Modifier l'invocation de la fin" className="ml-2 inline-grid h-7 w-7 place-items-center rounded-full bg-white text-slate-800 border align-middle"><Pencil className="h-3.5 w-3.5" /></button>}
              </h3>
              <TexteDhikr arabe={final.arabe} phonetique={final.phonetique} sens={final.sens} ambiance={ambiance} grand />
              {final.merite && <p className="text-sm [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>✨ {final.merite}{final.source && <b className="whitespace-nowrap"> — {final.source}</b>}{final.source && <PastilleSource source={final.source} degre={final.degre} divergence={final.degre_divergence} compact className="ml-1" />}</p>}
            </>
          )}
          {avancee.finie
            ? <p className="text-lg font-black">🤲 Qu'Allah accepte ta série ✨</p>
            : <button type="button" onClick={terminer} className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 px-6 py-3 text-lg font-black shadow-lg active:scale-95">🤲 J'ai fini ma série</button>}
        </div>
      )}
    </div>
  );
}

/** Le soleil qui se lève en 3 temps (Nadia : pas de schéma de nœuds) — 0, 1, 2 ou 3 gestes faits */
function SoleilQuiSeLeve({ n }: { n: number }) {
  const ciels = [['#0b1640', '#26346f'], ['#2b2f6e', '#c76a6a'], ['#5f7fc4', '#ffb067'], ['#8fd0ff', '#fff1c7']];
  const [haut, bas] = ciels[Math.min(3, n)];
  const y = [128, 104, 80, 56][Math.min(3, n)];
  return (
    <svg viewBox="0 0 320 150" className="w-full h-auto rounded-3xl" role="img" aria-label={`Le soleil se lève : ${n} geste${n > 1 ? 's' : ''} sur 3`}>
      <defs>
        <linearGradient id="dhk-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={haut} style={{ transition: 'stop-color 1s' }} /><stop offset="1" stopColor={bas} style={{ transition: 'stop-color 1s' }} /></linearGradient>
        <radialGradient id="dhk-soleil"><stop offset="0" stopColor="#fffbe0" /><stop offset=".55" stopColor="#ffd25a" /><stop offset="1" stopColor="#f59e0b" /></radialGradient>
        <radialGradient id="dhk-lueur"><stop offset="0" stopColor="#ffe9a8" stopOpacity=".8" /><stop offset="1" stopColor="#ffe9a8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="320" height="150" fill="url(#dhk-ciel)" />
      {n === 0 && [[40, 20], [90, 40], [150, 18], [230, 34], [280, 16], [200, 60]].map(([x, yy], i) => <circle key={i} cx={x} cy={yy} r="1.6" fill="#fff" opacity=".85" />)}
      <g style={{ transform: `translateY(${y}px)`, transition: 'transform 1.1s cubic-bezier(.2,.8,.2,1)' }}>
        <circle cx="160" cy="0" r="56" fill="url(#dhk-lueur)" opacity={n ? 1 : 0.2} />
        {n >= 3 && Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return <line key={i} x1={160 + 30 * Math.cos(a)} y1={30 * Math.sin(a)} x2={160 + 42 * Math.cos(a)} y2={42 * Math.sin(a)} stroke="#ffd25a" strokeWidth="3" strokeLinecap="round" />; })}
        <circle cx="160" cy="0" r="24" fill="url(#dhk-soleil)" />
      </g>
      {/* Les collines et la mosquée */}
      <path d="M0 122 Q60 104 120 118 T240 114 T320 120 V150 H0 Z" fill={n >= 2 ? '#6aa27a' : '#1b2a55'} style={{ transition: 'fill 1s' }} />
      <path d="M0 134 Q80 120 170 132 T320 130 V150 H0 Z" fill={n >= 2 ? '#4f8a62' : '#131f45'} style={{ transition: 'fill 1s' }} />
      <g fill={n >= 2 ? '#3d5f8f' : '#0d1533'} style={{ transition: 'fill 1s' }}>
        <rect x="246" y="96" width="5" height="32" /><path d="M245 97 L248.5 86 L252 97 Z" />
        <path d="M258 128 V112 Q258 98 272 95 Q286 98 286 112 V128 Z" /><rect x="254" y="114" width="36" height="14" />
      </g>
    </svg>
  );
}

/**
 * ☀️ F · Chaque matin, 3 gestes du réveil (Bukhari 1142, Mouslim 776) : un soleil qui se lève en 3 temps (pas de nœuds),
 * l'élève coche chaque geste ; bonus : les 10 derniers versets d'Âl 'Imrân. Gardé sur l'appareil jusqu'à la fin de la journée.
 */
export function ReveilTroisGestes({ gestes, userId, isAdmin, ambiance, onEditer }: {
  gestes: DhikrGeste[]; userId: string | null; isAdmin: boolean; ambiance: Couleurs; onEditer: (g: DhikrGeste) => void;
}) {
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
  const { avancee, ecrire } = useAvancee(userId, 'reveil');
  const intro = gestes.find((g) => g.serie === 'reveil' && g.genre === 'intro');
  const liste = gestes.filter((g) => g.serie === 'reveil' && g.genre === 'geste' && g.visible).sort((a, b) => a.position - b.position);
  const bonus = gestes.find((g) => g.serie === 'reveil' && g.genre === 'bonus' && g.visible);
  const faits = liste.filter((g) => avancee.faits.includes(g.id)).length;
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/75 border-white';

  const basculer = async (g: DhikrGeste) => {
    const deja = avancee.faits.includes(g.id);
    const l = deja ? avancee.faits.filter((x) => x !== g.id) : [...avancee.faits, g.id];
    const tous = liste.every((x) => l.includes(x.id));
    ecrire({ ...avancee, faits: l, finie: tous || avancee.finie });
    if (!deja && tous && !avancee.finie) {
      fireConfetti();
      toast.success('☀️ Tous les nœuds sont défaits : belle journée, in shâ\' Allah !');
      await noterDhikr(userId, { moment: 'reveil', nombre: liste.length, journee: 'serie:reveil', serie: 'reveil', dhikr: { cle: 'serie:reveil', titre: 'Série du réveil' } });
    }
  };

  return (
    <div className="space-y-3">
      <div className={cn('rounded-3xl border p-3 space-y-2', carte)}>
        <div className="flex items-start gap-2">
          <h2 className="flex-1 min-w-0 text-lg sm:text-xl font-black [overflow-wrap:anywhere]">{intro?.titre ?? 'Chaque matin, 3 gestes du réveil'}</h2>
          {isAdmin && intro && <button type="button" onClick={() => onEditer(intro)} aria-label="Modifier le texte" className="h-8 w-8 grid place-items-center rounded-full bg-white text-slate-800 border"><Pencil className="h-4 w-4" /></button>}
        </div>
        <SoleilQuiSeLeve n={faits} />
        {intro?.consigne && <p className="text-sm [overflow-wrap:anywhere]">{intro.consigne}{intro.source && <b className="whitespace-nowrap"> — {intro.source}</b>}{intro.source && <PastilleSource source={intro.source} degre={intro.degre} divergence={intro.degre_divergence} compact className="ml-1" />}</p>}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {liste.map((g, i) => {
          const fait = avancee.faits.includes(g.id);
          return (
            <div key={g.id} className={cn('rounded-3xl border-2 p-3 space-y-2 transition', fait ? 'border-amber-400 bg-amber-100/90 text-amber-950' : carte)}>
              <div className="flex items-start gap-2">
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-black', fait ? 'bg-amber-400 text-amber-950' : 'bg-white text-slate-800 border')}>{fait ? '☀️' : i + 1}</span>
                <h3 className="flex-1 min-w-0 font-extrabold [overflow-wrap:anywhere]">{g.titre}</h3>
                {isAdmin && <button type="button" onClick={() => onEditer(g)} aria-label="Modifier ce geste" className="h-7 w-7 grid place-items-center rounded-full bg-white text-slate-800 border"><Pencil className="h-3.5 w-3.5" /></button>}
              </div>
              {g.consigne && <p className="text-sm [overflow-wrap:anywhere]">{g.consigne}</p>}
              {(g.arabe || g.phonetique) && <TexteDhikr arabe={g.arabe} phonetique={g.phonetique} sens={g.sens} ambiance={fait ? { ...ambiance, or: '#8a5a00', doux: '#5a3d00' } : ambiance} />}
              {g.merite && <p className="text-xs font-bold">✨ {g.merite}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => basculer(g)} aria-pressed={fait}
                  className={cn('rounded-full px-4 py-2 text-sm font-extrabold shadow active:scale-95', fait ? 'bg-white text-amber-900 border border-amber-400' : 'bg-amber-500 text-amber-950')}>
                  {fait ? '↩️ Pas encore' : '✅ C\'est fait'}
                </button>
                {g.lien && <button type="button" onClick={() => navigate(g.lien!)} className="rounded-full border bg-white text-slate-800 px-3 py-2 text-sm font-bold">Ouvrir ›</button>}
              </div>
            </div>
          );
        })}
      </div>
      {bonus && (
        <div className={cn('rounded-3xl border p-3 space-y-2', carte)}>
          <div className="flex items-start gap-2">
            <h3 className="flex-1 min-w-0 font-extrabold [overflow-wrap:anywhere]">🎁 {bonus.titre}</h3>
            {isAdmin && <button type="button" onClick={() => onEditer(bonus)} aria-label="Modifier le bonus" className="h-7 w-7 grid place-items-center rounded-full bg-white text-slate-800 border"><Pencil className="h-3.5 w-3.5" /></button>}
          </div>
          {bonus.consigne && <p className="text-sm [overflow-wrap:anywhere]">{bonus.consigne}</p>}
          <TexteDhikr arabe={bonus.arabe} phonetique={bonus.phonetique} sens={bonus.sens} ambiance={ambiance} />
          {bonus.merite && <p className="text-xs [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>✨ {bonus.merite}{bonus.source && <b className="whitespace-nowrap"> — {bonus.source}</b>}{bonus.source && <PastilleSource source={bonus.source} degre={bonus.degre} divergence={bonus.degre_divergence} compact className="ml-1" />}</p>}
          {bonus.lien && <button type="button" onClick={() => navigate(bonus.lien!)} className="rounded-full border-2 border-amber-400 bg-white text-slate-900 px-4 py-2 text-sm font-bold">📖 Lire dans le Coran</button>}
        </div>
      )}
    </div>
  );
}
