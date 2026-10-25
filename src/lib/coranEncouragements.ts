/**
 * Carte « Coran » : messages d'encouragement (demande de Nadia, 2026-10-25).
 * `{prenom}` est remplacé par le prénom de l'élève (withName / personalize).
 */
export const CORAN_ENCOURAGEMENTS = {
  start: [
    'Bismillah {prenom} ! Ton programme commence, qu\'Allah te facilite chaque page 🤲',
    'Belle décision {prenom} ! Un peu chaque jour, et tu liras tout le Coran in shā\' Allah 🌙',
    'C\'est parti {prenom} ! Chaque lettre lue t\'apporte une récompense ✨',
  ],
  dayDone: [
    'Ma shā\' Allah {prenom}, lecture du jour faite ! Continue comme ça 🌟',
    'Bravo {prenom} ! Une page de plus vers la fin du Coran 📖',
    'Barak Allahou fik {prenom} ! Ta régularité, c\'est ce qu\'Allah aime le plus 💚',
    'Super {prenom} ! Chaque jour compte, et tu l\'as fait 💪',
    'Qu\'Allah te récompense {prenom} ! Ton cœur se remplit de lumière ✨',
  ],
  halfway: [
    'Ma shā\' Allah {prenom}, tu as déjà lu la moitié du Coran ! Ne t\'arrête pas 🎉',
  ],
  late: [
    'Pas de souci {prenom}, tu peux rattraper tranquillement. L\'important, c\'est de continuer 🤗',
    'Allez {prenom}, un petit effort et tu rattrapes ton retard 💪',
  ],
  today: [
    'Ta lecture du jour t\'attend {prenom}, bismillah 📖',
    'Quelques pages aujourd\'hui {prenom}, et la journée est bénie 🌙',
    'On y va {prenom} ? Allah aime les actions régulières, même petites 💚',
  ],
  suraDone: [
    'Bravo {prenom}, sourate terminée ! ✅',
    'Ma shā\' Allah {prenom}, encore une étape de ton parcours 🌟',
    'Super lecture {prenom} ! Passe à l\'étape suivante quand tu veux 📚',
  ],
  juzDone: [
    'Allahou akbar {prenom}, tu as terminé tout le Juz\' ! 🎉',
  ],
};

export type CoranMoment = keyof typeof CORAN_ENCOURAGEMENTS;

/** Un message au hasard pour ce moment (la graine permet de garder le même message à l'écran) */
export function pickEncouragement(moment: CoranMoment, seed?: number): string {
  const list = CORAN_ENCOURAGEMENTS[moment];
  const i = seed === undefined ? Math.floor(Math.random() * list.length) : Math.abs(seed) % list.length;
  return list[i];
}
