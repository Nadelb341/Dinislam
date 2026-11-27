from outils import F, S, P, I, A, D, PR, FP_LONG, FP_RAPPEL

E = "Explication"
ENS = "Ce que ce nom nous enseigne"
Q = "Quand invoquer Allah par ce nom"
EX = "Exemple d'invocation personnelle"
PC = "Preuve dans le Coran"
AUT = "Nom explicitement attesté dans le Coran."
PROV = "Coran — nom explicitement attesté."

FICHES = [
    F(51, 51, "الْحَقُّ", "Al-Haqq", "Le Vrai, Celui dont l'existence et la vérité sont absolues.", PROV, "etabli", "coran",
      S(E, """
        Al-Haqq signifie qu'Allah est la Vérité absolue. Son existence est réelle et parfaite. Il n'y a aucune fausseté dans Ses paroles, Ses promesses ou Ses décisions.

        Il est Celui qui mérite véritablement d'être adoré. Tout ce qui existe dépend de Lui, tandis que Lui n'a besoin de personne.

        Ce nom nous rappelle que la vérité ultime appartient à Allah et que nous devons rechercher ce qui est juste dans nos croyances, nos paroles et nos actes."""),
      S(ENS, """
        - Reconnaître qu'Allah est la Vérité absolue.
        - Rechercher la vérité et nous éloigner du mensonge.
        - Placer notre confiance dans les promesses d'Allah.
        - Ne pas faire passer nos désirs personnels avant ce qui est juste."""),
      P(PC, None, "« Il en est ainsi parce qu'Allah est la Vérité, et que tout ce qu'ils invoquent en dehors de Lui est le faux. »", "Sourate Al-Hajj, 22:62.", "coran",
        "Autre référence : Sourate Luqmân, 31:30."),
      S(Q, "Lorsque nous recherchons la vérité, demandons à Allah de nous guider ou avons besoin de discernement face à une situation confuse."),
      I("« Ô Allah, Al-Haqq, guide-moi vers la vérité, aide-moi à la reconnaître et donne-moi la force de la suivre. Éloigne-moi du mensonge et de l'injustice. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(52, 52, "الْوَكِيلُ", "Al-Wakîl", "Le Garant, Celui à qui l'on peut confier toutes ses affaires.", PROV, "etabli", "coran",
      S(E, """
        Al-Wakîl désigne Allah comme Celui qui suffit à Ses serviteurs et à qui ils peuvent confier leurs affaires.

        Il connaît parfaitement leurs besoins et possède la puissance nécessaire pour gérer toute chose selon Sa sagesse.

        Placer sa confiance en Allah ne signifie pas abandonner les efforts ou les responsabilités. Le croyant prend les moyens licites, puis s'en remet à Allah pour le résultat.

        Ce nom nous apprend à ne pas dépendre exclusivement des créatures ou de nos propres capacités."""),
      S(ENS, """
        - Placer notre confiance en Allah.
        - Prendre les moyens nécessaires sans croire qu'ils produisent seuls les résultats.
        - Ne pas nous laisser envahir par l'inquiétude.
        - Confier nos affaires à Allah tout en assumant nos responsabilités."""),
      P(PC, None, "« Allah nous suffit ; Il est notre meilleur garant. »", "Sourate Âl 'Imrân, 3:173.", "coran", "Autre référence : Sourate Al-Ahzâb, 33:3."),
      S(Q, "Lorsque nous traversons une difficulté, prenons une décision ou confions une affaire importante à Allah."),
      I("« Ô Allah, Al-Wakîl, je Te confie mes affaires. Guide mes choix, facilite ce qui est bon pour moi et aide-moi à accepter Ton décret. »", None, EX),
      PR("Formule coranique à distinguer", None, "Hasbunallâhu wa ni'mal-wakîl", "Sens : « Allah nous suffit ; Il est notre meilleur garant. »",
         "Sourate Âl 'Imrân, 3:173.", "coran", "Cette expression est une formule coranique, prononcée par les croyants évoqués dans le verset."),
      A("CORAN", AUT)),

    F(53, 53, "الْقَوِيُّ", "Al-Qawiyy", "Le Très-Fort, Celui dont la force est parfaite.", PROV, "etabli", "coran",
      S(E, """
        Al-Qawiyy signifie qu'Allah possède une force et une puissance absolues.

        Sa force n'est accompagnée d'aucune faiblesse, fatigue ou diminution. Rien ne peut s'opposer à Sa volonté lorsqu'Il décide d'une chose.

        La force des créatures est limitée et dépend de ce qu'Allah leur accorde. La puissance d'Allah, elle, est parfaite et ne dépend de personne.

        Ce nom nous rappelle que nous pouvons demander Son aide dans les difficultés et que notre force humaine reste limitée."""),
      S(ENS, """
        - Reconnaître que la puissance absolue appartient à Allah.
        - Ne pas nous laisser impressionner au point d'oublier la puissance de notre Créateur.
        - Demander Son aide lorsque nous nous sentons faibles.
        - Ne pas utiliser notre propre force pour opprimer les autres."""),
      P(PC, None, "« Allah est certes Fort et Puissant. »", "Sourate Al-Hajj, 22:40.", "coran", "Autre référence : Sourate Al-Hajj, 22:74."),
      S(Q, "Lorsque nous avons besoin de force, de courage, de soutien et d'aide pour surmonter une difficulté."),
      I("« Ô Allah, Al-Qawiyy, accorde-moi la force de faire ce qui est juste, aide-moi à surmonter mes épreuves et préserve-moi de l'injustice. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(54, 54, "الْمَتِينُ", "Al-Matîn", "Le Ferme, Celui dont la puissance est parfaite et inébranlable.", PROV, "etabli", "coran",
      S(E, """
        Al-Matîn exprime la puissance parfaite d'Allah, qui ne connaît ni faiblesse, ni fatigue, ni interruption.

        Sa puissance est ferme et inébranlable. Rien ne peut l'affaiblir ou la limiter.

        Ce nom est associé à la force parfaite d'Allah et nous rappelle que Sa capacité à agir ne dépend d'aucune aide extérieure.

        Il ne faut pas comprendre cette fermeté comme une caractéristique physique comparable à celle des créatures : elle est digne de la majesté d'Allah."""),
      S(ENS, """
        - Reconnaître la puissance inébranlable d'Allah.
        - Ne pas perdre espoir lorsque les difficultés semblent insurmontables.
        - S'appuyer sur Allah sans abandonner nos efforts.
        - Comprendre que notre Seigneur n'est jamais affaibli par ce qu'Il crée."""),
      P(PC, None, "« En vérité, c'est Allah qui est le Grand Pourvoyeur, le Détenteur de la force, l'Inébranlable. »", "Sourate Adh-Dhâriyât, 51:58.", "coran"),
      S(Q, "Lorsque nous demandons à Allah de nous soutenir dans une épreuve ou de nous accorder la fermeté dans la foi."),
      I("« Ô Allah, Al-Matîn, raffermis mon cœur dans la foi, accorde-moi la persévérance et aide-moi à traverser les difficultés avec confiance en Toi. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(55, 55, "الْوَلِيُّ", "Al-Waliyy", "Le Protecteur, Celui qui prend en charge et soutient Ses serviteurs.", PROV, "etabli", "coran",
      S(E, """
        Al-Waliyy désigne Allah comme Celui qui prend en charge Ses serviteurs croyants, les soutient, les guide et veille sur leurs affaires.

        Il est leur Protecteur et leur Allié véritable.

        Son soutien est parfait et se manifeste selon Sa sagesse. Cela ne signifie pas que les croyants seront exempts de toute épreuve, mais qu'ils peuvent rechercher auprès d'Allah la guidance, le secours et la protection.

        Il faut distinguer Al-Waliyy, avec le sens de Protecteur et Allié, de Al-Wâlî, qui apparaît plus loin dans la liste traditionnelle et qui renvoie à la notion de Celui qui gouverne et administre."""),
      S(ENS, """
        - Rechercher la protection et la guidance d'Allah.
        - Placer notre confiance en Lui.
        - Nous rapprocher d'Allah par la foi et les bonnes œuvres.
        - Ne pas faire dépendre notre sécurité spirituelle uniquement des créatures."""),
      P(PC, None, "« Allah est le Protecteur de ceux qui ont la foi : Il les fait sortir des ténèbres vers la lumière. »", "Sourate Al-Baqara, 2:257.", "coran",
        "Autre référence : Sourate Ash-Shûrâ, 42:28."),
      S(Q, "Lorsque nous demandons à Allah Sa protection, Sa guidance, Son soutien et Son aide dans nos affaires."),
      I("« Ô Allah, Al-Waliyy, sois mon Protecteur, guide-moi vers ce qui Te satisfait et ne me laisse pas dépendre de mes seules forces. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(56, 56, "الْحَمِيدُ", "Al-Hamîd", "Le Digne de louange, Celui qui mérite toute louange.", PROV, "etabli", "coran",
      S(E, """
        Al-Hamîd signifie qu'Allah mérite toute louange en raison de Sa perfection, de Ses attributs et de Ses bienfaits.

        Il est digne d'être loué dans toutes les situations, car Sa perfection ne dépend pas de la reconnaissance des créatures.

        Les êtres humains Le louent pour Ses bienfaits, mais Il mérite également la louange pour ce qu'Il est.

        Ce nom nous invite à remercier Allah, à Le glorifier et à reconnaître Ses bienfaits dans notre quotidien."""),
      S(ENS, """
        - Louer Allah dans les moments faciles comme dans les moments difficiles.
        - Être reconnaissants pour Ses bienfaits.
        - Reconnaître que toute perfection appartient à Allah.
        - Ne pas attribuer à nous-mêmes le mérite exclusif de ce que nous possédons."""),
      P(PC, None, "« Si vous êtes ingrats, Allah se passe largement de vous. De Ses serviteurs, Il n'agrée pas la mécréance. Et si vous êtes reconnaissants, Il l'agrée pour vous. »",
        "Sourate Az-Zumar, 39:7.", "coran", """
        Autre référence : Sourate Ibrâhîm, 14:8.

        Le nom Al-Hamîd apparaît également explicitement dans Sourate Hûd, 11:73."""),
      S(Q, "Lorsque nous louons Allah, Le remercions pour Ses bienfaits ou souhaitons Lui exprimer notre reconnaissance."),
      I("« Ô Allah, Al-Hamîd, à Toi revient toute louange. Aide-moi à reconnaître Tes bienfaits et à Te remercier sincèrement en toute circonstance. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(57, 57, "الْمُحْصِي", "Al-Muhsî", "Celui qui dénombre parfaitement toute chose.", "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Muhsî est traditionnellement expliqué comme Celui qui connaît le nombre de toutes choses et qui en possède un dénombrement parfait.

        Rien n'échappe à la connaissance d'Allah : les créatures, leurs actes, leurs paroles et leurs œuvres sont parfaitement connus de Lui.

        Aucun détail ne Lui échappe et rien n'est oublié.

        Il faut cependant apporter une précision importante : le Coran établit clairement qu'Allah dénombre toute chose, mais la forme exacte Al-Muhsî comme nom indépendant n'est pas explicitement établie dans le Coran ou dans une Sunna authentique selon plusieurs avis de savants. Son inclusion dans les listes de noms divins est discutée."""),
      S(ENS, """
        - Se rappeler que tous nos actes sont connus d'Allah.
        - Ne jamais mépriser une petite bonne action.
        - Être attentifs à nos paroles et à nos comportements.
        - Comprendre que rien n'est oublié auprès d'Allah."""),
      P("Preuve dans le Coran liée à son sens", None, "« ... et Il dénombre exactement toute chose. »", "Sourate Al-Jinn, 72:28.", "coran",
        "Autre référence : Sourate An-Naba', 78:29."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - Le dénombrement parfait de toute chose est clairement affirmé dans le Coran.
        - La forme nominale exacte Al-Muhsî n'est pas explicitement établie dans le Coran ou dans une Sunna authentique selon plusieurs avis.
        - Son statut comme nom indépendant est discuté."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur le fait qu'Allah connaît et dénombre parfaitement toute chose. Ne pas présenter une formule particulière avec Al-Muhsî comme une invocation prophétique établie."),
      I("« Ô Allah, Toi qui connais et dénombres toute chose, aide-moi à accomplir de bonnes œuvres et à ne jamais sous-estimer l'importance de mes actes. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ")),

    F(58, 58, "الْمُبْدِئُ", "Al-Mubdi'", "Celui qui commence la création et qui donne l'origine à toute chose.", "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Mubdi' est traditionnellement expliqué comme Celui qui commence la création sans modèle préalable.

        Allah est à l'origine de toute chose. Il crée ce qui n'existait pas auparavant et donne à chaque créature son existence selon Sa volonté et Sa sagesse.

        Le Coran affirme clairement qu'Allah commence la création. Il faut toutefois distinguer cette affirmation de la forme nominale Al-Mubdi' : les versets cités emploient des formes verbales et ne suffisent pas, à eux seuls, à établir sans discussion un nom indépendant."""),
      S(ENS, """
        - Reconnaître qu'Allah est le Créateur de toute chose.
        - Comprendre que notre existence dépend entièrement de Lui.
        - Faire preuve d'humilité devant la grandeur de la création.
        - Méditer sur les signes d'Allah dans l'univers et dans notre propre existence."""),
      P("Preuve dans le Coran liée à son sens", None, "« C'est Lui qui commence la création puis la refait ; cela Lui est facile. »", "Sourate Yûnus, 10:4.", "coran",
        "Autre référence : Sourate Al-'Ankabût, 29:19."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - L'acte de commencer la création est clairement établi dans le Coran.
        - La forme exacte Al-Mubdi' n'apparaît pas comme nom indépendant dans les versets cités.
        - Son statut comme nom divin indépendant est discuté selon les critères retenus par les savants."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur le fait qu'Allah est à l'origine de toute création et Lui demander de nous guider dans les nouveaux projets et les nouvelles étapes de notre vie. Ne pas présenter une formule spécifique avec Al-Mubdi' comme une invocation prophétique établie."),
      I("« Ô Allah, Toi qui es à l'origine de toute création, facilite-moi les commencements bénéfiques et guide-moi vers ce qui est juste. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ")),

    F(59, 59, "الْمُعِيدُ", "Al-Mu'îd", "Celui qui ramène la création et qui ressuscite les êtres après leur mort.", "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Mu'îd est traditionnellement expliqué comme Celui qui ramène la création après l'avoir créée.

        Allah fera revivre les êtres humains après leur mort et les rassemblera au Jour de la Résurrection.

        Cette croyance est fondamentale dans l'islam : la mort n'est pas la fin de notre existence et chacun devra répondre de ses actes devant Allah.

        Il faut cependant distinguer la preuve coranique de l'acte de ramener la création de l'établissement de la forme nominale Al-Mu'îd comme nom indépendant. Les versets cités emploient des formes verbales ; son statut nominal est discuté."""),
      S(ENS, """
        - Croire fermement à la Résurrection.
        - Se rappeler que la vie terrestre est temporaire.
        - Préparer l'au-delà par la foi et les bonnes œuvres.
        - Garder à l'esprit que nous retournerons tous vers Allah."""),
      P("Preuve dans le Coran liée à son sens", None, "« C'est Lui qui commence la création puis la refait ; cela Lui est facile. »", "Sourate Yûnus, 10:4.", "coran",
        "Autre référence : Sourate Ar-Rûm, 30:11."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - Le retour de la création et la Résurrection sont clairement établis dans le Coran.
        - La forme exacte Al-Mu'îd n'apparaît pas comme nom indépendant dans les versets cités.
        - Son statut comme nom divin indépendant est discuté selon les critères retenus par les savants."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur la Résurrection et demander à Allah de nous préparer à notre retour vers Lui. Ne pas présenter une formule spécifique avec Al-Mu'îd comme une invocation prophétique établie."),
      I("« Ô Allah, Toi qui ramèneras les créatures à la vie, raffermis ma foi en la Résurrection et aide-moi à préparer ma rencontre avec Toi. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ")),

    F(60, 60, "الْمُحْيِي", "Al-Muhyî", "Celui qui donne la vie et qui ressuscite les morts.", "Coran — acte de donner la vie explicitement attesté.", "etabli", "coran",
      S(E, """
        Al-Muhyî désigne Allah comme Celui qui donne la vie.

        Il est Celui qui donne l'existence aux êtres vivants, qui fait sortir la vie de ce qui paraît inerte et qui ressuscitera les morts au Jour dernier.

        La vie appartient à Allah et dépend entièrement de Sa volonté.

        Ce nom nous rappelle que notre existence est un bienfait immense et que nous devons utiliser notre vie pour accomplir ce qui plaît à notre Créateur."""),
      S(ENS, """
        - Reconnaître qu'Allah est Celui qui donne la vie.
        - Être reconnaissants pour le bienfait de l'existence.
        - Se rappeler que la vie terrestre est temporaire.
        - Préparer notre retour vers Allah.
        - Ne jamais désespérer de Sa puissance."""),
      P(PC, None, "« Regarde donc les effets de la miséricorde d'Allah, comment Il redonne la vie à la terre après sa mort. C'est Lui qui fait revivre les morts, et Il est Omnipotent. »",
        "Sourate Ar-Rûm, 30:50.", "coran", "Autre référence : Sourate Fussilat, 41:39."),
      S(Q, "Lorsque nous demandons à Allah de vivifier notre cœur par la foi, de nous guider et de nous accorder une vie consacrée à Son obéissance."),
      I("« Ô Allah, Al-Muhyî, donne vie à mon cœur par la foi, éloigne-moi de ce qui m'éloigne de Toi et aide-moi à consacrer ma vie à ce qui Te satisfait. »", FP_LONG, EX),
      A("CORAN", "Le Coran atteste explicitement qu'Allah donne la vie et fait revivre les morts. La forme Al-Muhyî est traditionnellement retenue parmi les noms divins. Conserver la référence coranique à l'acte de donner la vie sans lui attribuer un mérite particulier non établi.")),
]
