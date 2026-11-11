import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';

/**
 * 📡 File d'écritures faites SANS RÉSEAU (règle « applis libres », 2026-11-11, d'abord pour les Convocations) :
 * l'écriture est gardée sur l'appareil puis rejouée au retour du réseau (même ordre). Une notification peut suivre.
 * Pour une table simple (insert / upsert / update / delete par id).
 */
type Op =
  | { table: string; op: 'insert'; rows: Record<string, unknown>[]; push?: Parameters<typeof sendPushNotification>[0][] }
  | { table: string; op: 'upsert'; rows: Record<string, unknown>[]; push?: Parameters<typeof sendPushNotification>[0][] }
  | { table: string; op: 'update'; id: string; values: Record<string, unknown>; col?: string }
  | { table: string; op: 'delete'; id: string; col?: string };

const CLE = 'dinislam_file_hors_ligne';
export const EVT_FILE = 'dinislam:file-hors-ligne';
const lire = (): Op[] => { try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch { return []; } };
const ecrire = (l: Op[]) => {
  try { if (l.length) localStorage.setItem(CLE, JSON.stringify(l)); else localStorage.removeItem(CLE); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(EVT_FILE)); } catch { /* hors navigateur */ }
};
export const nbEnFile = (table?: string) => lire().filter((o) => !table || o.table === table).length;
const horsLigne = (msg: string) => (typeof navigator !== 'undefined' && navigator.onLine === false) || /fetch|network|load failed|hors connexion|timeout|aborted/i.test(msg);

async function jouer(o: Op) {
  // Table choisie à l'exécution : on passe par une vue sans typage strict (tables vérifiées par la base et ses règles RLS)
  const t = supabase.from(o.table as never) as unknown as {
    insert: (r: unknown) => Promise<{ error: { message: string } | null }>;
    upsert: (r: unknown) => Promise<{ error: { message: string } | null }>;
    update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };
  let r: { error: { message: string } | null };
  if (o.op === 'insert') r = await t.insert(o.rows);
  else if (o.op === 'upsert') r = await t.upsert(o.rows);
  else if (o.op === 'update') r = await t.update(o.values).eq(o.col ?? 'id', o.id);
  else r = await t.delete().eq(o.col ?? 'id', o.id);
  if (r.error) throw new Error(r.error.message);
  if ((o.op === 'insert' || o.op === 'upsert') && o.push) o.push.forEach((p) => sendPushNotification(p));
}

/** Écrit tout de suite si possible, sinon garde l'écriture : 'ok' | 'en_attente' ; lève une erreur si la base refuse */
export async function ecrireOuGarder(o: Op): Promise<'ok' | 'en_attente'> {
  try { await jouer(o); return 'ok'; } catch (e) {
    if (!horsLigne((e as Error).message || '')) throw e;
    ecrire([...lire(), o]);
    return 'en_attente';
  }
}

let enCours = false;
export async function rejouerFile(): Promise<number> {
  if (enCours) return 0;
  const l = lire();
  if (!l.length) return 0;
  enCours = true;
  let n = 0;
  const reste: Op[] = [];
  try {
    for (const o of l) {
      if (reste.length) { reste.push(o); continue; } // garder l'ordre : on s'arrête au premier échec réseau
      try { await jouer(o); n++; } catch (e) {
        if (horsLigne((e as Error).message || '')) reste.push(o); else console.error('[Hors ligne] écriture refusée', o.table, e);
      }
    }
  } finally { ecrire(reste); enCours = false; }
  return n;
}
