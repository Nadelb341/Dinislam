import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { FichePetit } from '@/hooks/usePetits';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate, useParams: () => ({ rubrique: 'ablutions' }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }) }));
vi.mock('@/lib/confettiLettres', () => ({ confettiLettres: vi.fn() }));
vi.mock('@/hooks/useSonErreur', () => ({ useSonErreurChoisi: () => ({ data: 1 }) }));
vi.mock('@/lib/sonSaison', () => ({ sonHarpeEtoiles: vi.fn(), sonPlop: vi.fn(), lecteurSon: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' }, isAdmin: false }) }));

const f = (rubrique: string, titre: string, position: number, extra: Partial<FichePetit> = {}): FichePetit =>
  ({ id: `${rubrique}-${position}`, rubrique, titre, arabe: null, texte: null, emoji: '⭐', image_url: null, audio_url: null, versets: null, position, ...extra }) as FichePetit;
const fiches = [
  ...['Fajr', 'Dohr', 'Asr', 'Maghrib', 'Icha'].map((t, i) => f('prieres5', t, i)),
  f('phrases', 'Bismillah', 1, { arabe: 'بِسْمِ اللَّهِ' }),
  ...['Les mains', 'La bouche', 'Le nez'].map((t, i) => f('ablutions', t, i)),
];
const gagner = vi.fn(async () => true);
vi.mock('@/hooks/usePetits', () => ({
  useFichesPetits: () => ({ data: fiches }),
  useEtoiles: () => ({ data: [{ source: 'fiche', ref: 'x', created_at: '' }] }),
  useGagnerEtoile: () => gagner,
  useReglage: (_: string, d: unknown) => ({ valeur: d, changer: vi.fn() }),
  useAccesPetits: () => ({ pret: true, aAccueil: true, ouverte: () => true, fermeePourTous: () => false }),
}));

import { AccueilPetits } from './AccueilPetits';
import PetitsPage from '@/pages/PetitsPage';

describe('🧸 accueil du Groupe 0', () => {
  it('soleil et 5 prières, phrase du jour, étoiles (lettres comprises), 4 grosses tuiles', () => {
    render(<AccueilPetits isAdmin={false} userId="u1" prayerTimes={null} lettresValidees={3} ouverte={(c) => c !== 'coran'} />);
    for (const p of ['Fajr', 'Dohr', 'Asr', 'Maghrib', 'Icha']) expect(screen.getByRole('button', { name: p })).toBeTruthy();
    expect(screen.getByText('Bismillah')).toBeTruthy();
    expect(screen.getByText('⭐ 4')).toBeTruthy();
    for (const t of ['Mes lettres', 'Mes invocations', 'Histoires', 'Jeux']) expect(screen.getByRole('button', { name: t })).toBeTruthy();
    // Carte fermée pour cet enfant : invisible
    expect(screen.queryByRole('button', { name: 'Le Coran des petits' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Jeux' }));
    expect(navigate).toHaveBeenCalledWith('/petits/jeux');
    // Pas de mot pour les parents vide côté enfant
    expect(screen.queryByText(/Pour les parents/)).toBeNull();
  });
  it('« Remets dans l\'ordre » : une erreur ne bloque pas, le bon ordre donne l\'étoile', () => {
    render(<PetitsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Remets dans l'ordre/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Le nez' }));
    expect(screen.getByText('0 / 3')).toBeTruthy();
    for (const t of ['Les mains', 'La bouche', 'Le nez']) fireEvent.click(screen.getByRole('button', { name: t }));
    expect(screen.getByText('3 / 3')).toBeTruthy();
    expect(gagner).toHaveBeenCalledWith('etapes', expect.stringMatching(/^ablutions:\d{4}-\d{2}-\d{2}$/));
  });
});
