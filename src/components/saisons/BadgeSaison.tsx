import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EMOJI_SAISON, nomBadge, type Saison } from '@/lib/saisons';
import { IMAGES_AUTOMNE } from './dessinsAutomne';

/**
 * 🏆 Badge de la saison sur l'accueil de l'élève (choix de Nadia, 2026-11-03/04), sous la carte Progrès :
 * « 🍂 Badge de l'automne : 6 jours sur 15 » avec une barre, puis la médaille « Élève de l'automne 2026 » une fois gagné
 * (avec des félicitations une seule fois) et la collection des badges des saisons passées.
 * Un jour d'activité = un jour où l'élève a ouvert au moins une carte de l'accueil. Le serveur recompte et donne le badge
 * (fonction claim_season_badge) : impossible de se l'attribuer soi-même.
 */
interface Etat { season_key: string; saison: Saison; days: number; required: number; earned_at: string | null; end_day: string }

const COULEURS: Record<Saison, { fond: string; bord: string; texte: string; barre: string }> = {
  automne: { fond: 'linear-gradient(90deg,#fff3e0,#fbe2c2)', bord: '#e2c08f', texte: '#7a3d17', barre: 'linear-gradient(90deg,#e07b2e,#b5562b)' },
  hiver: { fond: 'linear-gradient(90deg,#eef5fd,#dfeafa)', bord: '#bcd3ee', texte: '#1e3a8a', barre: 'linear-gradient(90deg,#8db4ee,#3f6fb5)' },
  printemps: { fond: 'linear-gradient(90deg,#fdf0f6,#f6e3ee)', bord: '#efc2d8', texte: '#8a2c5a', barre: 'linear-gradient(90deg,#f39cc4,#d2558f)' },
  ete: { fond: 'linear-gradient(90deg,#fff9e0,#fdeec0)', bord: '#f0d27a', texte: '#7a5a10', barre: 'linear-gradient(90deg,#f6c453,#e09a1a)' },
};

export function Medaille({ saison, taille = 44 }: { saison: Saison; taille?: number }) {
  const c = COULEURS[saison];
  return (
    <svg viewBox="0 0 60 60" width={taille} height={taille} aria-hidden className="shrink-0">
      <path d="M18 2h10l4 18H22zM32 2h10l-4 18H28z" fill={saison === 'hiver' ? '#3f6fb5' : '#b5562b'} />
      <circle cx="30" cy="36" r="22" fill="#f6c453" stroke={c.texte} strokeWidth="2.5" />
      <circle cx="30" cy="36" r="17" fill="#fff4dc" stroke="#e0a33a" strokeWidth="1.4" strokeDasharray="3 3" />
      {saison === 'automne'
        ? <g transform="translate(15 21) scale(.62)" dangerouslySetInnerHTML={{ __html: IMAGES_AUTOMNE.feuilles.svg }} />
        : <text x="30" y="43" textAnchor="middle" fontSize="18">{EMOJI_SAISON[saison]}</text>}
    </svg>
  );
}

export function BadgeSaison({ userId, required }: { userId: string; required: number }) {
  const { data: e } = useQuery({
    queryKey: ['season-badge', 'etat', userId, required],
    staleTime: 60_000,
    queryFn: async (): Promise<Etat | null> => {
      const { data, error } = await supabase.rpc('claim_season_badge');
      if (error) throw error;
      return (data as unknown as Etat) ?? null;
    },
  });
  const { data: collection = [] } = useQuery({
    queryKey: ['season-badge', 'collection', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('season_badges').select('season_key, saison, earned_at').eq('user_id', userId).order('earned_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  // 🎉 Félicitations une seule fois, le jour où le badge est gagné
  const [bravo, setBravo] = useState(false);
  useEffect(() => {
    if (!e?.earned_at) return;
    const cle = `dinislam_badge_bravo_${userId}_${e.season_key}`;
    let vu: string | null = null;
    try { vu = localStorage.getItem(cle); } catch { /* */ }
    if (!vu) { setBravo(true); try { localStorage.setItem(cle, '1'); } catch { /* */ } }
  }, [e?.earned_at, e?.season_key, userId]);

  if (!e) return null;
  const c = COULEURS[e.saison];
  const gagne = !!e.earned_at;
  const pct = Math.min(100, Math.round((e.days / Math.max(1, e.required)) * 100));
  const passes = collection.filter((b) => b.season_key !== e.season_key);
  const nomSaison = { automne: "l'automne", hiver: "l'hiver", printemps: 'du printemps', ete: "l'été" }[e.saison];

  return (
    <div className="rounded-2xl border px-3 py-2" style={{ background: c.fond, borderColor: c.bord }}>
      <div className="flex items-center gap-3">
        {gagne ? <Medaille saison={e.saison} /> : <span className="text-2xl leading-none" aria-hidden>{EMOJI_SAISON[e.saison]}</span>}
        <div className="min-w-0 flex-1">
          {gagne ? (
            <>
              <p className="text-sm font-extrabold" style={{ color: c.texte }}>🏅 {nomBadge(e.season_key)}</p>
              <p className="text-xs text-muted-foreground">Badge gagné avec {e.days} jours d'activité. Il reste dans ta collection !</p>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold" style={{ color: c.texte }}>Badge de {nomSaison} : {e.days} jour{e.days > 1 ? 's' : ''} sur {e.required}</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/70" role="progressbar" aria-valuemin={0} aria-valuemax={e.required} aria-valuenow={e.days}>
                <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: c.barre }} />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Ouvre au moins une carte par jour pour avancer.</p>
            </>
          )}
        </div>
      </div>
      {passes.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t pt-1.5" style={{ borderColor: c.bord }}>
          <span className="text-[11px] font-bold text-muted-foreground">Ta collection :</span>
          {passes.map((b) => (
            <span key={b.season_key} title={nomBadge(b.season_key)} className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
              {EMOJI_SAISON[b.saison as Saison]} {nomBadge(b.season_key).replace('Élève ', '')}
            </span>
          ))}
        </div>
      )}
      {bravo && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true" aria-label="Badge gagné">
          <div className="saison-msg-arrive w-full max-w-xs rounded-3xl border-2 p-5 text-center shadow-2xl" style={{ background: c.fond, borderColor: c.bord }}>
            <div className="flex justify-center"><Medaille saison={e.saison} taille={96} /></div>
            <p className="mt-2 text-lg font-extrabold" style={{ color: c.texte }}>Bravo ! 🎉</p>
            <p className="text-sm">Tu as gagné le badge <b>« {nomBadge(e.season_key)} »</b> avec {e.days} jours d'activité. Il reste pour toujours dans ta collection !</p>
            <button type="button" onClick={() => setBravo(false)} className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white" style={{ background: c.barre }}>Merci !</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
