from outils import F, S, P, I, A, PR, FP_LONG

E = "Explication"
ENS = "Ce que ce nom nous enseigne"
Q = "Quand invoquer Allah par ce nom"
EX = "Exemple d'invocation personnelle"
PC = "Preuve dans le Coran"
AUT = "Nom attesté dans le Coran."
PROV = "Coran — nom attesté."

FICHES = [
    F(31, 31, "الْخَبِيرُ", "Al-Khabîr", "Le Parfaitement Informé, Celui qui connaît parfaitement toute chose.", PROV, "etabli", "coran",
      S(E, """
        Al-Khabîr signifie qu'Allah possède une connaissance parfaite, complète et profonde de toute chose.

        Il connaît ce qui est apparent comme ce qui est caché, les actes comme les intentions, les paroles prononcées comme les pensées que personne d'autre ne peut connaître.

        Rien ne Lui échappe, même les réalités les plus discrètes ou les plus imperceptibles.

        Sa connaissance n'est ni limitée, ni acquise progressivement : Allah connaît toute chose parfaitement.

        Ce nom nous rappelle que nous pouvons être sincères devant Allah même lorsque personne ne voit nos efforts, nos difficultés ou nos bonnes intentions."""),
      S(ENS, """
        - Allah connaît parfaitement notre situation, même lorsque nous ne savons pas expliquer ce que nous traversons.
        - Nos intentions ont une importance réelle auprès de Lui.
        - Nous devons chercher la sincérité dans nos actes, même lorsque personne ne nous observe.
        - Nous pouvons Lui confier ce que nous gardons au fond de nous."""),
      P(PC, None, "« C'est Lui qui est le Créateur, le Parfaitement Connaisseur des réalités les plus subtiles, le Parfaitement Informé. »",
        "Sourate Al-An'âm, 6:103.", "coran", "Autre référence : Sourate Al-Mulk, 67:14."),
      S(Q, "Lorsque nous souhaitons Lui confier une situation complexe, une intention que les autres ne comprennent pas ou une difficulté que nous n'arrivons pas à exprimer."),
      I("« Ô Allah, Toi qui connais parfaitement toute chose, Tu connais ce que je montre et ce que je cache. Guide-moi vers ce qui est bon et purifie mes intentions. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(32, 32, "الْحَلِيمُ", "Al-Halîm", "Le Longanime, Celui qui ne se hâte pas de punir.", PROV, "etabli", "coran",
      S(E, """
        Al-Halîm désigne Allah comme Celui qui fait preuve d'une immense clémence et qui ne se hâte pas de punir Ses serviteurs malgré leurs fautes.

        Il leur accorde un délai, leur laisse la possibilité de revenir vers Lui et leur ouvre la porte du repentir.

        Sa longanimité ne signifie jamais qu'Il ignore les injustices ou qu'Il approuve les péchés. Elle manifeste plutôt Sa parfaite sagesse et Sa clémence.

        Ce nom nous rappelle qu'Allah ne précipite pas nécessairement le châtiment et qu'il ne faut jamais désespérer de Sa miséricorde."""),
      S(ENS, """
        - Ne jamais désespérer du repentir.
        - Ne pas considérer le délai accordé par Allah comme une approbation de nos fautes.
        - Apprendre à maîtriser notre colère et à faire preuve de patience envers les autres.
        - Revenir vers Allah avant qu'il ne soit trop tard."""),
      P(PC, None, "« Allah est Pardonneur et Longanime. »", "Sourate Al-Baqara, 2:225.", "coran", "Autre référence : Sourate Fâtir, 35:41."),
      S(Q, "Lorsque nous demandons à Allah de nous pardonner, de nous accorder Sa clémence et de nous aider à revenir sincèrement vers Lui."),
      I("« Ô Allah, Al-Halîm, accorde-moi Ton pardon, aide-moi à délaisser mes mauvaises habitudes et apprends-moi à faire preuve de patience et de clémence envers les autres. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(33, 33, "الْعَظِيمُ", "Al-'Azîm", "L'Immense, Le Magnifique, Celui dont la grandeur est absolue.", PROV, "etabli", "coran",
      S(E, """
        Al-'Azîm signifie qu'Allah possède une grandeur absolue, parfaite et incomparable.

        Sa grandeur concerne Son être, Ses noms, Ses attributs, Sa puissance et Sa majesté.

        Aucune créature ne peut être comparée à Lui. Toute grandeur dans la création reste limitée, tandis que la grandeur d'Allah est parfaite et sans limite.

        Ce nom nous rappelle notre place de serviteurs devant notre Seigneur et nous invite à Le glorifier avec sincérité."""),
      S(ENS, """
        - Allah est infiniment supérieur à toute Sa création.
        - Nous devons Le glorifier et reconnaître Sa grandeur.
        - Nos difficultés, aussi importantes nous paraissent-elles, ne dépassent jamais Sa puissance.
        - L'humilité est une qualité essentielle du croyant."""),
      P(PC, None, "Dans le verset du Trône :\n\n« ... et Il est le Très-Haut, le Très-Grand. »", "Sourate Al-Baqara, 2:255.", "coran",
        "Autre référence : Sourate Ash-Shûrâ, 42:4."),
      S(Q, "Lorsqu'on glorifie Allah, notamment dans les moments de prière, de prosternation, de méditation et lorsque l'on souhaite reconnaître Sa grandeur."),
      I("« Ô Allah, Al-'Azîm, Toi dont la grandeur est absolue, remplis mon cœur de respect envers Toi et aide-moi à T'adorer avec humilité et sincérité. »",
        "Cette formulation est une invocation personnelle. Le terme « Al-'Azîm » apparaît également dans les formules de glorification rapportées dans la tradition prophétique.", EX),
      A("CORAN", AUT)),

    F(34, 34, "الْغَفُورُ", "Al-Ghafûr", "Le Très Pardonneur, Celui qui pardonne abondamment.", PROV, "etabli", "coran",
      S(E, """
        Al-Ghafûr désigne Allah comme Celui dont le pardon est immense et qui pardonne abondamment à Ses serviteurs lorsqu'ils reviennent sincèrement vers Lui.

        Ce nom exprime l'étendue de Son pardon : malgré les fautes répétées de l'être humain, la porte du repentir reste ouverte tant que les conditions du repentir sont réunies et que le délai accordé n'est pas dépassé.

        Allah connaît nos faiblesses, mais Il nous appelle à ne pas désespérer de Sa miséricorde.

        Il ne faut toutefois pas confondre l'espoir en Son pardon avec le fait de persister volontairement dans le péché sans repentir."""),
      S(ENS, """
        - Ne jamais désespérer de la miséricorde d'Allah.
        - Reconnaître ses erreurs et demander pardon.
        - Délaisser le péché et regretter sincèrement ses actes.
        - Espérer le pardon d'Allah tout en faisant les efforts nécessaires pour changer."""),
      P(PC, None, "« Informe Mes serviteurs que c'est Moi le Pardonneur, le Très Miséricordieux. »", "Sourate Al-Hijr, 15:49.", "coran",
        "Autre référence : Sourate Az-Zumar, 39:53."),
      S(Q, "Lorsque nous demandons pardon pour nos péchés, après une erreur ou dans le cadre de notre repentir."),
      I("« Ô Allah, Al-Ghafûr, pardonne mes péchés, efface mes erreurs et aide-moi à ne pas retourner vers ce qui Te déplaît. »", None, EX),
      PR("Invocation prophétique à distinguer", None, None,
         "Le Prophète ﷺ a enseigné notamment :\n\n« Ô Allah, Tu es Pardonneur et Tu aimes le pardon, alors pardonne-moi. »",
         "Jâmi' At-Tirmidhî, 3513, invocation rapportée dans le hadith de 'Â'isha au sujet de la nuit du Destin. Hadith jugé authentique par At-Tirmidhî.",
         "sahih", None, "Important : cette invocation prophétique emploie le nom Al-'Afuww, et non Al-Ghafûr. Ne pas mélanger les deux noms dans la citation."),
      A("CORAN", AUT)),

    F(35, 35, "الشَّكُورُ", "Ash-Shakûr", "Celui qui reconnaît et récompense abondamment les œuvres de Ses serviteurs.", PROV, "etabli", "coran",
      S(E, """
        Ash-Shakûr signifie qu'Allah apprécie les œuvres accomplies sincèrement pour Lui et qu'Il les récompense généreusement.

        Il peut accorder une immense récompense pour une œuvre qui paraît petite aux yeux des hommes.

        Allah n'a besoin d'aucune de nos actions : c'est nous qui avons besoin de Lui. Sa récompense est une faveur qu'Il accorde à Ses serviteurs.

        Ce nom nous enseigne qu'aucune bonne action accomplie sincèrement n'est insignifiante auprès d'Allah."""),
      S(ENS, """
        - Ne jamais mépriser une petite bonne action.
        - Accomplir nos œuvres avec sincérité.
        - Persévérer dans le bien, même lorsque les résultats ne sont pas visibles.
        - Être reconnaissants envers Allah pour Ses bienfaits."""),
      P(PC, None, "« ... afin qu'Il leur donne leurs récompenses et augmente encore Sa grâce. Il est certes Pardonneur et Reconnaissant. »",
        "Sourate Fâtir, 35:30.", "coran", "Autre référence : Sourate Fâtir, 35:34."),
      S(Q, "Lorsque nous demandons à Allah d'accepter nos bonnes œuvres et de nous accorder Sa récompense et Sa grâce."),
      I("« Ô Allah, Ash-Shakûr, accepte mes efforts, même lorsqu'ils me semblent modestes, et accorde-moi une récompense par Ta générosité. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(36, 36, "الْعَلِيُّ", "Al-'Aliyy", "Le Très-Haut, Celui qui est élevé au-dessus de toute Sa création.", PROV, "etabli", "coran",
      S(E, """
        Al-'Aliyy signifie qu'Allah est le Très-Haut.

        Sa hauteur et Son élévation sont dignes de Sa majesté et ne ressemblent en rien à celles des créatures.

        Allah est élevé dans Son essence, Sa puissance, Sa domination et Sa grandeur. Rien ne Lui est comparable.

        Ce nom nous rappelle qu'Allah est au-dessus de Sa création et qu'Il possède la perfection absolue."""),
      S(ENS, """
        - Reconnaître la grandeur et l'élévation d'Allah.
        - Ne jamais comparer Allah à Ses créatures.
        - Élever notre cœur vers l'adoration d'Allah plutôt que de nous attacher excessivement aux choses de ce monde.
        - Garder confiance en Celui qui est au-dessus de toute chose."""),
      P(PC, None, "« ... et Il est le Très-Haut, le Très-Grand. »", "Sourate Al-Baqara, 2:255.", "coran", "Autre référence : Sourate Ash-Shûrâ, 42:4."),
      S(Q, "Lorsque nous glorifions Allah et reconnaissons Son élévation et Sa grandeur."),
      I("« Ô Allah, Al-'Aliyy, Toi qui es le Très-Haut, élève mon cœur dans la foi, éloigne-moi de l'orgueil et rapproche-moi de ce qui Te satisfait. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(37, 37, "الْكَبِيرُ", "Al-Kabîr", "Le Très Grand, Celui dont la grandeur est incomparable.", PROV, "etabli", "coran",
      S(E, """
        Al-Kabîr désigne Allah comme Celui dont la grandeur dépasse toute grandeur.

        Sa grandeur est absolue et parfaite. Elle ne dépend ni du temps, ni de l'espace, ni de la reconnaissance des créatures.

        Tout ce qui existe dépend de Lui, tandis qu'Il n'a besoin de personne.

        Ce nom nous invite à relativiser notre propre importance et à reconnaître que la véritable grandeur appartient à Allah seul."""),
      S(ENS, """
        - Allah seul possède la grandeur absolue.
        - Nous devons nous éloigner de l'orgueil et de l'arrogance.
        - Notre réussite et nos capacités sont des bienfaits accordés par Allah.
        - Nous devons placer notre confiance en Celui qui est plus grand que toutes nos difficultés."""),
      P(PC, None, "« ... le Connaisseur de l'invisible et du visible, le Très Grand, le Très-Haut. »", "Sourate Ar-Ra'd, 13:9.", "coran",
        "Autre référence : Sourate Al-Hajj, 22:62."),
      S(Q, "Lorsque nous souhaitons glorifier Allah, reconnaître Sa grandeur et nous rappeler que rien ne peut égaler Sa puissance."),
      I("« Ô Allah, Al-Kabîr, Toi dont la grandeur est incomparable, éloigne mon cœur de l'orgueil et aide-moi à reconnaître ma dépendance envers Toi. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(38, 38, "الْحَفِيظُ", "Al-Hafîz", "Le Préservateur, Le Gardien.", PROV, "etabli", "coran",
      S(E, """
        Al-Hafîz désigne Allah comme Celui qui préserve et protège toute chose selon Sa sagesse.

        Il préserve Sa création, connaît parfaitement ce qu'elle contient et rien ne peut échapper à Sa connaissance ni à Sa puissance.

        Il est également Celui qui protège Ses serviteurs lorsqu'Il le veut et de la manière qu'Il veut.

        Cette protection ne signifie pas que le croyant ne connaîtra jamais d'épreuve ou de difficulté. Les prophètes eux-mêmes ont traversé de grandes épreuves.

        Ce nom nous apprend à rechercher la protection d'Allah tout en plaçant notre confiance en Lui."""),
      S(ENS, """
        - Demander la protection d'Allah contre le mal.
        - Lui confier nos proches et nos biens.
        - Garder confiance en Allah lors des épreuves.
        - Comprendre que Sa protection s'exerce selon Sa sagesse, même lorsque nous ne comprenons pas ce qui nous arrive."""),
      P(PC, None, "« ... car Allah est le meilleur gardien, et Il est le plus Miséricordieux des miséricordieux. »", "Sourate Yûsuf, 12:64.", "coran",
        "Autre référence : Sourate Hûd, 11:57."),
      S(Q, "Lorsque nous demandons à Allah de nous préserver, de protéger notre famille et de nous éloigner du mal."),
      I("« Ô Allah, Al-Hafîz, préserve-moi ainsi que ma famille, protège-nous du mal apparent et caché et guide-nous vers ce qui Te satisfait. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(39, 39, "الْمُقِيتُ", "Al-Muqît", "Le Pourvoyeur, Celui qui donne à chaque être ce qui lui est nécessaire.", PROV, "etabli", "coran",
      S(E, """
        Al-Muqît est un nom dont les explications des savants comprennent notamment l'idée de Celui qui pourvoit aux besoins de Ses créatures, qui veille sur elles et qui a pleine capacité sur toute chose.

        Allah connaît les besoins de chaque être et rien ne Lui échappe.

        Il accorde les moyens de subsistance et les ressources nécessaires à Ses créatures selon Sa sagesse.

        Ce nom nous rappelle que nos moyens de subsistance ne dépendent pas uniquement de nos efforts : ils sont également entre les mains d'Allah.

        Cela ne signifie pas qu'il faut abandonner les efforts. Le croyant recherche les moyens licites tout en plaçant sa confiance en Allah."""),
      S(ENS, """
        - Reconnaître qu'Allah est à l'origine de notre subsistance.
        - Être reconnaissants pour les bienfaits reçus.
        - Rechercher notre subsistance par des moyens licites.
        - Ne pas laisser la peur du manque nous éloigner de notre confiance en Allah."""),
      P(PC, None, "« ... et Allah est Puissant sur toute chose. »", "Sourate An-Nisâ', 4:85.", "coran",
        "Le verset contient le nom Al-Muqît dans l'expression arabe « مُقِيتًا »."),
      S(Q, "Lorsque nous demandons à Allah de faciliter notre subsistance, de nous accorder ce qui est bénéfique et de nous préserver du besoin."),
      I("« Ô Allah, Al-Muqît, accorde-moi une subsistance licite et bénie, pourvois à mes besoins et aide-moi à être reconnaissant envers Toi. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(40, 40, "الْحَسِيبُ", "Al-Hasîb", "Celui qui suffit à Ses serviteurs et Celui qui tient parfaitement compte de toute chose.", PROV, "etabli", "coran",
      S(E, """
        Al-Hasîb possède plusieurs sens complémentaires dans les explications des savants.

        Allah suffit à Ses serviteurs : ils peuvent placer leur confiance en Lui, car Il est Celui qui prend en charge leurs affaires selon Sa sagesse.

        Il est également Celui qui tient parfaitement compte de toute chose et dont aucun acte, aucune parole et aucune intention ne sont oubliés.

        Au Jour du Jugement, chaque être humain devra répondre de ses actes.

        Ce nom nous rappelle à la fois que nous pouvons nous en remettre à Allah et que nous devons vivre avec le sens de notre responsabilité devant Lui."""),
      S(ENS, """
        - Placer notre confiance en Allah.
        - Nous rappeler que nos actes ont des conséquences.
        - Être attentifs à nos paroles et à nos comportements.
        - Garder à l'esprit que la justice parfaite appartient à Allah.
        - Ne pas nous croire oubliés lorsque personne ne reconnaît nos efforts."""),
      P(PC, None, "« ... et Allah suffit comme Comptable. »", "Sourate An-Nisâ', 4:6.", "coran",
        "Autre référence : Sourate An-Nisâ', 4:86, où le nom Al-Hasîb apparaît également."),
      S(Q, "Lorsque nous remettons une affaire entre les mains d'Allah, lorsque nous avons besoin de nous en remettre à Lui ou lorsque nous demandons à être guidés vers un comportement juste."),
      I("« Ô Allah, Al-Hasîb, Toi qui suffis à Tes serviteurs et qui connais parfaitement leurs actes, aide-moi à placer ma confiance en Toi et à rendre compte de mes actions avec sincérité. »", FP_LONG, EX),
      A("CORAN", AUT)),
]
