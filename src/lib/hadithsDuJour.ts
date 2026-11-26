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
  { text: "Les meilleurs d'entre vous sont ceux qui ont le meilleur caractère.", source: "Sahih Boukhari 3559", theme: "Caractère", arabic: "إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلَاقًا" }, // 26/11 : remplacé (règle n°1)
  { text: "Celui qui prend un chemin pour chercher la science, Allah lui facilite par cela un chemin vers le Paradis.", source: "Sahih Mouslim 2699", theme: "Savoir", arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ" }, // 26/11 : remplacé (règle n°1)
  { text: "Nul d'entre vous n'est croyant tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.", source: "Sahih Boukhari", theme: "Fraternité", arabic: "" },
  { text: "Le Musulman est celui dont les autres Musulmans sont préservés de sa langue et de sa main.", source: "Sahih Boukhari", theme: "Bienveillance", arabic: "" },
  { text: "Souriez à votre frère, c'est de la charité.", source: "Tirmidhi", theme: "Générosité", arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ" },
  { text: "Un homme demanda : « Qui mérite le plus ma bonne compagnie ? » Le Prophète ﷺ répondit : « Ta mère. » Puis ? « Ta mère. » Puis ? « Ta mère. » Puis ? « Ton père. »", source: "Sahih Boukhari 5971 et Mouslim 2548", theme: "Famille", arabic: "أُمُّكَ ثُمَّ أُمُّكَ ثُمَّ أُمُّكَ ثُمَّ أَبُوكَ" }, // 26/11 : remplacé (règle n°1)
  { text: "On demanda au Prophète ﷺ quelle action Allah aime le plus. Il répondit : « La prière à son heure. » Puis ? « La bonté envers les parents. »", source: "Sahih Boukhari 527 et Mouslim 85", theme: "Parents", arabic: "الصَّلَاةُ عَلَى وَقْتِهَا ثُمَّ بِرُّ الْوَالِدَيْنِ" }, // 26/11 : remplacé (règle n°1)
  { text: "Celui qui ne remercie pas les gens ne remercie pas Allah.", source: "Tirmidhi", theme: "Gratitude", arabic: "مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّه" },
  { text: "La propreté est la moitié de la foi.", source: "Sahih Muslim", theme: "Pureté", arabic: "الطَّهُورُ شَطْرُ الإِيمَانِ" },
  { text: "Le fort n'est pas celui qui terrasse les gens, mais celui qui se maîtrise quand il est en colère.", source: "Sahih Boukhari", theme: "Maîtrise de soi", arabic: "" },
  { text: "Dis la vérité même si elle est amère.", source: "Ibn Hibbane", theme: "Honnêteté", arabic: "قُلِ الحَقَّ وَلَوْ كَانَ مُرًّا" },
  { text: "Quiconque croit en Allah et au Jour dernier doit honorer son voisin.", source: "Sahih Boukhari", theme: "Voisinage", arabic: "" },
  { text: "La miséricorde n'est accordée qu'à ceux qui sont miséricordieux.", source: "Tirmidhi", theme: "Miséricorde", arabic: "" },
  { text: "Le meilleur des gens est celui qui est le plus utile aux autres.", source: "Tabarani", theme: "Utilité", arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ" },
  { text: "Ne méprise aucune bonne action, même si c'est d'accueillir ton frère avec un visage souriant.", source: "Sahih Muslim", theme: "Bonne action", arabic: "" },
  { text: "Aide ton frère, qu'il soit oppresseur ou opprimé.", source: "Sahih Boukhari", theme: "Fraternité", arabic: "" },
  { text: "Le croyant ne se fait pas piquer deux fois par le même trou.", source: "Sahih Boukhari 6133 et Mouslim 2998", theme: "Sagesse", arabic: "لَا يُلْدَغُ الْمُؤْمِنُ مِنْ جُحْرٍ وَاحِدٍ مَرَّتَيْنِ" }, // 26/11 : remplacé (règle n°1)
  { text: "Parle bien ou garde le silence.", source: "Sahih Boukhari & Muslim", theme: "Parole", arabic: "قُلْ خَيْرًا أَوِ اصْمُتْ" },
  { text: "Allah ne fait pas miséricorde à celui qui ne fait pas miséricorde aux gens.", source: "Sahih Boukhari 7376 et Mouslim 2319", theme: "Miséricorde", arabic: "لَا يَرْحَمُ اللَّهُ مَنْ لَا يَرْحَمُ النَّاسَ" }, // 26/11 : remplacé (règle n°1)
  { text: "Les croyants, dans leur amour et leur tendresse les uns pour les autres, sont comme un seul corps : quand un membre a mal, tout le corps veille et a de la fièvre.", source: "Sahih Mouslim 2586", theme: "Solidarité", arabic: "مَثَلُ الْمُؤْمِنِينَ فِي تَوَادِّهِمْ وَتَرَاحُمِهِمْ وَتَعَاطُفِهِمْ مَثَلُ الْجَسَدِ" }, // 26/11 : remplacé (règle n°1)
  { text: "Les signes de l'hypocrite sont trois : quand il parle, il ment ; quand il promet, il ne tient pas sa promesse ; quand on lui confie quelque chose, il trahit.", source: "Sahih Boukhari 33 et Mouslim 59", theme: "Confiance", arabic: "آيَةُ الْمُنَافِقِ ثَلَاثٌ إِذَا حَدَّثَ كَذَبَ وَإِذَا وَعَدَ أَخْلَفَ وَإِذَا اؤْتُمِنَ خَانَ" }, // 26/11 : remplacé (règle n°1)
  { text: "Craignez Allah où que vous soyez, et faites suivre la mauvaise action d'une bonne qui l'effacera.", source: "Tirmidhi", theme: "Taqwa", arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ" },
  { text: "Le savant dépasse l'adorateur comme la lune dépasse les autres étoiles.", source: "Tirmidhi", theme: "Savoir", arabic: "" },
  { text: "Celui qui suit une voie pour y chercher un savoir, Allah lui facilite une voie vers le Paradis.", source: "Sahih Muslim", theme: "Savoir", arabic: "" },
  { text: "Le croyant fort est meilleur et plus aimé d'Allah que le croyant faible, et dans chacun il y a du bien.", source: "Sahih Mouslim 2664", theme: "Santé", arabic: "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ وَفِي كُلٍّ خَيْرٌ" }, // 26/11 : remplacé (règle n°1)
  { text: "Ne regardez pas vers ceux qui sont au-dessus de vous, regardez vers ceux qui sont en dessous.", source: "Sahih Boukhari", theme: "Gratitude", arabic: "" },
  { text: "Deux paroles légères sur la langue, lourdes dans la balance : Soubhana Allah wa bihamdihi, Soubhana Allah il Adhim.", source: "Sahih Boukhari", theme: "Dhikr", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" },
  { text: "« Ô mon garçon, dis Bismillah, mange avec ta main droite et mange ce qui est devant toi. »", source: "Sahih Boukhari 5376 et Mouslim 2022", theme: "Basmala", arabic: "يَا غُلَامُ سَمِّ اللَّهَ وَكُلْ بِيَمِينِكَ وَكُلْ مِمَّا يَلِيكَ" }, // 26/11 : remplacé (règle n°1)
  { text: "Les actions les plus aimées d'Allah sont celles qui sont faites régulièrement, même si elles sont petites.", source: "Sahih Boukhari 6464 et Mouslim 783", theme: "Dévotion", arabic: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ" }, // 26/11 : remplacé (règle n°1)
  { text: "Soyez dans ce monde comme un étranger ou un voyageur de passage.", source: "Sahih Boukhari", theme: "Zuhd", arabic: "" },
  { text: "Quiconque construit une mosquée pour Allah, Allah lui construira une maison au Paradis.", source: "Sahih Boukhari", theme: "Mosquée", arabic: "" },
  { text: "Visitez les malades, nourrissez ceux qui ont faim et libérez les captifs.", source: "Sahih Boukhari", theme: "Humanité", arabic: "" },
  { text: "L'Islam est fondé sur cinq piliers : la Shahada, la prière, la zakat, le jeûne et le pèlerinage.", source: "Sahih Boukhari", theme: "Pilliers", arabic: "" },
  { text: "Dis : Allahouma inni as'alouka al-huda wa at-touqa wa al-afafa wa al-ghina.", source: "Sahih Muslim", theme: "Invocation", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الهُدَى وَالتُّقَى" },
  { text: "Le meilleur de vous est celui qui apprend le Coran et l'enseigne.", source: "Sahih Boukhari", theme: "Coran", arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ" },
  { text: "Toute bonne action est de la charité.", source: "Sahih Boukhari", theme: "Générosité", arabic: "كُلُّ مَعْرُوفٍ صَدَقَةٌ" },
  { text: "Le Prophète ﷺ acceptait les cadeaux et offrait quelque chose en retour.", source: "Sahih Boukhari 2585", theme: "Générosité", arabic: "كَانَ رَسُولُ اللَّهِ ﷺ يَقْبَلُ الْهَدِيَّةَ وَيُثِيبُ عَلَيْهَا" }, // 26/11 : remplacé (règle n°1)
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
