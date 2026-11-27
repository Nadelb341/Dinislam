import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  avancee, compteARebours, couleurAvancee, dureeEcran, ecransHistoire, enCapitales, facteurPolice, texteVoix, tiretsRemplis, type Besoin,
} from '@/lib/besoinAllah';
import { arreterVoix, dire } from '@/lib/voixFabriquees';

/**
 * ▶️ Histoire animée « Besoin d'Allah » (choix K de Nadia, 27/11, d'après les vidéos « Dhikr Chaque Jour ») :
 * nuit bleu marine étoilée, accueil → noms un par un dans un cercle pointillé → verset ou hadith de fin.
 * Tout est DESSINÉ ici (aucun fichier vidéo) : léger, et lisible sans Internet.
 * Toucher l'écran = écran suivant ; ⏯ lecture automatique ; ↺ recommencer ; ✕ quitter. Voix (option) : le français seulement.
 * `prefers-reduced-motion` : plus rien ne bouge (sauf réglage « animations toujours » de l'appli).
 */

// Étoiles et particules à des places FIXES (même ciel à chaque fois, pas de hasard pendant l'affichage)
function suite(n: number, graine: number) {
  let s = graine;
  return Array.from({ length: n }, () => { s = (s * 9301 + 49297) % 233280; return s / 233280; });
}
const ETOILES = (() => {
  const a = suite(70, 7), b = suite(70, 13), c = suite(70, 29);
  return a.map((x, i) => ({ x: x * 100, y: b[i] * 100, r: 0.4 + c[i] * 1.1, d: (c[i] * 4).toFixed(2) }));
})();
const PARTICULES = (() => {
  const a = suite(16, 41), b = suite(16, 53);
  return a.map((x, i) => ({ x: 6 + x * 88, d: (b[i] * 9).toFixed(2), t: (9 + b[i] * 7).toFixed(2), s: 2 + Math.round(b[i] * 3) }));
})();

const STYLE = `
@keyframes ba-scintille { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
@keyframes ba-monte { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: .9 } 100% { transform: translateY(-70vh); opacity: 0 } }
@keyframes ba-tourne { to { transform: rotate(360deg) } }
@keyframes ba-pouls { to { stroke-dashoffset: -240 } }
@keyframes ba-apparait { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }
@keyframes ba-lueur { 0%,100% { text-shadow: 0 0 18px rgba(253,224,140,.55), 0 0 42px rgba(245,180,60,.35) } 50% { text-shadow: 0 0 26px rgba(253,224,140,.85), 0 0 60px rgba(245,180,60,.5) } }
.ba-etoile { animation: ba-scintille 3.6s ease-in-out infinite; }
.ba-particule { animation: ba-monte linear infinite; }
.ba-orbite { animation: ba-tourne 9s linear infinite; }
.ba-cercle { animation: ba-tourne 60s linear infinite; }
.ba-ecg { stroke-dasharray: 240; animation: ba-pouls 2.4s linear infinite; }
.ba-entree { animation: ba-apparait .55s ease-out both; }
.ba-lueur { animation: ba-lueur 3.2s ease-in-out infinite; }
.ba-couleur { transition: color .9s ease, background-color .9s ease, stroke .9s ease, border-color .9s ease; }
@media (prefers-reduced-motion: reduce) {
  html:not(.anime-toujours) .ba-etoile, html:not(.anime-toujours) .ba-particule, html:not(.anime-toujours) .ba-orbite,
  html:not(.anime-toujours) .ba-cercle, html:not(.anime-toujours) .ba-ecg, html:not(.anime-toujours) .ba-entree,
  html:not(.anime-toujours) .ba-lueur { animation: none !important; }
  html:not(.anime-toujours) .ba-particule { display: none; }
  html:not(.anime-toujours) .ba-couleur { transition: none; }
}
`;

