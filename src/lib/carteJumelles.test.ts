import { describe, expect, it } from 'vitest';
import { idZonesPartagees, jumelles } from './carteJumelles';

const c = (id: string, title: string, parent_id: string | null, group_key: string | null) => ({ id, title, parent_id, group_key });
const toutes = [
  c('p', 'LODO', null, 'petits'), c('j', 'LODO', null, 'jeunes'), c('a', 'Lodo ', null, 'adultes'),
  c('p2', '2 - DIRE BISMILAH', 'p', null), c('j2', '2 - DIRE BISMILAH', 'j', null), c('a2', '2 - dire bismilah', 'a', null),
  c('p3', '3 - LAVER LES MAINS', 'p', null), c('x', 'Autre', null, 'petits'),
];

describe('cartes jumelles de la Prière', () => {
  it('trouve la même carte dans les autres groupes', () => {
    expect(jumelles(toutes[0], toutes).sort()).toEqual(['a', 'j']);
    expect(jumelles(toutes[3], toutes).sort()).toEqual(['a2', 'j2']);
  });
  it('ne prend ni le même groupe ni un autre titre', () => {
    expect(jumelles(toutes[6], toutes)).toEqual([]);
    expect(jumelles(toutes[7], toutes)).toEqual([]);
  });
  it('range les zones sous la carte des petits', () => {
    expect(idZonesPartagees(toutes[5], toutes)).toBe('p2');
    expect(idZonesPartagees(toutes[7], toutes)).toBe('x');
  });
});
