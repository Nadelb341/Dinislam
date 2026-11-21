/**
 * 🕊️ Hadith du jour (2026-11-21) : la liste vit EN BASE (table `hadiths_du_jour`), modifiable par l'enseignante
 * depuis l'accueil (✏️ sur la carte). Ce fichier garde :
 *  - la règle de choix du hadith du jour (la même qu'avant, appliquée à la liste lue en base) ;
 *  - l'ANCIENNE liste écrite dans le code, gardée comme FILET DE SECOURS : si la base est vide ou illisible
 *    (1re ouverture sans réseau, erreur…), la carte affiche un hadith de cette liste, jamais une carte vide.
 */

/** Un hadith tel qu'affiché sur la carte */
export interface HadithAffiche { text: string; source: string; theme: string; arabic: string }

/** Une ligne de la table `hadiths_du_jour` */
export interface HadithDuJour {
  id: string;
  texte_arabe: string | null;
  texte: string;
  source: string | null;
  theme: string | null;
  position: number;
}

/** Filet de secours : les 40 hadiths d'origine (mêmes textes, même ordre que l'INSERT de la migration 20261121190000) */
export const HADITHS_SECOURS: HadithAffiche[] = [
  { text: "Les actions ne valent que par leurs intentions.", source: "Sahih Boukhari", theme: "Intention", arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ" },
  { text: "Facilite les choses et ne les complique pas. Réjouis les gens et ne les fais pas fuir.", source: "Sahih Boukhari", theme: "Douceur", arabic: "يَسِّرُوا وَلَا تُعَسِّرُوا" },
  { text: "Le plus aimé parmi vous auprès d'Allah est celui qui a le meilleur caractère.", source: "Sahih Boukhari", theme: "Caractère", arabic: "" },
  { text: "Cherche la science du berceau jusqu'à la tombe.", source: "Sagesse islamique", theme: "Savoir", arabic: "اطلب العلم من المهد إلى اللحد" },
  { text: "Nul d'entre vous n'est croyant tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.", source: "Sahih Boukhari", theme: "Fraternité", arabic: "" },
  { text: "Le Musulman est celui dont les autres Musulmans sont préservés de sa langue et de sa main.", source: "Sahih Boukhari", theme: "Bienveillance", arabic: "" },
  { text: "Souriez à votre frère, c'est de la charité.", source: "Tirmidhi", theme: "Générosité", arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ" },
  { text: "Le paradis se trouve sous les pieds des mères.", source: "Nasaï", theme: "Famille", arabic: "الجَنَّةُ تَحْتَ أَقْدَامِ الأُمَّهَاتِ" },
  { text: "Soyez bons envers vos parents, et vos enfants seront bons envers vous.", source: "Sagesse islamique", theme: "Parents", arabic: "" },
  { text: "Celui qui ne remercie pas les gens ne remercie pas Allah.", source: "Tirmidhi", theme: "Gratitude", arabic: "مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّه" },
  { text: "La propreté est la moitié de la foi.", source: "Sahih Muslim", theme: "Pureté", arabic: "الطَّهُورُ شَطْرُ الإِيمَانِ" },
  { text: "Le fort n'est pas celui qui terrasse les gens, mais celui qui se maîtrise quand il est en colère.", source: "Sahih Boukhari", theme: "Maîtrise de soi", arabic: "" },
  { text: "Dis la vérité même si elle est amère.", source: "Ibn Hibbane", theme: "Honnêteté", arabic: "قُلِ الحَقَّ وَلَوْ كَانَ مُرًّا" },
  { text: "Quiconque croit en Allah et au Jour dernier doit honorer son voisin.", source: "Sahih Boukhari", theme: "Voisinage", arabic: "" },
  { text: "La miséricorde n'est accordée qu'à ceux qui sont miséricordieux.", source: "Tirmidhi", theme: "Miséricorde", arabic: "" },
  { text: "Le meilleur des gens est celui qui est le plus utile aux autres.", source: "Tabarani", theme: "Utilité", arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ" },
  { text: "Ne méprise aucune bonne action, même si c'est d'accueillir ton frère avec un visage souriant.", source: "Sahih Muslim", theme: "Bonne action", arabic: "" },
  { text: "Aide ton frère, qu'il soit oppresseur ou opprimé.", source: "Sahih Boukhari", theme: "Fraternité", arabic: "" },
  { text: "Le croyant ne se mord pas deux fois au même endroit.", source: "Sahih Boukhari", theme: "Sagesse", arabic: "" },
  { text: "Parle bien ou garde le silence.", source: "Sahih Boukhari & Muslim", theme: "Parole", arabic: "قُلْ خَيْرًا أَوِ اصْمُتْ" },
  { text: "Respectez vos aînés, soyez bienveillants envers vos cadets, vous entrerez au Paradis.", source: "Tirmidhi", theme: "Respect", arabic: "" },
  { text: "Celui qui se lève le matin sans soucier du bien des musulmans n'est pas des nôtres.", source: "Bayhaqi", theme: "Solidarité", arabic: "" },
  { text: "Il n'y a pas de bien dans celui qui ne fait pas confiance et en qui on ne peut pas avoir confiance.", source: "Ahmad", theme: "Confiance", arabic: "" },
  { text: "Craignez Allah où que vous soyez, et faites suivre la mauvaise action d'une bonne qui l'effacera.", source: "Tirmidhi", theme: "Taqwa", arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ" },
  { text: "Le savant dépasse l'adorateur comme la lune dépasse les autres étoiles.", source: "Tirmidhi", theme: "Savoir", arabic: "" },
  { text: "Celui qui suit une voie pour y chercher un savoir, Allah lui facilite une voie vers le Paradis.", source: "Sahih Muslim", theme: "Savoir", arabic: "" },
  { text: "Prenez soin de votre corps, car il vous a été confié.", source: "Sagesse islamique", theme: "Santé", arabic: "" },
  { text: "Ne regardez pas vers ceux qui sont au-dessus de vous, regardez vers ceux qui sont en dessous.", source: "Sahih Boukhari", theme: "Gratitude", arabic: "" },
  { text: "Deux paroles légères sur la langue, lourdes dans la balance : Soubhana Allah wa bihamdihi, Soubhana Allah il Adhim.", source: "Sahih Boukhari", theme: "Dhikr", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" },
  { text: "Commencez tout acte important par Bismillah.", source: "Sagesse islamique", theme: "Basmala", arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ" },
  { text: "L'inégalité entre les croyants dans leurs actes de dévotion est comme l'inégalité de la lune et des étoiles.", source: "Tirmidhi", theme: "Dévotion", arabic: "" },
  { text: "Soyez dans ce monde comme un étranger ou un voyageur de passage.", source: "Sahih Boukhari", theme: "Zuhd", arabic: "" },
  { text: "Quiconque construit une mosquée pour Allah, Allah lui construira une maison au Paradis.", source: "Sahih Boukhari", theme: "Mosquée", arabic: "" },
  { text: "Visitez les malades, nourrissez ceux qui ont faim et libérez les captifs.", source: "Sahih Boukhari", theme: "Humanité", arabic: "" },
  { text: "L'Islam est fondé sur cinq piliers : la Shahada, la prière, la zakat, le jeûne et le pèlerinage.", source: "Sahih Boukhari", theme: "Pilliers", arabic: "" },
  { text: "Dis : Allahouma inni as'alouka al-huda wa at-touqa wa al-afafa wa al-ghina.", source: "Sahih Muslim", theme: "Invocation", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الهُدَى وَالتُّقَى" },
  { text: "Le meilleur de vous est celui qui apprend le Coran et l'enseigne.", source: "Sahih Boukhari", theme: "Coran", arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ" },
  { text: "Toute bonne action est de la charité.", source: "Sahih Boukhari", theme: "Générosité", arabic: "كُلُّ مَعْرُوفٍ صَدَقَةٌ" },
  { text: "Récompensez-vous les uns les autres par des cadeaux, vous vous aimerez.", source: "Boukhari al-Adab", theme: "Générosité", arabic: "تَهَادَوْا تَحَابُّوا" },
  { text: "Invoque Allah avec la certitude d'être exaucé.", source: "Tirmidhi", theme: "Dou'a", arabic: "" },
];

/** Ligne de la base → hadith affiché (champs vides = texte vide, comme dans l'ancienne liste) */
export const versAffiche = (h: HadithDuJour): HadithAffiche => ({
  text: h.texte, source: h.source ?? '', theme: h.theme ?? '', arabic: h.texte_arabe ?? '',
});

/** Numéro du jour dans l'année (même calcul qu'avant) */
export function jourDeLAnnee(maintenant = new Date()): number {
  const start = new Date(maintenant.getFullYear(), 0, 0);
  return Math.floor((maintenant.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Le hadith du jour : jour de l'année modulo le nombre de hadiths (règle d'origine).
 * Liste de la base vide, absente ou sans texte → liste de secours.
 */
export function choisirHadithDuJour(liste: HadithDuJour[] | null | undefined, maintenant = new Date()): HadithAffiche {
  const valides = (liste ?? []).filter((h) => h && typeof h.texte === 'string' && h.texte.trim());
  const source = valides.length ? valides.map(versAffiche) : HADITHS_SECOURS;
  return source[jourDeLAnnee(maintenant) % source.length];
}
