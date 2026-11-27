from outils import F, S, P, I, A, FP

C = "Ce que ce nom nous apprend"
Q = "Quand L'invoquer"
IP = "Invocation proposée"

FICHES = [
    # Fiche 1 (captures #190-191)
    F(1, 1, "الرَّحْمَٰنُ", "Ar-Rahmân", "Le Tout Miséricordieux", "Coran", "etabli", "coran",
      S("Signification", "Ar-Rahmân désigne Allah, dont la miséricorde est immense et englobe toute chose. Sa miséricorde est parfaite et ne ressemble pas à celle des créatures."),
      S(C, "Allah est infiniment miséricordieux. Le croyant apprend à ne jamais désespérer de Sa miséricorde, à espérer Son pardon et à faire preuve lui-même de bonté envers les autres."),
      P("Preuve dans le Coran", "الرَّحْمَٰنِ الرَّحِيمِ", "« Le Tout Miséricordieux, le Très Miséricordieux. »", "Sourate Al-Fātiḥah, 1:3", "coran",
        "Autre référence : sourate Al-Isrā', 17:110, où Allah dit d'invoquer « Allah » ou « Ar-Rahmân »."),
      S("Quand invoquer Allah par ce nom ?", "Lorsque l'on demande Sa miséricorde, Sa douceur, Son pardon et Sa bienveillance, ou lorsque l'on souhaite se rappeler l'étendue de Sa miséricorde."),
      I("Yā Rahmān, accorde-moi Ta miséricorde et guide-moi vers ce qui Te plaît.",
        "Formulation personnelle pour l'application : ce n'est pas une invocation prophétique rapportée mot pour mot et aucun nombre de répétitions particulier ne lui est associé."),
      A("Coran", "Nom attesté explicitement.\n\nRéférences : Coran 1:3 et 17:110.")),

    # Fiches 2 à 10 (lot 2, captures #181-189)
    F(2, 2, "الرَّحِيمُ", "Ar-Rahîm", "Le Très Miséricordieux", "Coran", "etabli", "coran",
      S("Signification", "Allah accorde Sa miséricorde à Ses serviteurs. Ce nom exprime Sa miséricorde immense et parfaite."),
      S(C, "Nous pouvons espérer la miséricorde d'Allah, rechercher Son pardon et apprendre à être miséricordieux envers les autres."),
      P("Preuves", ref="Coran 1:3 et 2:163.", degre="coran"),
      S(Q, "Lorsque nous demandons Sa miséricorde, Son pardon et Sa bienveillance."),
      I("« Ô Ar-Rahîm, accorde-moi Ta miséricorde et pardonne-moi. »", "Formulation personnelle, non présentée comme une invocation prophétique spécifique.", IP)),
    F(3, 3, "الْمَلِكُ", "Al-Malik", "Le Souverain", "Coran", "etabli", "coran",
      S("Signification", "Allah est le véritable Souverain. Tout Lui appartient et Son autorité est absolue."),
      S(C, "Nous reconnaissons qu'Allah est le Maître de toute chose et que nous dépendons de Lui."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous remettons nos affaires entre Ses mains et Lui demandons de nous guider dans nos décisions."),
      I("« Ô Al-Malik, guide-moi vers ce qui est juste et bon. »", FP, IP)),
    F(4, 4, "الْقُدُّوسُ", "Al-Quddûs", "Le Très Saint", "Coran", "etabli", "coran",
      S("Signification", "Allah est parfaitement pur et exempt de tout défaut, de toute imperfection et de toute faiblesse."),
      S(C, "Allah est parfait ; rien de ce qui caractérise les créatures ne peut Lui être attribué de manière semblable."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous Le glorifions et Lui demandons de purifier nos cœurs et nos intentions."),
      I("« Ô Al-Quddûs, purifie mon cœur et améliore mes intentions. »",
        "Formulation personnelle. La demande de purification est un sens de supplication, pas une promesse attachée à une formule particulière.", IP)),
    F(5, 5, "السَّلَامُ", "As-Salâm", "La Paix, Celui qui est exempt de toute imperfection", "Coran", "etabli", "coran",
      S("Signification", "Allah est exempt de tout défaut et de toute imperfection. Il est la source de la paix et de la sécurité."),
      S(C, "Nous recherchons auprès d'Allah la paix du cœur et la sécurité, tout en sachant que Sa perfection est incomparable à celle des créatures."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous demandons la paix, la protection et la tranquillité."),
      I("« Ô As-Salâm, accorde la paix à mon cœur et protège-moi. »", FP, IP)),
    F(6, 6, "الْمُؤْمِنُ", "Al-Mu'min", "Celui qui accorde la sécurité et confirme la vérité", "Coran", "etabli", "coran",
      S("Signification", "Allah est Celui qui garantit la sécurité, inspire confiance et confirme la vérité de Ses révélations et de Ses promesses."),
      S(C, "Notre confiance véritable doit être placée en Allah. Nous apprenons à rechercher auprès de Lui la sécurité et la protection."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous demandons la protection, la sécurité et l'apaisement face à une inquiétude."),
      I("« Ô Al-Mu'min, accorde-moi Ta sécurité et raffermis ma confiance en Toi. »", FP, IP)),
    F(7, 7, "الْمُهَيْمِنُ", "Al-Muhaymin", "Le Gardien et le Protecteur", "Coran", "etabli", "coran",
      S("Signification", "Allah veille sur toute chose, la préserve et en connaît parfaitement la réalité. Rien ne Lui échappe."),
      S(C, "Nous ne sommes jamais hors de la connaissance d'Allah. Il connaît nos actes, nos paroles et ce que nos cœurs renferment."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous demandons Sa protection et lorsque nous avons besoin de nous rappeler que rien n'échappe à Sa connaissance."),
      I("« Ô Al-Muhaymin, veille sur moi et protège-moi par Ta volonté. »", FP, IP)),
    F(8, 8, "الْعَزِيزُ", "Al-'Azîz", "Le Tout-Puissant, l'Invincible", "Coran", "etabli", "coran",
      S("Signification", "Allah possède la puissance parfaite. Rien ne peut Le vaincre ni s'opposer à Sa volonté."),
      S(C, "Nous devons nous en remettre à la puissance d'Allah plutôt que de croire que nos difficultés sont insurmontables."),
      P("Preuve", ref="Coran 59:23 et 59:24.", degre="coran"),
      S(Q, "Lorsque nous demandons force, secours et soutien dans une épreuve."),
      I("« Ô Al-'Azîz, accorde-moi la force et aide-moi à traverser cette épreuve. »", FP, IP)),
    F(9, 9, "الْجَبَّارُ", "Al-Jabbâr", "Le Tout-Puissant, Celui dont la volonté s'accomplit", "Coran", "etabli", "coran",
      S("Signification", "Allah est Celui dont la puissance et l'autorité sont absolues. Ce nom comporte également le sens de Celui qui répare et rétablit ce qui est brisé, selon les explications des savants."),
      S(C, "Aucune difficulté ne dépasse la puissance d'Allah. Nous pouvons Lui confier nos blessures et nos épreuves."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous demandons Son secours, Sa force et le soulagement de nos peines."),
      I("« Ô Al-Jabbâr, répare ce qui est blessé dans mon cœur et facilite mes difficultés. »",
        "Formulation personnelle. Ne pas réduire ce nom à une seule traduction française.", IP)),
    F(10, 10, "الْمُتَكَبِّرُ", "Al-Mutakabbir", "Le Suprême, le Détenteur de la grandeur", "Coran", "etabli", "coran",
      S("Signification", "Allah est Celui à qui appartiennent la grandeur et la majesté absolues. Il est au-dessus de toute imperfection et de toute comparaison avec les créatures."),
      S(C, "La grandeur véritable appartient à Allah seul. L'être humain doit rester humble et ne pas s'enorgueillir."),
      P("Preuve", ref="Coran 59:23.", degre="coran"),
      S(Q, "Lorsque nous Le glorifions, reconnaissons Sa grandeur et demandons à être préservés de l'orgueil."),
      I("« Ô Al-Mutakabbir, éloigne de mon cœur l'orgueil et aide-moi à rester humble. »", FP, IP)),

    # Fiches 11 et 12 (lot 3 ; le message de Nadia s'arrête au début de la fiche 13)
    F(11, 11, "الْخَالِقُ", "Al-Khâliq", "Le Créateur", "Coran — nom explicitement attesté.", "etabli", "coran",
      S("Signification", "Al-Khâliq signifie qu'Allah est le Créateur de toute chose. Il crée selon Sa science, Sa volonté et Sa sagesse. La création ne Lui demande aucun effort et rien ne Lui est semblable."),
      S("Ce que ce nom nous apprend", """
        Tout ce qui existe doit son existence à Allah. L'être humain, les animaux, les plantes, les étoiles et l'ensemble de l'univers font partie de Sa création.

        Ce nom nous invite à reconnaître la grandeur d'Allah, à être reconnaissants et à contempler Sa création."""),
      P("Preuve dans le Coran", "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ",
        "« C'est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. »", "Sourate Al-Hachr, 59:24", "coran",
        "Autres références :\n- Coran 6:102.\n- Coran 39:62."),
      S("Quand invoquer Allah par ce nom ?", "Lorsque l'on contemple la création, que l'on reconnaît sa dépendance envers Allah ou que l'on demande à Allah de faciliter une situation."),
      I("« Ô Al-Khâliq, aide-moi à reconnaître Tes bienfaits et à Te remercier pour Ta création. »",
        "Nature de l'invocation : formulation personnelle de l'application, non présentée comme une formule prophétique particulière."),
      A("CORAN", "Référence principale : 59:24.")),
    F(12, 12, "الْبَارِئُ", "Al-Bâri'", "Celui qui donne existence et réalise la création", "Coran — nom explicitement attesté.", "etabli", "coran",
      S("Signification", """
        Al-Bâri' désigne Allah comme Celui qui fait exister les créatures et les fait apparaître selon Sa volonté et Sa sagesse.

        Ce nom est cité avec Al-Khâliq et Al-Musawwir dans le même verset."""),
      S("Ce que ce nom nous apprend", """
        Allah est à l'origine de notre existence. Rien ne vient à l'existence indépendamment de Lui.

        Nous apprenons à reconnaître notre dépendance envers notre Créateur et à ne pas nous attribuer ce qui appartient à Allah seul."""),
      P("Preuve dans le Coran", "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ",
        "« C'est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. »", "Sourate Al-Hachr, 59:24", "coran"),
      S("Quand invoquer Allah par ce nom ?", "Lorsque l'on médite sur l'origine de la création et que l'on reconnaît que notre existence dépend entièrement d'Allah."),
      I("« Ô Al-Bâri', fais de moi une personne reconnaissante envers Toi et aide-moi à accomplir ce qui Te plaît. »",
        "Nature de l'invocation : formulation personnelle, non rapportée comme invocation prophétique spécifique."),
      A("CORAN", "Référence principale : 59:24.")),
]
