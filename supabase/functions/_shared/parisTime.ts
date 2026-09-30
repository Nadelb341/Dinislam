// Heure de Paris (gère automatiquement l'heure d'été / d'hiver)
export function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  return {
    day: `${get('year')}-${get('month')}-${get('day')}`, // AAAA-MM-JJ
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

/** Jour (AAAA-MM-JJ, heure de Paris) d'une date */
export function parisDay(date: Date) {
  return parisNow(date).day;
}

/** Appel interne à send-push-notification (secret partagé, jamais exposé à l'appli) */
export async function sendPushInternal(body: Record<string, unknown>) {
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      'x-internal-secret': Deno.env.get('INTERNAL_CALL_SECRET') ?? '',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`send-push-notification ${res.status}: ${JSON.stringify(data)}`);
  return data as { sent?: number; total?: number };
}
