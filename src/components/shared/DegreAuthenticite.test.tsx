import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DegreAuthenticite, PastilleSource } from './DegreAuthenticite';

const rendre = (el: React.ReactElement) => render(<MemoryRouter>{el}</MemoryRouter>);

describe('pastille du degré', () => {
  it('affiche le nom, l\'arabe et le français', () => {
    rendre(<DegreAuthenticite degre="sahih" />);
    expect(screen.getByText('SAHIH')).toBeInTheDocument();
    expect(screen.getByText('صحيح')).toBeInTheDocument();
    expect(screen.getByText('· Authentique')).toBeInTheDocument();
  });
  it('rien quand le degré est inconnu', () => {
    const { container } = rendre(<DegreAuthenticite degre={null} />);
    expect(container.textContent).toBe('');
  });
  it('avis divergents : étiquette + phrase dans la bulle au toucher', () => {
    rendre(<DegreAuthenticite degre="hasan" divergence="Jugé bon par Al-Albânî ; d'autres l'ont jugé faible." />);
    expect(screen.getByText('⚖️ Avis divergents')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/d'autres l'ont jugé faible/)).toBeInTheDocument();
    expect(screen.getByText(/inférieur au Sahih/)).toBeInTheDocument();
  });
  it('non interactive : pas de bouton (pour aller dans un bouton)', () => {
    rendre(<DegreAuthenticite degre="daif" interactif={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText("DA'IF")).toBeInTheDocument();
  });
});

describe('pastille d\'une source', () => {
  it('Coran + hadith → 2 pastilles', () => {
    rendre(<PastilleSource source="Coran 3:173 ; Boukhari 4563" />);
    expect(screen.getByText('CORAN')).toBeInTheDocument();
    expect(screen.getByText('SAHIH')).toBeInTheDocument();
  });
  it('recueil sans degré : rien pour l\'élève, « à vérifier » pour l\'enseignante', () => {
    const { container } = rendre(<PastilleSource source="Abou Dâwoud 5082" />);
    expect(container.textContent).toBe('');
    rendre(<PastilleSource source="Abou Dâwoud 5082" aVerifier />);
    expect(screen.getByText('🔎 Degré à vérifier')).toBeInTheDocument();
  });
  it('le degré de la base passe avant la source', () => {
    rendre(<PastilleSource source="Abou Dâwoud 2357" degre="hasan" />);
    expect(screen.getByText('HASAN')).toBeInTheDocument();
  });
});
