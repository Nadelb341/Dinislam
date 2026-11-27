from outils import F, S, P, I, A, D, FP_LONG, FP_RAPPEL

E = "Explication"
ENS = "Ce que ce nom nous enseigne"
Q = "Quand invoquer Allah par ce nom"
EX = "Exemple d'invocation personnelle"
PC = "Preuve dans le Coran"
AUT = "Nom attesté dans le Coran."
PROV = "Coran — nom attesté."

FICHES = [
    F(41, 41, "الْجَلِيلُ", "Al-Jalîl", "Le Majestueux, Celui qui possède la majesté et la grandeur.",
      "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Jalîl est traditionnellement expliqué comme Celui qui possède une majesté, une grandeur et une noblesse parfaites.

        Allah est digne de toute vénération. Sa grandeur ne ressemble à aucune grandeur créée et rien ne peut être comparé à Lui.

        Ce nom est présent dans les listes traditionnelles des 99 noms. Il faut cependant apporter une précision importante : la forme exacte « Al-Jalîl » n'apparaît pas dans le Coran comme nom indépendant. Le Coran emploie notamment le terme « Al-Jalâl » dans l'expression « Dhul-Jalâli wal-Ikrâm ».

        Il convient donc de distinguer le sens coranique de la majesté divine et le statut de la forme Al-Jalîl comme nom indépendant."""),
      S(ENS, """
        - Reconnaître la majesté et la grandeur absolues d'Allah.
        - Le glorifier avec respect et humilité.
        - Ne pas laisser l'orgueil prendre place dans notre cœur.
        - Comprendre que toute grandeur créée reste limitée."""),
      P("Preuve coranique liée à son sens", None, "« Et subsistera la Face de ton Seigneur, plein de majesté et de noblesse. »", "Sourate Ar-Rahmân, 55:27.", "coran",
        "Autre référence : Sourate Ar-Rahmân, 55:78."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - La racine liée à la majesté est attestée dans le Coran.
        - La forme exacte Al-Jalîl n'apparaît pas comme nom indépendant dans le texte coranique.
        - Son statut comme nom divin indépendant est discuté dans les travaux consacrés à l'établissement des noms d'Allah."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur la majesté d'Allah et Le glorifier. Par prudence, ne pas présenter une formule d'invocation particulière avec Al-Jalîl comme une formule prophétique établie."),
      I("« Ô Allah, Toi le Seigneur de la majesté et de la noblesse, remplis mon cœur de respect envers Toi et éloigne-moi de l'orgueil. »", FP_RAPPEL, "Exemple de glorification personnelle"),
      A("STATUT DISCUTÉ", "La racine et le sens de la majesté sont bien présents dans le Coran, notamment dans l'expression « Dhul-Jalâli wal-Ikrâm », mais la forme exacte Al-Jalîl n'y apparaît pas comme nom indépendant.")),

    F(42, 42, "الْكَرِيمُ", "Al-Karîm", "Le Très Généreux, Le Noble.", PROV, "etabli", "coran",
      S(E, """
        Al-Karîm désigne Allah comme Celui dont la générosité est parfaite et immense.

        Il accorde Ses bienfaits à Ses créatures, pardonne à ceux qui reviennent vers Lui et récompense généreusement Ses serviteurs.

        Sa générosité ne se limite pas aux biens matériels : elle englobe Ses bienfaits, Sa guidance, Son pardon et les récompenses qu'Il réserve aux croyants.

        Allah n'a besoin de personne et donne par Sa grâce et Sa sagesse.

        Ce nom nous invite à ne jamais désespérer de Sa générosité et à apprendre nous-mêmes à être généreux envers les autres."""),
      S(ENS, """
        - Reconnaître que tous nos bienfaits viennent d'Allah.
        - Être reconnaissants pour ce que nous possédons.
        - Être généreux avec les autres, selon nos moyens.
        - Ne pas désespérer de la générosité et du pardon d'Allah."""),
      P(PC, None, "« Ô homme ! Qu'est-ce qui t'a trompé au sujet de ton Seigneur, le Noble ? »", "Sourate Al-Infitar, 82:6.", "coran",
        "Autre référence : Sourate An-Naml, 27:40."),
      S(Q, "Lorsque nous demandons à Allah Ses bienfaits, Sa générosité, Son pardon et une subsistance bénie."),
      I("« Ô Allah, Al-Karîm, accorde-moi de Tes bienfaits, pardonne mes erreurs et aide-moi à être généreux envers ceux qui m'entourent. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(43, 43, "الرَّقِيبُ", "Ar-Raqîb", "Le Vigilant, Celui qui observe et veille sur toute chose.", PROV, "etabli", "coran",
      S(E, """
        Ar-Raqîb signifie qu'Allah veille parfaitement sur Sa création.

        Rien ne Lui échappe : Il connaît les actes visibles comme les actes cachés, les paroles prononcées comme les intentions.

        Sa surveillance n'est jamais distraite et ne connaît aucune défaillance.

        Ce nom nous rappelle que même lorsque nous sommes seuls, Allah connaît parfaitement nos actes.

        Il nous encourage à adopter un comportement sincère, aussi bien en public qu'en privé."""),
      S(ENS, """
        - Être sincères dans nos actes.
        - Éviter les mauvaises actions même lorsque personne ne nous voit.
        - Faire attention à nos paroles et à nos comportements.
        - Se rappeler qu'Allah connaît parfaitement notre situation."""),
      P(PC, None, "« Certes, Allah vous observe parfaitement. »", "Sourate An-Nisâ', 4:1.", "coran", "Autre référence : Sourate Al-Mâ'ida, 5:117."),
      S(Q, "Lorsque nous demandons à Allah de nous aider à rester sincères, à maîtriser nos comportements et à nous éloigner de ce qui Lui déplaît."),
      I("« Ô Allah, Ar-Raqîb, aide-moi à me rappeler que Tu me vois en toute circonstance et accorde-moi la sincérité dans mes actes et mes intentions. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(44, 44, "الْمُجِيبُ", "Al-Mujîb", "Celui qui répond aux invocations.", PROV, "etabli", "coran",
      S(E, """
        Al-Mujîb désigne Allah comme Celui qui répond aux appels de Ses serviteurs.

        Il entend leurs demandes et répond selon Sa sagesse.

        La réponse à une invocation ne prend pas nécessairement la forme exacte ou immédiate que nous souhaitons. Allah sait ce qui est bénéfique pour chacun.

        Le croyant est donc invité à invoquer Allah avec confiance, sincérité et persévérance, sans imposer à son Seigneur la manière ou le moment de la réponse."""),
      S(ENS, """
        - Ne jamais cesser d'invoquer Allah.
        - Lui adresser nos besoins avec sincérité.
        - Garder confiance en Sa sagesse.
        - Ne pas désespérer lorsque la réponse semble tarder.
        - Comprendre que la réponse d'Allah peut être différente de ce que nous avions imaginé."""),
      P(PC, None, "« Mon Seigneur est bien proche et Il répond toujours aux appels. »", "Sourate Hûd, 11:61.", "coran"),
      S(Q, "Lorsque nous faisons une invocation, lorsque nous demandons Son aide ou lorsque nous avons besoin de réconfort et de confiance dans Sa réponse."),
      I("« Ô Allah, Al-Mujîb, Toi qui réponds aux appels, accorde-moi ce qui est bon pour ma religion et ma vie, et guide-moi vers ce qui Te satisfait. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(45, 45, "الْوَاسِعُ", "Al-Wâsi'", "L'Immense, Celui dont la science, la miséricorde et la générosité sont sans limites.", PROV, "etabli", "coran",
      S(E, """
        Al-Wâsi' exprime l'immensité et l'étendue parfaites d'Allah.

        Sa science englobe toute chose. Sa miséricorde et Sa générosité sont immenses, et Sa puissance n'est limitée par rien.

        Aucun besoin de Ses créatures ne dépasse Sa capacité et aucune situation ne Lui échappe.

        Ce nom nous rappelle que nous ne devons pas réduire la miséricorde d'Allah à nos propres limites ou à notre compréhension humaine."""),
      S(ENS, """
        - Ne pas désespérer de la miséricorde d'Allah.
        - Reconnaître l'immensité de Sa science et de Sa puissance.
        - Lui demander Ses bienfaits avec confiance.
        - Être généreux envers les autres dans la mesure de nos possibilités."""),
      P(PC, None, "« À Allah seul appartiennent l'Est et l'Ouest. Où que vous vous tourniez, la Face d'Allah est là. Certes, Allah est Immense et Omniscient. »",
        "Sourate Al-Baqara, 2:115.", "coran", "Autre référence : Sourate Al-Baqara, 2:261."),
      S(Q, "Lorsque nous demandons à Allah l'étendue de Sa miséricorde, de Ses bienfaits, de Sa science et de Sa générosité."),
      I("« Ô Allah, Al-Wâsi', Ta miséricorde et Ta générosité sont immenses. Accorde-moi Ta grâce et ouvre-moi les portes du bien. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(46, 46, "الْحَكِيمُ", "Al-Hakîm", "Le Sage, Celui dont la sagesse est parfaite.", PROV, "etabli", "coran",
      S(E, """
        Al-Hakîm signifie qu'Allah possède une sagesse parfaite dans Ses paroles, Ses décisions, Ses actes et Sa législation.

        Rien de ce qu'Il décide n'est dépourvu de sagesse, même si les êtres humains ne comprennent pas toujours les raisons de ce qui leur arrive.

        Sa sagesse est parfaite et ne comporte ni erreur, ni injustice, ni ignorance.

        Ce nom nous apprend à faire confiance à Allah lorsque nous traversons des situations dont nous ne comprenons pas immédiatement le sens."""),
      S(ENS, """
        - Faire confiance à la sagesse d'Allah.
        - Ne pas juger trop rapidement les événements que nous ne comprenons pas.
        - Rechercher la sagesse dans nos propres décisions.
        - Agir avec réflexion, justice et modération."""),
      P(PC, None, "« Gloire à Toi ! Nous n'avons de savoir que ce que Tu nous as appris. Certes, c'est Toi l'Omniscient, le Sage. »",
        "Sourate Al-Baqara, 2:32.", "coran", "Autre référence : Sourate Al-An'âm, 6:18."),
      S(Q, "Lorsque nous demandons à Allah de nous guider dans une décision, de nous accorder la sagesse et de nous aider à accepter ce que nous ne comprenons pas."),
      I("« Ô Allah, Al-Hakîm, guide-moi vers les bonnes décisions, accorde-moi la sagesse et aide-moi à accepter Tes décrets avec confiance. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(47, 47, "الْوَدُودُ", "Al-Wadûd", "Le Tout-Affectueux, Celui qui aime Ses serviteurs croyants et qui est digne d'être aimé.", PROV, "etabli", "coran",
      S(E, """
        Al-Wadûd exprime l'amour parfait d'Allah.

        Allah aime Ses serviteurs croyants et vertueux, et Il est Celui qui mérite le plus d'être aimé, adoré et obéi.

        Son amour est digne de Sa majesté et ne ressemble pas à l'amour des créatures.

        Ce nom nous rappelle que la relation du croyant avec Allah ne repose pas uniquement sur la crainte : elle comprend également l'amour, l'espoir et la confiance.

        Le croyant cherche à se rapprocher d'Allah par la foi et les bonnes œuvres."""),
      S(ENS, """
        - Aimer Allah plus que toute autre chose.
        - Rechercher ce qui Lui plaît.
        - Développer l'amour, la bienveillance et la miséricorde envers les autres.
        - Espérer l'amour et l'agrément d'Allah.
        - Ne pas confondre l'amour d'Allah avec les sentiments humains."""),
      P(PC, None, "« Mon Seigneur est certes Miséricordieux et Tout-Affectueux. »", "Sourate Hûd, 11:90.", "coran", "Autre référence : Sourate Al-Burûj, 85:14."),
      S(Q, "Lorsque nous demandons à Allah de nous accorder Son amour, de nous rapprocher de Lui et de faire grandir notre amour pour Lui."),
      I("« Ô Allah, Al-Wadûd, accorde-moi Ton amour, aide-moi à T'aimer sincèrement et à accomplir les œuvres qui Te satisfont. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(48, 48, "الْمَجِيدُ", "Al-Majîd", "Le Très Glorieux, Celui dont la noblesse et la gloire sont parfaites.", PROV, "etabli", "coran",
      S(E, """
        Al-Majîd désigne Allah comme Celui qui possède une gloire, une noblesse et une grandeur parfaites.

        Il est digne de toute louange et de toute glorification.

        Sa générosité, Sa majesté et Ses attributs sont parfaits. Rien ne peut égaler Sa gloire.

        Ce nom nous invite à glorifier Allah, à reconnaître Ses bienfaits et à ne jamais attribuer à une créature une perfection qui n'appartient qu'à Lui."""),
      S(ENS, """
        - Glorifier Allah et Le louer.
        - Reconnaître la perfection de Ses attributs.
        - Être reconnaissants pour Ses bienfaits.
        - Développer l'humilité et la sincérité dans l'adoration."""),
      P(PC, None, "« Glorieux est Celui qui détient le Trône. »", "Sourate Al-Burûj, 85:15.", "coran",
        "Le verset emploie le terme « Al-Majîd » pour qualifier Allah."),
      P("Preuve dans la Sunna", texte="Le nom Al-Majîd apparaît également dans la formule de prière sur le Prophète ﷺ enseignée dans les hadiths authentiques, avec les termes « Hamîd » et « Majîd ».",
        ref="Sahîh Al-Bukhârî, 3370 ; Sahîh Muslim, 406.", degre="sahih"),
      S(Q, "Lorsque nous glorifions Allah et Lui demandons de nous accorder Sa grâce et Son bienfait."),
      I("« Ô Allah, Al-Majîd, Toi qui possèdes la gloire parfaite, accorde-moi Ta grâce et aide-moi à Te glorifier avec sincérité. »",
        "Cette formulation est une invocation personnelle. Le nom Al-Majîd apparaît bien dans une formule de prière rapportée authentiquement, mais cette phrase complète n'est pas une citation de cette formule.", EX),
      A("CORAN", AUT)),

    F(49, 49, "الْبَاعِثُ", "Al-Bâ'ith", "Celui qui ressuscite les morts et les fait se relever.",
      "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Bâ'ith est traditionnellement expliqué comme Celui qui ressuscitera les êtres humains après leur mort.

        Allah fera revivre les morts au Jour de la Résurrection afin qu'ils soient rassemblés et jugés selon Ses décisions parfaitement justes.

        La croyance en la Résurrection est un pilier fondamental de la foi en l'au-delà.

        Il faut toutefois distinguer la preuve de l'acte divin de ressusciter et l'établissement de la forme Al-Bâ'ith comme nom indépendant : le Coran affirme clairement qu'Allah ressuscitera les morts, mais la forme exacte Al-Bâ'ith n'y apparaît pas comme nom indépendant dans les versets cités."""),
      S(ENS, """
        - Croire fermement au Jour de la Résurrection.
        - Se rappeler que la vie présente est temporaire.
        - Préparer l'au-delà par la foi et les bonnes œuvres.
        - Ne pas considérer la mort comme la fin de toute existence."""),
      P(PC, None, "« Et que l'Heure arrivera, pas de doute à son sujet, et qu'Allah ressuscitera ceux qui sont dans les tombeaux. »", "Sourate Al-Hajj, 22:7.", "coran",
        "Le verset affirme explicitement l'acte d'Allah consistant à ressusciter les morts. Il ne contient pas la forme nominale Al-Bâ'ith."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - L'acte de ressusciter les morts est clairement affirmé dans le Coran.
        - La forme exacte Al-Bâ'ith n'apparaît pas comme nom indépendant dans le verset cité.
        - Son établissement comme nom divin indépendant est discuté : ne pas le présenter comme unanimement établi sur la seule base du verbe coranique."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur le pouvoir d'Allah de ressusciter les morts et sur la réalité du Jour dernier. Par prudence, ne pas présenter une formule spécifique avec Al-Bâ'ith comme une invocation prophétique établie."),
      I("« Ô Allah, Toi qui ressusciteras les morts, raffermis ma foi en l'au-delà et aide-moi à préparer ma rencontre avec Toi par de bonnes œuvres. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ", "Le Coran emploie le verbe « ressusciter », mais cela ne suffit pas à établir sans discussion la forme Al-Bâ'ith comme nom indépendant.")),

    F(50, 50, "الشَّهِيدُ", "Ash-Shahîd", "Le Témoin, Celui qui est témoin de toute chose.", PROV, "etabli", "coran",
      S(E, """
        Ash-Shahîd signifie qu'Allah est témoin de toute chose.

        Il connaît parfaitement les événements, les actes, les paroles et les intentions. Rien ne se déroule sans qu'Il en ait connaissance.

        Il est témoin de ce qui est visible comme de ce qui est caché.

        Son témoignage est parfait et Sa connaissance ne comporte aucune erreur ni aucun oubli.

        Ce nom nous rappelle que même lorsque les hommes ne voient pas une injustice ou ne reconnaissent pas un effort, Allah en est parfaitement témoin."""),
      S(ENS, """
        - Être sincères dans nos actes, même lorsque personne ne nous observe.
        - Éviter l'injustice et les mauvaises paroles.
        - Garder confiance en la justice d'Allah.
        - Se rappeler que rien de ce que nous faisons n'est oublié auprès de Lui."""),
      P(PC, None, "« Et Allah suffit comme témoin. »", "Sourate An-Nisâ', 4:79.", "coran", "Autre référence : Sourate Al-Hajj, 22:17."),
      S(Q, "Lorsque nous demandons à Allah de nous aider à être sincères, de témoigner de notre situation et de nous accorder la patience face à une injustice."),
      I("« Ô Allah, Ash-Shahîd, Tu es témoin de toute chose. Aide-moi à être sincère, protège-moi de l'injustice et accorde-moi la patience dans les épreuves. »", FP_LONG, EX),
      A("CORAN", AUT)),
]
