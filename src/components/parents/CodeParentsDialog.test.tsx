import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/** ✏️ Modifier son code parents depuis l'Espace parents déjà ouvert (2026-11-02, choix A de Nadia). */
const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a), auth: {} } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'enfant', email: 'e@x.fr' } }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CodeParentsDialog } from './CodeParentsDialog';
import { codeOuvert, memoriserCode, oublierCodes } from '@/lib/espaceParents';

const info = { labels: ['Maman'], codes: [{ label: 'Maman', created_at: '2026-10-30T10:00:00Z', updated_at: null }] };

describe('CodeParentsDialog — gestion des codes', () => {
  beforeEach(() => {
    oublierCodes(); rpc.mockReset();
    rpc.mockImplementation((nom: string) => Promise.resolve(nom === 'parent_space_info' ? { data: info, error: null } : { data: 'Maman', error: null }));
  });

  it("Espace déjà ouvert : pas de code redemandé, liste + ✏️ Modifier", async () => {
    memoriserCode('enfant', 'Ancien1', 'Maman');
    render(<CodeParentsDialog childId="enfant" childName="Wiam" open gerer onOpenChange={() => {}} onOk={() => {}} />);
    expect(await screen.findByText('✏️ Modifier')).toBeTruthy();
    expect(screen.queryByLabelText('Code parents')).toBeNull();
    expect(screen.getByText(/créé le 30\/10\/2026/)).toBeTruthy();
  });

  it("modifier : ancien + nouveau 2 fois → enregistré, l'Espace reste ouvert avec le nouveau code", async () => {
    memoriserCode('enfant', 'Ancien1', 'Maman');
    render(<CodeParentsDialog childId="enfant" childName="Wiam" open gerer onOpenChange={() => {}} onOk={() => {}} />);
    fireEvent.click(await screen.findByText('✏️ Modifier'));
    fireEvent.change(screen.getByLabelText('Ancien code'), { target: { value: 'Ancien1' } });
    fireEvent.change(screen.getByLabelText('Nouveau code'), { target: { value: 'Soleil2' } });
    fireEvent.change(screen.getByLabelText('Confirmer le nouveau code'), { target: { value: 'Soleil2' } });
    fireEvent.click(screen.getByText('Enregistrer le nouveau code'));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('parent_code_change', { p_child: 'enfant', p_label: 'Maman', p_old: 'Ancien1', p_new: 'Soleil2' }));
    await waitFor(() => expect(codeOuvert('enfant')).toEqual({ code: 'Soleil2', label: 'Maman' }));
  });

  it("deux nouveaux codes différents → message, rien n'est envoyé", async () => {
    memoriserCode('enfant', 'Ancien1', 'Maman');
    render(<CodeParentsDialog childId="enfant" childName="Wiam" open gerer onOpenChange={() => {}} onOk={() => {}} />);
    fireEvent.click(await screen.findByText('✏️ Modifier'));
    fireEvent.change(screen.getByLabelText('Ancien code'), { target: { value: 'Ancien1' } });
    fireEvent.change(screen.getByLabelText('Nouveau code'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Confirmer le nouveau code'), { target: { value: 'B' } });
    fireEvent.click(screen.getByText('Enregistrer le nouveau code'));
    expect(await screen.findByText('Les deux nouveaux codes ne sont pas pareils')).toBeTruthy();
    expect(rpc).not.toHaveBeenCalledWith('parent_code_change', expect.anything());
  });

  it("ancien code faux → message de la base affiché", async () => {
    memoriserCode('enfant', 'Ancien1', 'Maman');
    rpc.mockImplementation((nom: string) => Promise.resolve(nom === 'parent_space_info' ? { data: info, error: null } : { data: null, error: { message: 'Ancien code incorrect' } }));
    render(<CodeParentsDialog childId="enfant" childName="Wiam" open gerer onOpenChange={() => {}} onOk={() => {}} />);
    fireEvent.click(await screen.findByText('✏️ Modifier'));
    fireEvent.change(screen.getByLabelText('Ancien code'), { target: { value: 'Faux' } });
    fireEvent.change(screen.getByLabelText('Nouveau code'), { target: { value: 'X1' } });
    fireEvent.change(screen.getByLabelText('Confirmer le nouveau code'), { target: { value: 'X1' } });
    fireEvent.click(screen.getByText('Enregistrer le nouveau code'));
    expect(await screen.findByText('Ancien code incorrect')).toBeTruthy();
    expect(codeOuvert('enfant')?.code).toBe('Ancien1');
  });

  it("2e code (Papa) depuis l'Espace ouvert : le code de Maman n'est pas redemandé", async () => {
    memoriserCode('enfant', 'Ancien1', 'Maman');
    render(<CodeParentsDialog childId="enfant" childName="Wiam" open gerer onOpenChange={() => {}} onOk={() => {}} />);
    fireEvent.click(await screen.findByText(/Créer un 2e code/));
    expect(screen.queryByLabelText('Code déjà créé')).toBeNull();
    fireEvent.change(screen.getByLabelText('Nouveau code'), { target: { value: 'Papa1' } });
    fireEvent.change(screen.getByLabelText('Confirmer le code'), { target: { value: 'Papa1' } });
    fireEvent.click(screen.getByText('Créer le code'));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('parent_code_create', { p_child: 'enfant', p_label: 'Papa', p_code: 'Papa1', p_current: 'Ancien1' }));
    expect(codeOuvert('enfant')?.label).toBe('Maman');
  });

  it("sans `gerer` (accès normal) : on demande toujours le code", async () => {
    render(<CodeParentsDialog childId="enfant" childName="Wiam" open onOpenChange={() => {}} onOk={() => {}} />);
    expect(await screen.findByLabelText('Code parents')).toBeTruthy();
  });
});
