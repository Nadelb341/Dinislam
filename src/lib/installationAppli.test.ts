import { describe, expect, it } from 'vitest';
import { navigateurIphone, versionIos } from './installationAppli';

const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
const CHROME_17 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
const CHROME_16_3 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/110.0 Mobile/15E148 Safari/604.1';
const FIREFOX_16_4 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/112.0 Mobile/15E148 Safari/605.1.15';
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 312.0';

describe('Installation sur iPhone (2026-11-26, iOS 16.4)', () => {
  it('lit la version d\'iOS', () => {
    expect(versionIos(CHROME_17)).toBeCloseTo(17.02);
    expect(versionIos('rien')).toBeNull();
  });
  it('Safari installe', () => expect(navigateurIphone(SAFARI)).toBe('safari'));
  it('Chrome / Firefox récents installent aussi par Partager', () => {
    expect(navigateurIphone(CHROME_17)).toBe('navigateur');
    expect(navigateurIphone(FIREFOX_16_4)).toBe('navigateur');
  });
  it('vieux iOS ou appli qui ouvre les liens : Safari obligatoire', () => {
    expect(navigateurIphone(CHROME_16_3)).toBe('safari-obligatoire');
    expect(navigateurIphone(INSTAGRAM)).toBe('safari-obligatoire');
  });
});
