/**
 * 🔑 Règle unique des mots de passe (Nadia, 2026-11-02) : 6 caractères minimum, 12 maximum,
 * partout où l'on CRÉE ou CHANGE un mot de passe (inscription, Paramètres, mot de passe oublié, fiche élève).
 * ⚠️ Jamais appliquée à la CONNEXION : des élèves ont déjà un mot de passe plus long, ils doivent pouvoir se connecter.
 */
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 12;
export const PASSWORD_HINT = `De ${PASSWORD_MIN} à ${PASSWORD_MAX} caractères`;

/** Message d'erreur en français, ou null si le mot de passe respecte la règle */
export function passwordError(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères`;
  if (pw.length > PASSWORD_MAX) return `Le mot de passe doit contenir au maximum ${PASSWORD_MAX} caractères`;
  return null;
}
export const passwordOk = (pw: string) => passwordError(pw) === null;
