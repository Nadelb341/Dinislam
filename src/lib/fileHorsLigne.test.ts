import { beforeEach, describe, expect, it, vi } from 'vitest';

// Base qui ne répond pas (comme sans réseau)
vi.mock('@/integrations/supabase/client', () => {
  const panne = async () => ({ error: { message: 'Failed to fetch' } });
  return { supabase: { from: () => ({ insert: panne, upsert: panne, update: () => ({ eq: panne }), delete: () => ({ eq: panne }) }) } };
});
vi.mock('@/lib/pushHelper', () => ({ sendPushNotification: vi.fn() }));

import { ecrireOuGarder, nbEnFile } from './fileHorsLigne';

describe('📡 file hors ligne', () => {
  beforeEach(() => localStorage.clear());

  it('sans réseau : l\'écriture est gardée', async () => {
    expect(await ecrireOuGarder({ table: 't', op: 'insert', rows: [{ a: 1 }] })).toBe('en_attente');
    expect(nbEnFile('t')).toBe(1);
  });

  it('📒 carnet du dhikr : une seule écriture en attente par semaine (la dernière photo remplace la précédente)', async () => {
    const semaine = (total: number, s = '2026-11-23') =>
      ecrireOuGarder({ table: 'dhikr_carnet_semaines', op: 'upsert', cle: `u1|${s}`, rows: [{ user_id: 'u1', semaine: s, total }] });
    await semaine(33);
    await semaine(66);
    await semaine(99);
    await semaine(10, '2026-11-16');
    expect(nbEnFile('dhikr_carnet_semaines')).toBe(2);
    const file = JSON.parse(localStorage.getItem('dinislam_file_hors_ligne') || '[]') as { rows: { total: number }[] }[];
    expect(file.map((o) => o.rows[0].total)).toEqual([99, 10]);
    // Sans clé : rien n'est remplacé (comportement d'avant)
    await ecrireOuGarder({ table: 'dhikr_carnet_semaines', op: 'upsert', rows: [{ total: 1 }] });
    await ecrireOuGarder({ table: 'dhikr_carnet_semaines', op: 'upsert', rows: [{ total: 2 }] });
    expect(nbEnFile('dhikr_carnet_semaines')).toBe(4);
  });
});
