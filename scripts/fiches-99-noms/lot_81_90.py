from outils import F, S, P, I, A, D, PR

E = "Explication"
ENS = "Ce que ce Nom nous enseigne"
RAP = "Ce que cette appellation nous rappelle"
Q = "Quand invoquer Allah par ce Nom"
EX = "Exemple d'invocation personnelle"
AN = "Authenticité du Nom"

# ⚠️ ChatGPT 81 à 90 = appli 82 à 91
FICHES = [
    F(82, 81, "الْعَفُوُّ", "Al-'Afuww", "Celui qui efface les péchés et pardonne abondamment.", "Coran et Sunna.", "etabli", "coran_sunna",
      S(E, """
        Allah est Al-'Afuww. Il pardonne les fautes de Ses serviteurs et peut en effacer les traces. Son pardon est immense et Sa miséricorde dépasse ce que les êtres humains peuvent imaginer.

        Ce Nom nous rappelle que le croyant ne doit jamais désespérer du pardon d'Allah. Il doit toutefois se repentir sincèrement et s'efforcer de délaisser le péché."""),
      S(ENS, """
        - Ne jamais perdre espoir dans le pardon d'Allah.
        - Reconnaître ses erreurs et revenir sincèrement vers Lui.
        - Apprendre à pardonner aux autres lorsque cela est possible et juste.
        - Ne pas banaliser les péchés sous prétexte qu'Allah pardonne."""),
      P("Preuves dans le Coran", "إِنَّ اللَّهَ كَانَ عَفُوًّا غَفُورًا", "« Allah est certes Celui qui efface les fautes et qui pardonne. »",
        "Coran, sourate An-Nisâ' (4), verset 99.", "coran", "Autres références : Coran 4:149 et 22:60."),
      PR("Invocation prophétique authentique", "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", "Allâhumma innaka 'Afuwwun tuhibbu al-'afwa fa'fu 'annî.",
         "« Ô Allah, Tu es Celui qui efface les fautes, Tu aimes le pardon, alors pardonne-moi. »", "Jâmi' At-Tirmidhî, hadith 3513.", "sahih",
         "'Â'isha رضي الله عنها demanda au Prophète ﷺ quelle invocation prononcer durant la Nuit du Destin. Il lui enseigna cette invocation.",
         "Authenticité : Rapporté par At-Tirmidhî, qui le qualifie de « hasan sahih »."),
      S(Q, "Lorsqu'on demande pardon à Allah, particulièrement pendant les moments propices au repentir, comme les dernières nuits du Ramadan."),
      I("« Ô Allah, Tu es Al-'Afuww, pardonne-moi, efface mes fautes et accepte mon repentir. »", None, "Exemple d'invocation"),
      A("CORAN ET SUNNA", "Attesté explicitement dans le Coran et dans une invocation prophétique rapportée par At-Tirmidhî.", AN)),

    F(83, 82, "الرَّؤُوفُ", "Ar-Ra'ûf", "Le Très Compatissant, Celui dont la compassion est immense.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Ar-Ra'ûf. Sa compassion envers Ses serviteurs est parfaite. Il connaît leurs faiblesses, leurs difficultés et leurs besoins. Il leur accorde des bienfaits et leur ouvre les voies de la guidance.

        Sa compassion n'est pas comparable à celle des créatures : elle est parfaite et exempte de toute faiblesse."""),
      S(ENS, """
        - Reconnaître la compassion d'Allah envers Ses serviteurs.
        - Garder espoir dans Sa miséricorde.
        - Faire preuve de compassion envers les personnes qui nous entourent.
        - Éviter la dureté et l'injustice dans nos relations."""),
      P("Preuves dans le Coran", "إِنَّ اللَّهَ بِالنَّاسِ لَرَءُوفٌ رَحِيمٌ", "« Allah est envers les hommes, certes, Très Compatissant et Très Miséricordieux. »",
        "Coran, sourate Al-Baqara (2), verset 143.", "coran", "Autre référence : Coran, sourate At-Tawba (9), verset 117."),
      S(Q, "Lorsqu'on traverse une difficulté, qu'on recherche la compassion d'Allah ou qu'on demande à être guidé vers un comportement empreint de douceur."),
      I("« Ô Allah, Ar-Ra'ûf, enveloppe-moi de Ta compassion et aide-moi à être bienveillant envers les autres. »", None, EX),
      A("CORAN", "Attesté explicitement dans le Coran.", AN)),

    F(84, 83, "مَالِكُ الْمُلْكِ", "Mâlik-ul-Mulk", "Le Maître de toute souveraineté, le Possesseur de toute royauté.", "Coran — expression explicitement présente.", "etabli", "coran",
      S(E, """
        Allah est le Maître absolu de toute souveraineté. Il donne le pouvoir à qui Il veut et le retire à qui Il veut. Toute autorité, toute possession et toute domination appartiennent en réalité à Allah.

        Les pouvoirs humains sont temporaires et limités. Aucun être humain ne possède une souveraineté indépendante de celle d'Allah."""),
      S(ENS, """
        - Reconnaître qu'Allah est le véritable Maître de toute chose.
        - Ne pas se laisser aveugler par le pouvoir ou les richesses.
        - Faire preuve d'humilité lorsque l'on possède une responsabilité.
        - Se rappeler que les biens et les positions de ce monde sont temporaires."""),
      P("Preuve dans le Coran", "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَنْ تَشَاءُ وَتَنْزِعُ الْمُلْكَ مِمَّنْ تَشَاءُ",
        "« Dis : Ô Allah, Maître de la royauté, Tu donnes la royauté à qui Tu veux et Tu retires la royauté à qui Tu veux. »", "Coran, sourate Âl 'Imrân (3), verset 26.", "coran"),
      S("Quand invoquer Allah par cette appellation", "Lorsqu'on souhaite remettre ses affaires à Allah, demander Sa guidance dans une responsabilité ou se rappeler que toute puissance Lui appartient."),
      I("« Ô Allah, Maître de toute souveraineté, accorde-moi ce qui est bon et préserve-moi de l'orgueil et de l'injustice. »", None, EX),
      A("CORAN", "Expression explicitement présente dans le Coran. Elle est établie comme appellation divine dans le verset.", AN)),

    F(85, 84, "ذُو الْجَلَالِ وَالْإِكْرَامِ", "Dhul-Jalâli wal-Ikrâm", "Le Détenteur de la majesté et de la générosité.", "Coran — expression explicitement attestée.", "etabli", "coran",
      S(E, """
        Allah est Celui qui possède toute majesté, toute grandeur et toute perfection. Il est également Celui dont la générosité et les bienfaits sont immenses.

        Cette appellation réunit deux réalités : la majesté d'Allah, qui inspire le respect et la vénération, et Sa générosité, qui suscite l'amour, l'espérance et la gratitude."""),
      S("Ce que cette appellation nous enseigne", """
        - Vénérer Allah et reconnaître Sa grandeur.
        - L'aimer, espérer Sa générosité et Lui être reconnaissant.
        - Ne pas oublier que tous les bienfaits viennent de Lui.
        - Réunir dans notre adoration le respect d'Allah et l'espoir en Sa miséricorde."""),
      P("Preuves dans le Coran", "وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو الْجَلَالِ وَالْإِكْرَامِ", "« Seule subsistera la Face de ton Seigneur, plein de majesté et de noblesse. »",
        "Coran, sourate Ar-Rahmân (55), verset 27.", "coran", "Autre référence : Coran, sourate Ar-Rahmân (55), verset 78."),
      S("Quand invoquer Allah par cette appellation", "Lorsqu'on souhaite glorifier Allah, Lui demander Ses bienfaits et exprimer sa gratitude envers Lui."),
      I("« Ô Allah, Toi qui détiens la majesté et la générosité, accorde-moi Ta miséricorde et rapproche-moi de ce qui Te satisfait. »", None, EX),
      A("CORAN", "Expression explicitement attestée dans le Coran.", "Authenticité de l'appellation")),

    F(86, 85, "الْمُقْسِطُ", "Al-Muqsit", "Le Juste, Celui qui établit l'équité.", "Sens de justice attesté ; Nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Cette appellation évoque l'équité parfaite d'Allah et Sa justice absolue. Allah ne commet aucune injustice. Il juge avec une connaissance parfaite et ne lèse personne, même du poids d'un atome.

        Il faut toutefois distinguer le sens de justice, clairement présent dans le Coran, de l'établissement de la forme exacte « Al-Muqsit » comme Nom divin indépendant. Cette forme n'est pas explicitement attestée comme telle dans le Coran. Son statut comme Nom indépendant est discuté."""),
      S(RAP, """
        - Allah est parfaitement juste.
        - Nous devons être équitables, même lorsque cela va à l'encontre de nos intérêts.
        - Il ne faut pas juger les autres avec injustice.
        - Toute injustice commise envers autrui est une responsabilité sérieuse."""),
      P("Preuve liée au sens dans le Coran", "شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ قَائِمًا بِالْقِسْطِ",
        "« Allah atteste, et aussi les Anges et les gens doués de savoir, qu'il n'y a de divinité digne d'adoration que Lui, Lui qui maintient la justice. »",
        "Coran, sourate Âl 'Imrân (3), verset 18.", "coran", "Précision : Le verset atteste qu'Allah établit parfaitement la justice, mais ne contient pas la forme exacte « Al-Muqsit »."),
      S("Quand évoquer cette appellation", "Lorsqu'on demande à Allah de nous aider à agir avec justice, à respecter les droits des autres et à ne pas être injuste."),
      I("« Ô Allah, Toi qui es parfaitement juste, aide-moi à être équitable et protège-moi de toute injustice. »", None, EX),
      A("STATUT DISCUTÉ", "Le sens de justice est explicitement attesté dans le Coran. Le statut de « Al-Muqsit » comme Nom divin indépendant est discuté. Afficher une mention de prudence.", AN)),

    F(87, 86, "الْجَامِعُ", "Al-Jâmi'", "Celui qui rassemble.", "Action de rassembler attestée ; Nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Allah est Celui qui rassemble les êtres humains au Jour de la Résurrection. Il réunira les générations passées et futures pour le jugement. Rien ne pourra empêcher ce rassemblement décrété par Lui.

        L'idée de rassemblement est clairement exprimée dans le Coran. Cependant, la forme exacte « Al-Jâmi' » comme Nom divin indépendant est discutée par les savants : le fait qu'Allah accomplisse une action ne suffit pas automatiquement à établir cette appellation comme Nom."""),
      S(RAP, """
        - Nous serons tous rassemblés devant Allah.
        - Nous devons nous préparer au Jour du Jugement.
        - Nos actes ont une importance et une conséquence.
        - Nous devons demander à Allah de nous réunir avec les croyants dans le bien."""),
      P("Preuve dans le Coran", "رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ لِيَوْمٍ لَا رَيْبَ فِيهِ", "« Seigneur ! Tu rassembleras les hommes en un jour au sujet duquel il n'y a aucun doute. »",
        "Coran, sourate Âl 'Imrân (3), verset 9.", "coran",
        "Précision : Le verset emploie « Jâmi' » pour décrire l'action d'Allah qui rassemble les hommes. Il ne faut pas en déduire automatiquement un consensus sur son statut de Nom divin indépendant."),
      S("Quand évoquer cette appellation", "Lorsqu'on pense au Jour de la Résurrection, qu'on demande à Allah de nous réunir dans le bien ou qu'on Lui demande de préserver l'unité des croyants."),
      I("« Ô Allah, rassemble-nous dans le bien ici-bas et réunis-nous parmi les croyants dans Ton Paradis. »", None, EX),
      A("STATUT DISCUTÉ", "L'action de rassembler est explicitement attestée dans le Coran. Le statut de « Al-Jâmi' » comme Nom indépendant est discuté. Afficher une mention de prudence.", AN)),

    F(88, 87, "الْغَنِيُّ", "Al-Ghaniyy", "Le Riche absolu, Celui qui se suffit parfaitement à Lui-même.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Ghaniyy. Il n'a besoin de personne ni de rien. Toute la création dépend de Lui, tandis qu'Il est parfaitement indépendant de Ses créatures.

        Les êtres humains ont besoin de nourriture, d'eau, d'aide et de nombreuses choses pour vivre. Allah, Lui, n'a besoin d'aucune chose."""),
      S(ENS, """
        - Reconnaître notre dépendance totale envers Allah.
        - Ne pas être orgueilleux à cause de nos biens.
        - Comprendre que l'adoration profite au serviteur et non à Allah.
        - Placer notre confiance en Celui qui ne manque de rien."""),
      P("Preuves dans le Coran", "وَاللَّهُ غَنِيٌّ حَلِيمٌ", "« Allah est Celui qui se suffit à Lui-même et Il est Indulgent. »",
        "Coran, sourate Al-Baqara (2), verset 263.", "coran"),
      P("Autre référence particulièrement claire", "يَا أَيُّهَا النَّاسُ أَنْتُمُ الْفُقَرَاءُ إِلَى اللَّهِ وَاللَّهُ هُوَ الْغَنِيُّ الْحَمِيدُ",
        "« Ô hommes, vous êtes les indigents ayant besoin d'Allah, et Allah est Celui qui se suffit à Lui-même, le Digne de louange. »", "Coran, sourate Fâtir (35), verset 15.", "coran"),
      S(Q, "Lorsqu'on a besoin de Lui, qu'on demande Sa subsistance, ou qu'on souhaite se rappeler que les richesses de ce monde ne sont que temporaires."),
      I("« Ô Allah, Al-Ghaniyy, Toi qui n'as besoin de personne, enrichis mon cœur par la foi et accorde-moi une subsistance licite et bénie. »", None, EX),
      A("CORAN", "Attesté explicitement dans le Coran.", AN)),

    F(89, 88, "الْمُغْنِي", "Al-Mughnî", "Celui qui enrichit et qui accorde la suffisance.", "Action d'enrichir attestée ; Nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Allah accorde à Ses serviteurs les moyens de vivre et peut les enrichir par Sa grâce. La véritable richesse ne se limite pas à l'argent : elle comprend également la richesse du cœur, la satisfaction, la foi et la suffisance.

        Le Coran affirme qu'Allah enrichit Ses serviteurs par Sa grâce. Toutefois, il faut distinguer cette action de l'établissement de « Al-Mughnî » comme Nom divin indépendant : la forme exacte est discutée et ne doit pas être présentée comme unanimement établie."""),
      S(RAP, """
        - La véritable richesse vient d'Allah.
        - L'argent ne garantit pas la satisfaction intérieure.
        - Nous devons rechercher une subsistance licite.
        - La gratitude est essentielle, quelle que soit notre situation matérielle.
        - La richesse du cœur est un bienfait immense."""),
      P("Preuve dans le Coran", "فَسَوْفَ يُغْنِيكُمُ اللَّهُ مِنْ فَضْلِهِ إِنْ شَاءَ", "« Allah vous enrichira de Sa grâce, s'Il le veut. »",
        "Coran, sourate At-Tawba (9), verset 28.", "coran", "Précision : Le verset affirme l'action d'Allah qui enrichit par Sa grâce, mais n'emploie pas directement la forme nominale « Al-Mughnî »."),
      S("Quand évoquer cette appellation", "Lorsqu'on demande à Allah une subsistance licite, la suffisance, la satisfaction du cœur et la préservation du besoin envers les créatures."),
      I("« Ô Allah, accorde-moi une subsistance licite, suffisante et bénie, et enrichis mon cœur par la foi et la satisfaction. »", None, EX),
      A("STATUT DISCUTÉ", "L'action d'enrichir est attestée dans le Coran. Le statut de « Al-Mughnî » comme Nom divin indépendant est discuté. Afficher une mention de prudence.", AN)),

    F(90, 89, "الْمَانِعُ", "Al-Mâni'", "Celui qui empêche et qui retient selon Sa sagesse.", "Terme présent dans un hadith authentique ; Nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Rien ne peut empêcher ce qu'Allah accorde, et personne ne peut accorder ce qu'Il décide de retenir. Le croyant apprend ainsi à reconnaître que les bienfaits, les possibilités et les événements dépendent du décret d'Allah.

        Cela ne signifie pas que chaque difficulté ou chaque privation soit nécessairement une punition. Nous ne connaissons pas toujours la sagesse qui se trouve derrière ce qui nous est accordé ou refusé."""),
      S(RAP, """
        - Allah est le Maître de ce qu'Il accorde et de ce qu'Il retient.
        - Nous devons accepter Son décret tout en continuant à faire les efforts permis.
        - Ne pas envier les bienfaits accordés aux autres.
        - Demander à Allah ce qui est bon pour nous."""),
      P("Preuve dans la Sunna authentique", "اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ",
        "Le Prophète ﷺ disait après les prières obligatoires :\n\nAllâhumma lâ mâni'a limâ a'tayta wa lâ mu'tiya limâ mana'ta.\n\n« Ô Allah, nul ne peut empêcher ce que Tu as accordé et nul ne peut accorder ce que Tu as empêché. »",
        "- Sahih Al-Bukhârî, hadith 844.\n- Sahih Muslim, hadith 593e.", "sahih", """
        Authenticité : Hadith authentique rapporté par Al-Bukhârî et Muslim.

        Précision importante : Le hadith contient le mot « mâni' » dans une phrase qui décrit le pouvoir absolu d'Allah. Cela ne signifie pas que tous les savants considèrent automatiquement « Al-Mâni' » comme un Nom divin indépendant."""),
      S("Quand évoquer cette appellation", "Lorsqu'on accepte une situation difficile, qu'on demande à Allah de nous accorder un bienfait ou qu'on cherche à ne pas s'attacher excessivement aux choses matérielles."),
      I("« Ô Allah, accorde-moi ce qui est bénéfique pour ma foi et ma vie, et préserve-moi de ce qui pourrait me nuire. »", None, EX),
      A("STATUT DISCUTÉ", "Le terme apparaît dans une invocation prophétique authentique. Son statut comme Nom divin indépendant doit être présenté avec prudence.", AN)),

    # Ad-Dârr : texte du lot 10 + encadré « À savoir » des captures #175-177
    F(91, 90, "الضَّارُّ", "Ad-Dârr", "Celui qui peut faire advenir le mal ou l'épreuve selon Sa sagesse et Son décret.",
      "Nom mentionné dans certaines listes traditionnelles des 99 noms.", "non_etabli", "discute",
      S(E, """
        Rien ne peut survenir en dehors du décret d'Allah. Les épreuves, les difficultés et les événements douloureux ne Lui échappent pas. Allah est le Créateur de toute chose et rien ne peut se produire contre Sa volonté.

        Il faut cependant être extrêmement prudent avec cette appellation. La forme exacte « Ad-Dârr » n'est pas établie explicitement comme Nom divin dans le Coran ou dans un hadith authentique clair. Elle apparaît dans certaines listes traditionnelles, souvent associée à « An-Nâfi' ».

        Il ne faut surtout pas comprendre cette appellation comme si Allah faisait du mal par injustice, cruauté ou défaut de sagesse. Allah est parfaitement juste et sage. Une épreuve peut comporter une sagesse que nous ne sommes pas capables de comprendre."""),
      D("""
        L'établissement d'Ad-Dârr comme nom indépendant d'Allah n'est pas unanimement reconnu. Certains savants ne retiennent pas ce nom isolément et considèrent qu'il doit être associé à An-Nâfi'.

        Par prudence, nous signalons cette divergence et ne présentons pas ce nom comme unanimement établi."""),
      S(RAP, """
        - Rien ne peut arriver sans que cela soit connu d'Allah.
        - Les épreuves ne doivent pas nous faire perdre confiance en Lui.
        - Nous devons rechercher la protection d'Allah contre les difficultés et les préjudices.
        - Ne pas attribuer à Allah une injustice ou une imperfection.
        - Garder confiance en Sa sagesse même lorsque nous ne comprenons pas une situation."""),
      P("Preuve liée au sens dans le Coran", "وَإِنْ يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ", "« Si Allah fait qu'un malheur te touche, nul autre que Lui ne peut l'enlever. »",
        "Coran, sourate Al-An'âm (6), verset 17.", "coran",
        "Précision importante : Ce verset affirme qu'Allah a pouvoir sur l'épreuve et qu'Il est Celui qui peut la dissiper. Il ne contient pas le Nom exact « Ad-Dârr »."),
      S("Quand évoquer cette appellation", """
        Il est préférable d'invoquer Allah avec les formules authentiques de protection et de demander qu'Il éloigne de nous les épreuves et les préjudices, plutôt que de faire de « Ad-Dârr » une formule d'invocation particulière.

        Par prudence, nous ne proposons pas de formule d'invocation spécifique fondée sur ce nom, puisque son établissement comme nom divin est discuté."""),
      I("« Ô Allah, protège-moi de tout mal, éloigne de moi les épreuves qui pourraient nuire à ma foi et accorde-moi le bien ici-bas et dans l'au-delà. »", None, EX),
      A("NON ÉTABLI", "La souveraineté d'Allah sur les épreuves est attestée dans le Coran. En revanche, « Ad-Dârr » comme Nom divin indépendant n'est pas établi par une preuve explicite et authentique suffisamment claire. Afficher une mention de prudence renforcée.", AN)),
]
