import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Serie = 'connexions' | 'actifs' | 'validations' | 'messages' | 'inscriptions';
const SERIES: { k: Serie; label: string; emoji: string; couleur: string; aide: string }[] = [
  { k: 'actifs', label: 'Élèves actifs', emoji: '🙋', couleur: '#2457a5', aide: 'élèves différents qui ont ouvert l\'appli dans le mois' },
  { k: 'connexions', label: 'Connexions', emoji: '🔑', couleur: '#7b4fd6', aide: 'nombre total d\'ouvertures de l\'appli' },
  { k: 'validations', label: 'Récitations envoyées', emoji: '🎙️', couleur: '#1f9a5a', aide: 'sourates, Nourania et invocations envoyées à corriger' },
  { k: 'messages', label: 'Messages', emoji: '💬', couleur: '#e07a12', aide: 'messages échangés avec les élèves' },
  { k: 'inscriptions', label: 'Inscriptions', emoji: '✨', couleur: '#d64545', aide: 'nouveaux comptes créés' },
];
const NOMS_TABLES: Record<string, string> = {
  profiles: '👥 Comptes', sourates: '📖 Sourates', invocations: '🤲 Invocations', nourania_lessons: '✨ Leçons Nourania',
  user_messages: '💬 Messages', attendance_records: '📋 Appels', devoirs: '📚 Devoirs', student_reports: '📊 Bilans',
};

/**
 * 📈 Monitoring › « Santé de l'appli » (2026-10-30, demande de Nadia) : juste sous « Activité en temps réel »,
 * plus attractive, avec l'historique sur 12 mois (calculé par la base : fonction monitoring_annee).
 */
export default function SanteAppli() {
  const [visibles, setVisibles] = useState<Serie[]>(['actifs', 'validations', 'messages']);
  const [details, setDetails] = useState(false);

  const { data: mois = [] } = useQuery({
    queryKey: ['monitoring', 'annee'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('monitoring_annee');
      if (error) throw error;
      return (data || []).map((m) => ({ ...m, nom: new Date(`${m.mois}T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') }));
    },
  });
  const { data: totaux } = useQuery({
    queryKey: ['monitoring', 'totaux'],
    queryFn: async () => {
      const semaine = new Date(Date.now() - 7 * 86400000).toISOString();
      const tables = Object.keys(NOMS_TABLES);
      const [{ count: comptes }, { count: actifsSemaine }, ...lignes] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }).gte('last_seen', semaine),
        ...tables.map((t) => supabase.from(t as 'profiles').select('*', { count: 'exact', head: true })),
      ]);
      return { comptes: comptes ?? 0, actifsSemaine: actifsSemaine ?? 0, lignes: tables.map((t, i) => ({ t, n: lignes[i].count ?? 0 })) };
    },
  });

  const ceMois = mois[mois.length - 1];
  const avant = mois[mois.length - 2];
  const evolution = (k: Serie) => (ceMois && avant ? ceMois[k] - avant[k] : null);
  const record = mois.length ? mois.reduce((a, b) => (b.actifs > a.actifs ? b : a)) : null;
  const nomMois = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const tuiles = [
    { v: totaux?.comptes ?? '…', l: 'comptes inscrits', s: ceMois?.inscriptions ? `+${ceMois.inscriptions} ce mois` : null, cls: 'from-sky-100 to-sky-50 dark:from-sky-950/60 dark:to-sky-950/20 text-sky-800 dark:text-sky-200' },
    { v: totaux?.actifsSemaine ?? '…', l: 'actifs ces 7 jours', s: null, cls: 'from-violet-100 to-violet-50 dark:from-violet-950/60 dark:to-violet-950/20 text-violet-800 dark:text-violet-200' },
    { v: ceMois?.validations ?? '…', l: 'récitations ce mois', s: evolution('validations'), cls: 'from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-950/20 text-emerald-800 dark:text-emerald-200' },
    { v: ceMois?.messages ?? '…', l: 'messages ce mois', s: evolution('messages'), cls: 'from-orange-100 to-orange-50 dark:from-orange-950/60 dark:to-orange-950/20 text-orange-800 dark:text-orange-200' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-sky-50 via-violet-50 to-emerald-50 dark:from-sky-950/30 dark:via-violet-950/30 dark:to-emerald-950/30">
        <CardTitle className="text-lg flex items-center gap-2">💚 Santé de l'appli <span className="text-xs font-semibold text-muted-foreground">· 12 derniers mois</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {tuiles.map((t) => (
            <div key={t.l} className={cn('rounded-2xl bg-gradient-to-br p-3', t.cls)}>
              <p className="text-2xl font-extrabold tabular-nums">{t.v}</p>
              <p className="text-xs font-semibold opacity-80">{t.l}</p>
              {typeof t.s === 'number' ? (
                <p className={cn('text-[11px] font-bold', t.s > 0 ? 'text-emerald-700 dark:text-emerald-300' : t.s < 0 ? 'text-red-700 dark:text-red-300' : 'opacity-70')}>
                  {t.s > 0 ? `▲ +${t.s}` : t.s < 0 ? `▼ ${t.s}` : '='} par rapport au mois dernier
                </p>
              ) : t.s ? <p className="text-[11px] font-bold opacity-80">{t.s}</p> : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SERIES.map((s) => {
            const on = visibles.includes(s.k);
            return (
              <button key={s.k} type="button" aria-pressed={on} title={s.aide}
                onClick={() => setVisibles((v) => (on ? v.filter((x) => x !== s.k) : [...v, s.k]))}
                className={cn('rounded-full border-2 px-2.5 py-1 text-xs font-bold transition-colors', on ? 'text-white' : 'bg-card text-muted-foreground')}
                style={on ? { background: s.couleur, borderColor: s.couleur } : { borderColor: s.couleur }}>
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mois} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient key={s.k} id={`sante-${s.k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.couleur} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.couleur} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="nom" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis fontSize={11} allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-lg space-y-0.5">
                      <p className="font-bold capitalize">{label}</p>
                      {payload.map((p) => {
                        const s = SERIES.find((x) => x.k === p.dataKey);
                        return <p key={String(p.dataKey)} style={{ color: s?.couleur }}>{s?.emoji} {s?.label} : <b>{p.value}</b></p>;
                      })}
                    </div>
                  );
                }}
              />
              {SERIES.filter((s) => visibles.includes(s.k)).map((s) => (
                <Area key={s.k} type="monotone" dataKey={s.k} stroke={s.couleur} strokeWidth={2.5} fill={`url(#sante-${s.k})`} dot={{ r: 2.5, fill: s.couleur }} activeDot={{ r: 5 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {record && record.actifs > 0 && (
          <p className="rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            🏆 Mois le plus actif : <b className="capitalize">{nomMois(record.mois)}</b>, avec {record.actifs} élèves actifs et {record.connexions} connexions.
          </p>
        )}

        <button type="button" onClick={() => setDetails((d) => !d)} className="w-full rounded-xl border px-3 py-2 text-left text-sm font-bold flex justify-between">
          <span>🔧 Détails techniques (lignes enregistrées)</span><span>{details ? '▲' : '▼'}</span>
        </button>
        {details && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(totaux?.lignes ?? []).map((l) => (
              <div key={l.t} className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-lg font-extrabold tabular-nums">{l.n}</p>
                <p className="text-[11px] text-muted-foreground">{NOMS_TABLES[l.t]}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
