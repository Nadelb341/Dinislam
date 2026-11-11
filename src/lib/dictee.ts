/** 🎤 Ajoute le texte dicté à la fin d'un champ (avec un espace ; majuscule si le champ était vide) */
export const ajouterDicte = (avant: string, dicte: string) => (avant.trim() ? `${avant.replace(/\s+$/, '')} ${dicte}` : dicte.charAt(0).toUpperCase() + dicte.slice(1));
