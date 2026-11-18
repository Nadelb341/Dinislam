import { describe, expect, it } from 'vitest';
import { estErreurMiseAJour } from './miseAJour';

describe('nouvelle version en ligne', () => {
  it('reconnaît les erreurs de morceau introuvable', () => {
    expect(estErreurMiseAJour(new TypeError("'text/html' is not a valid JavaScript MIME type."))).toBe(true);
    expect(estErreurMiseAJour(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true);
    expect(estErreurMiseAJour(new TypeError('Importing a module script failed.'))).toBe(true);
  });
  it('ne confond pas avec un vrai bug', () => {
    expect(estErreurMiseAJour(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false);
  });
});

describe('plantage iPhone pendant une mise en ligne (Wiam, 18/11)', () => {
  it('reconnaît l\'erreur Safari de React.lazy', () => {
    expect(estErreurMiseAJour(new TypeError("undefined is not an object (evaluating 'e._result.default')"))).toBe(true);
    expect(estErreurMiseAJour(new TypeError("Cannot read properties of undefined (reading 'default')"))).toBe(true);
  });
});