/** Ligne de battement de cœur (électrocardiogramme), répétée sur toute la largeur */
function LigneCoeur({ couleur }: { couleur: string }) {
  const motif = 'M0 20 H30 L36 12 L42 26 L48 4 L54 34 L60 20 H120';
  return (
    <svg viewBox="0 0 240 40" className="w-full h-7 sm:h-9 paysage:h-5" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${motif} M120 20 H150 L156 12 L162 26 L168 4 L174 34 L180 20 H240`} fill="none" stroke={couleur} strokeOpacity="0.25" strokeWidth="1.6" />
      <path d={`${motif} M120 20 H150 L156 12 L162 26 L168 4 L174 34 L180 20 H240`} fill="none" stroke={couleur} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="ba-ecg ba-couleur" style={{ filter: `drop-shadow(0 0 4px ${couleur})` }} />
    </svg>
  );
}

export function HistoireBesoin({ besoin, onClose }: { besoin: Besoin; onClose: () => void }) {
  const ecrans = useMemo(() => ecransHistoire(besoin), [besoin]);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [voix, setVoix] = useState(false);
  const n = ecrans.length;
  const ecran = ecrans[Math.min(index, n - 1)];
  const couleur = couleurAvancee(avancee(index, n));
  const chiffre = compteARebours(index, n);
  const derniere = index >= n - 1;

  const suivant = useCallback(() => setIndex((i) => Math.min(i + 1, n - 1)), [n]);
  const precedent = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  // ⏯ Lecture automatique : quelques secondes par écran, s'arrête sur la fin
  useEffect(() => {
    if (!auto) return;
    if (derniere) { setAuto(false); return; }
    const t = window.setTimeout(suivant, dureeEcran(ecran));
    return () => window.clearTimeout(t);
  }, [auto, derniere, ecran, suivant]);

  // 🔊 Voix (option) : en français seulement (sens des noms, accroche, traduction) — jamais le Coran par une voix de synthèse
  useEffect(() => {
    if (!voix) return;
    dire(texteVoix(ecran, besoin), 'fr', null);
  }, [voix, ecran, besoin]);
  useEffect(() => () => arreterVoix(), []);

  // ⌨️ Ordinateur : flèches et espace
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); suivant(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); precedent(); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [suivant, precedent]);

  const fermer = () => { arreterVoix(); onClose(); };
  const recommencer = () => { setIndex(0); };
  const bouton = 'h-11 min-w-11 px-3 rounded-full text-sm font-bold text-white bg-white/15 border border-white/35 shadow-[0_2px_10px_rgba(0,0,0,0.45)] hover:bg-white/25 active:scale-95 transition';

  return (
    <Dialog open onOpenChange={(o) => { if (!o) fermer(); }}>
      <DialogContent level="nested" aria-describedby={undefined}
        className="max-w-none w-screen h-[100dvh] max-h-[100dvh] paysage:max-h-[100dvh] p-0 border-0 rounded-none sm:rounded-none gap-0 overflow-hidden text-white"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #14285a 0%, #0b1838 45%, #050b1f 100%)' }}>
        <style>{STYLE}</style>
        <DialogTitle className="sr-only">Les noms d'Allah — {besoin.titre}</DialogTitle>
        <DialogDescription className="sr-only">Touche l'écran pour passer au nom suivant.</DialogDescription>

        {/* ✨ Ciel étoilé + particules dorées (rien de cliquable) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {ETOILES.map((e, i) => (
            <circle key={i} cx={`${e.x}%`} cy={`${e.y}%`} r={e.r} fill="#fff" className="ba-etoile" style={{ animationDelay: `${e.d}s` }} />
          ))}
        </svg>
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {PARTICULES.map((p, i) => (
            <span key={i} className="ba-particule absolute bottom-0 rounded-full"
              style={{ left: `${p.x}%`, width: p.s, height: p.s, background: '#f8d77a', boxShadow: '0 0 8px #f5c451', animationDuration: `${p.t}s`, animationDelay: `${p.d}s` }} />
          ))}
        </div>

        {/* Toute la surface (sauf les boutons) = « suivant » */}
        <button type="button" onClick={suivant} aria-label="Écran suivant"
          className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none" />

        <div className="relative z-10 h-full flex flex-col pointer-events-none px-4 pt-12 pb-4 paysage:pt-2 paysage:pb-2 max-w-3xl mx-auto w-full">
          {/* En haut : émotion en petites capitales, chiffre qui descend, tirets, battement de cœur */}
          <div className="space-y-1.5 paysage:space-y-0.5 pr-10">
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs sm:text-sm font-bold tracking-[0.25em] ba-couleur min-w-0 [overflow-wrap:anywhere]" style={{ color: couleur }}>
                {besoin.emoji} {enCapitales(besoin.titre)}
              </p>
              <p className="text-3xl sm:text-4xl paysage:text-2xl font-extrabold tabular-nums leading-none ba-couleur" style={{ color: couleur }} aria-label={`${chiffre}`}>
                {chiffre}
              </p>
            </div>
            <div className="flex gap-1" aria-hidden="true">
              {tiretsRemplis(index, n).map((plein, i) => (
                <span key={i} className="h-1 flex-1 rounded-full ba-couleur" style={{ background: plein ? couleur : 'rgba(255,255,255,0.18)' }} />
              ))}
            </div>
            <LigneCoeur couleur={couleur} />
          </div>

          {/* Au centre : l'écran en cours */}
          <div key={index} className="ba-entree flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-3 paysage:gap-1 py-2">
            {ecran.type === 'accueil' && (
              <>
                <p className="text-sm sm:text-base font-bold tracking-[0.3em] text-[#f5d27a]">LES NOMS D'ALLAH</p>
                <p className="font-arabic text-3xl sm:text-4xl paysage:text-2xl text-[#f8e3a6] ba-lueur">أسماء الله الحسنى</p>
                <p className="text-2xl sm:text-4xl paysage:text-xl font-bold leading-snug max-w-xl [overflow-wrap:anywhere]">{besoin.accroche}</p>
                <p className="text-xl sm:text-3xl paysage:text-lg font-bold leading-snug text-[#f5c451] max-w-xl [overflow-wrap:anywhere]">{besoin.accroche_doree}</p>
              </>
            )}

            {ecran.type === 'nom' && (
              <>
                <div className="relative grid place-items-center shrink-0 w-[min(76vw,46dvh,340px)] h-[min(76vw,46dvh,340px)] paysage:w-[36dvh] paysage:h-[36dvh]">
                  {/* Cercle pointillé qui tourne très lentement */}
                  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full ba-cercle" aria-hidden="true">
                    <circle cx="100" cy="100" r="92" fill="none" stroke={couleur} strokeOpacity="0.75" strokeWidth="1.4" strokeDasharray="2 6" strokeLinecap="round" className="ba-couleur" />
                    <circle cx="100" cy="100" r="84" fill="none" stroke="#f5d27a" strokeOpacity="0.25" strokeWidth="0.8" />
                  </svg>
                  {/* Petite étoile filante qui fait le tour du cercle */}
                  <div className="absolute inset-0 ba-orbite" aria-hidden="true">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        <linearGradient id="ba-trainee" x1="0" x2="1">
                          <stop offset="0" stopColor="#fff6d6" stopOpacity="0" />
                          <stop offset="1" stopColor="#fff6d6" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      <path d="M100 8 A92 92 0 0 1 150 23" fill="none" stroke="url(#ba-trainee)" strokeWidth="2.4" strokeLinecap="round" transform="rotate(-38 100 100)" />
                      <circle cx="100" cy="8" r="3.2" fill="#fffbe8" style={{ filter: 'drop-shadow(0 0 4px #ffe9a8)' }} />
                    </svg>
                  </div>
                  {/* Taille selon le mot le plus long : le nom tient dans le cercle sans jamais être coupé au milieu d'un mot */}
                  <p dir="rtl" className="font-arabic font-bold leading-tight text-[#fdf1c7] ba-lueur px-4 break-normal text-[length:calc(min(76vw,46dvh,340px)*var(--f))] paysage:text-[length:calc(36dvh*var(--f))]"
                    style={{ '--f': facteurPolice(ecran.nom.arabe) } as CSSProperties}>
                    {ecran.nom.arabe}
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl paysage:text-xl font-bold text-white [overflow-wrap:anywhere]">{ecran.nom.phonetique}</p>
                <p className="text-xs sm:text-sm font-bold tracking-[0.18em] max-w-md ba-couleur [overflow-wrap:anywhere]" style={{ color: couleur }}>
                  {enCapitales(ecran.nom.sens)}
                </p>
                <p className="text-sm font-bold text-white/70 tabular-nums">{ecran.numero}/{ecran.total}</p>
              </>
            )}

            {ecran.type === 'fin' && (
              <>
                {besoin.fin_arabe && (
                  <p dir="rtl" className="font-arabic text-3xl sm:text-4xl paysage:text-2xl leading-loose text-[#fdf1c7] ba-lueur max-w-2xl [overflow-wrap:anywhere]">
                    {besoin.fin_arabe}
                  </p>
                )}
                {besoin.fin_phonetique && <p className="text-base sm:text-lg paysage:text-sm italic text-[#f5d27a] max-w-xl [overflow-wrap:anywhere]">{besoin.fin_phonetique}</p>}
                {besoin.fin_traduction && <p className="text-lg sm:text-2xl paysage:text-base font-bold leading-snug max-w-xl [overflow-wrap:anywhere]">«{'\u00a0'}{besoin.fin_traduction}{'\u00a0'}»</p>}
                {besoin.fin_source && <p className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#f5c451]">{enCapitales(besoin.fin_source)}</p>}
                <p className="text-sm text-white/75 pt-2 paysage:pt-0">Un nom d'Allah chaque jour</p>
              </>
            )}
          </div>

          {/* En bas : boutons (seuls éléments cliquables au-dessus de la surface « suivant ») */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button type="button" className={bouton} onClick={precedent} disabled={index === 0} aria-label="Écran précédent"
              style={index === 0 ? { opacity: 0.4 } : undefined}>‹</button>
            <button type="button" className={bouton} onClick={() => setAuto((a) => !a)} aria-label={auto ? 'Mettre en pause' : 'Lecture automatique'}>
              {auto ? '⏸ Pause' : '⏵ Auto'}
            </button>
            <button type="button" className={bouton} onClick={() => setVoix((v) => { if (v) arreterVoix(); return !v; })}
              aria-label={voix ? 'Couper la voix' : 'Activer la voix'} aria-pressed={voix}>
              {voix ? '🔊 Voix' : '🔇 Voix'}
            </button>
            <button type="button" className={bouton} onClick={recommencer} aria-label="Recommencer">↺ Recommencer</button>
            {derniere ? (
              <button type="button" onClick={fermer} className="h-11 px-4 rounded-full text-sm font-bold text-[#1a1203] bg-[#f5c451] border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.45)] active:scale-95">
                Terminer
              </button>
            ) : (
              <button type="button" onClick={suivant} className="h-11 px-4 rounded-full text-sm font-bold text-[#1a1203] bg-[#f5c451] border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.45)] active:scale-95">
                Suivant ›
              </button>
            )}
          </div>
          {index === 0 && !auto && <p className="text-center text-xs text-white/60 pt-2 paysage:pt-1">Touche l'écran pour avancer, ou ⏵ Auto</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
