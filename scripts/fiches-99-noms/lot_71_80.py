from outils import F, S, P, I, A, D, PR

SIG = "Signification"
E = "Explication"
ENS = "Ce que ce Nom nous enseigne"
Q = "Quand invoquer Allah par ce Nom"
EX = "Exemple d'invocation personnelle"
HADID = "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ"
HADID_FR = "« Il est le Premier et le Dernier, l'Apparent et le Caché. »"
HADID_REF = "Coran, sourate Al-Hadîd (57), verset 3."
M2713 = "Sahih Muslim, hadith 2713a."
CS = "Attesté explicitement dans le Coran et la Sunna authentique."

# ⚠️ ChatGPT 71 à 80 = appli 72 à 81
FICHES = [
    F(72, 71, "الْمُؤَخِّرُ", "Al-Mu'akhkhir", "Celui qui retarde, Celui qui fait passer après.", "Sunna authentique.", "etabli", "sunna",
      S(E, """
        Allah est Celui qui décide de l'ordre des événements et de leur moment. Il peut retarder une chose, une échéance ou une situation selon Sa sagesse parfaite. Ce qui nous semble tarder n'échappe jamais à Sa connaissance ni à Son décret.

        Ce Nom est à comprendre en complément d'Al-Muqaddim : Allah est Celui qui fait avancer et Celui qui fait reculer ou retarder. Rien ne se produit indépendamment de Sa volonté."""),
      S(ENS, """
        - Faire preuve de patience lorsque les choses prennent du temps.
        - Ne pas désespérer lorsqu'une demande semble tarder à être exaucée.
        - Comprendre que notre perception du moment opportun n'est pas toujours celle qui correspond à la sagesse divine.
        - Placer notre confiance en Allah sans cesser d'accomplir les causes permises."""),
      P("Preuve authentique", "أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ",
        "Le Prophète ﷺ disait dans une invocation :\n\nAnta al-Muqaddimu wa anta al-Mu'akhkhir.\n\n« Tu es Celui qui fait avancer et Tu es Celui qui retarde. »",
        "Sahih Muslim, hadith 771a.", "sahih", "Authenticité : Hadith authentique, rapporté par Muslim."),
      S(Q, "On peut évoquer ce Nom lorsqu'on demande à Allah de gérer nos affaires avec sagesse, de nous accorder le bon moment pour une chose ou de nous préserver d'une précipitation nuisible."),
      I("« Ô Allah, Toi qui fais avancer et qui retardes selon Ta sagesse, accorde-moi ce qui est bon au moment qui est le meilleur pour moi. »", None, EX),
      A("SUNNA AUTHENTIQUE", "Attesté explicitement dans la Sunna authentique, dans l'invocation rapportée par Muslim.", "Authenticité du Nom")),

    F(73, 72, "الْأَوَّلُ", "Al-Awwal", "Le Premier.", "Coran et Sunna authentique.", "etabli", "coran_sunna",
      S(E, """
        Allah est Le Premier : rien n'existait avant Lui. Il n'a ni commencement ni origine. Toute la création dépend de Lui, alors que Lui n'a besoin de personne et n'est précédé par rien.

        Ce Nom nous rappelle qu'Allah est le Créateur de toute chose et que Son existence n'est pas comparable à celle des créatures."""),
      S(ENS, """
        - Reconnaître qu'Allah est à l'origine de toute chose.
        - Ne pas attribuer à une créature une indépendance qu'elle ne possède pas.
        - Placer Allah au premier rang dans notre cœur et dans nos priorités.
        - Se rappeler que toute chose créée a un commencement, contrairement à Allah."""),
      P("Preuve dans le Coran", HADID, HADID_FR, HADID_REF, "coran"),
      P("Preuve dans la Sunna", "اللَّهُمَّ أَنْتَ الْأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ",
        "Le Prophète ﷺ a enseigné cette invocation :\n\nAllâhumma anta al-Awwalu fa-laysa qablaka shay'.\n\n« Ô Allah, Tu es le Premier, rien n'existe avant Toi. »", M2713, "sahih"),
      S(Q, "Lorsqu'on souhaite renouveler sa confiance en Allah, se rappeler qu'Il est l'origine de toute chose et Lui demander de nous guider dans nos commencements."),
      I("« Ô Allah, Toi qui es le Premier et qui n'as aucun commencement, guide-moi dès le début de mes projets vers ce qui Te satisfait. »", None, EX),
      A("CORAN ET SUNNA AUTHENTIQUE", CS, "Authenticité du Nom")),

    F(74, 73, "الْآخِرُ", "Al-Âkhir", "Le Dernier.", "Coran et Sunna authentique.", "etabli", "coran_sunna",
      S(E, """
        Allah est Le Dernier : rien ne subsistera après Lui. Toute la création est appelée à disparaître selon Son décret, tandis qu'Allah demeure éternellement.

        Ce Nom rappelle que notre existence ici-bas est temporaire et que notre retour final est vers Allah."""),
      S(ENS, """
        - Se rappeler que la vie d'ici-bas est passagère.
        - Préparer notre rencontre avec Allah par la foi et les bonnes œuvres.
        - Ne pas s'attacher excessivement aux biens et aux plaisirs éphémères.
        - Garder à l'esprit que notre destination finale est auprès d'Allah."""),
      P("Preuve dans le Coran", HADID, HADID_FR, HADID_REF, "coran"),
      P("Preuve dans la Sunna", "وَأَنْتَ الْآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ",
        "Wa anta al-Âkhiru fa-laysa ba'daka shay'.\n\n« Et Tu es le Dernier, rien n'existe après Toi. »", M2713, "sahih"),
      S(Q, "Lorsqu'on réfléchit à la fin de la vie, à notre retour vers Allah et à notre besoin de terminer notre existence dans la foi."),
      I("« Ô Allah, Toi qui es le Dernier, fais que mes dernières œuvres soient les meilleures et accorde-moi une bonne fin. »", None, EX),
      A("CORAN ET SUNNA AUTHENTIQUE", CS, "Authenticité du Nom")),

    F(75, 74, "الظَّاهِرُ", "Az-Zâhir", "L'Apparent, Celui qui est au-dessus de toute chose.", "Coran et Sunna authentique.", "etabli", "coran_sunna",
      S(E, """
        Allah est Az-Zâhir. Il est manifeste par les signes de Sa création, par Ses œuvres et par les preuves de Son existence. Il est également Celui qui est au-dessus de toute chose.

        Le Prophète ﷺ a expliqué ce Nom par cette parole : « rien n'est au-dessus de Toi ».

        Il ne faut pas comprendre « l'Apparent » comme si Allah était une créature visible ou perceptible de la même manière que les objets de ce monde. Allah n'est comparable à aucune de Ses créatures."""),
      S(ENS, """
        - Méditer sur les signes d'Allah dans la création.
        - Reconnaître Sa grandeur et Sa suprématie.
        - Ne pas limiter Allah à notre perception humaine.
        - Renforcer notre certitude à travers les signes qui nous entourent."""),
      P("Preuve dans le Coran", HADID, HADID_FR, HADID_REF, "coran"),
      P("Preuve dans la Sunna", "وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ",
        "Wa anta Az-Zâhiru fa-laysa fawqaka shay'.\n\n« Tu es l'Apparent, rien n'est au-dessus de Toi. »", M2713, "sahih"),
      S(Q, "Lorsqu'on médite sur la création, qu'on cherche à renforcer sa certitude ou qu'on demande à Allah de nous faire reconnaître les signes de Sa grandeur."),
      I("« Ô Allah, Toi qui es Az-Zâhir, augmente ma foi et aide-moi à reconnaître les signes de Ta grandeur. »", None, EX),
      A("CORAN ET SUNNA AUTHENTIQUE", CS, "Authenticité du Nom")),

    F(76, 75, "الْبَاطِنُ", "Al-Bâtin", "Le Caché, Celui qui connaît parfaitement ce qui est intérieur.", "Coran et Sunna authentique.", "etabli", "coran_sunna",
      S(E, """
        Allah est Al-Bâtin. Rien ne Lui échappe, ni ce qui est apparent, ni ce qui est caché, ni les pensées les plus secrètes.

        Ce Nom rappelle que la connaissance d'Allah englobe absolument toute chose. Il connaît les intentions, les pensées, les secrets et les réalités que les êtres humains ne peuvent pas percevoir.

        Dans l'invocation prophétique, ce Nom est associé à cette parole : « rien n'est au-delà de Toi ».

        Il ne signifie pas qu'Allah serait caché par ignorance ou limité par un endroit. Il faut préserver la transcendance d'Allah et ne pas comparer Ses attributs à ceux des créatures."""),
      S(ENS, """
        - Purifier nos intentions, car Allah connaît ce que nous cachons.
        - Être sincères même lorsque personne ne nous observe.
        - Se rappeler qu'aucun secret ne Lui échappe.
        - Lui confier nos inquiétudes et nos pensées les plus profondes."""),
      P("Preuve dans le Coran", HADID, HADID_FR, HADID_REF, "coran"),
      P("Preuve dans la Sunna", "وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ",
        "Wa anta Al-Bâtinu fa-laysa dûnaka shay'.\n\n« Tu es le Caché, rien n'est au-delà de Toi. »", M2713, "sahih"),
      S(Q, "Lorsqu'on souhaite demander à Allah de purifier notre cœur, de connaître nos intentions sincères et de nous aider dans ce que nous gardons au fond de nous."),
      I("« Ô Allah, Toi qui connais ce qui est apparent et ce qui est caché, purifie mon cœur et améliore mes intentions. »", None, EX),
      A("CORAN ET SUNNA AUTHENTIQUE", CS, "Authenticité du Nom")),

    F(77, 76, "الْوَالِي", "Al-Wâlî", "Celui qui administre et gouverne les affaires de Sa création.",
      "Appellation des listes traditionnelles ; statut comme Nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Cette appellation est présente dans certaines listes traditionnelles des 99 noms. Elle exprime l'idée de gouverner, de prendre en charge et de disposer des affaires.

        Il faut cependant être précis : la forme exacte « Al-Wâlî » comme Nom divin indépendant n'est pas établie de manière aussi explicite que certains autres noms. Elle ne doit pas être confondue avec « Al-Waliyy » (الْوَلِيُّ), déjà présenté dans la fiche 55, qui signifie notamment le Protecteur et l'Allié.

        Le Coran mentionne des formes de la racine liée à la protection et à la gouvernance, mais cela ne suffit pas à affirmer automatiquement que chaque forme constitue un Nom divin indépendant."""),
      S("Ce que cette appellation nous rappelle", """
        - Allah est Celui dont dépend la gestion de toute la création.
        - Aucun événement n'échappe à Son pouvoir et à Sa connaissance.
        - Le croyant doit remettre ses affaires à Allah tout en accomplissant les causes permises.
        - Nous ne devons pas attribuer à une créature une souveraineté absolue."""),
      P("Preuve liée au sens", "وَمَا لَهُمْ مِنْ دُونِهِ مِنْ وَالٍ", "« Et ils n'ont en dehors de Lui aucun protecteur. »",
        "Coran, sourate Ar-Ra'd (13), verset 11.", "coran",
        "Précision importante : Le verset contient le terme « wâl » dans un contexte de protection et de prise en charge. Il ne contient pas exactement la forme « Al-Wâlî » comme Nom divin indépendant."),
      S("Quand évoquer cette appellation", "On peut rappeler ce sens lorsqu'on remet ses affaires à Allah et que l'on reconnaît que toute la création dépend de Lui."),
      I("« Ô Allah, Toi qui gouvernes toute chose, prends en charge mes affaires et guide-moi vers ce qui est juste. »", None, EX),
      A("STATUT DISCUTÉ", "Appellation présente dans des listes traditionnelles, mais son établissement comme Nom divin indépendant est discuté. À afficher avec une mention de prudence.", "Authenticité du Nom")),

    F(78, 77, "الْمُتَعَالِي", "Al-Muta'âlî", "Le Très-Haut, Celui qui est infiniment élevé au-dessus de Sa création.",
      "Coran — forme coranique « Al-Muta'âl » ; précision sur la forme.", "etabli", "coran",
      S(E, """
        Allah est Al-Muta'âlî : Sa grandeur, Sa puissance et Sa majesté sont parfaites. Il est au-dessus de toute imperfection et de toute ressemblance avec les créatures.

        Le Coran emploie dans la sourate Ar-Ra'd la forme « Al-Muta'âl », issue de la même racine et exprimant cette élévation absolue.

        Il convient de ne pas imaginer cette élévation à la manière d'une créature ou de la réduire à une comparaison physique."""),
      S(ENS, """
        - Reconnaître la grandeur absolue d'Allah.
        - S'éloigner de l'orgueil et de l'arrogance.
        - Accepter que notre connaissance et nos capacités sont limitées.
        - Faire preuve d'humilité devant notre Créateur."""),
      P("Preuve dans le Coran", "عَالِمُ الْغَيْبِ وَالشَّهَادَةِ الْكَبِيرُ الْمُتَعَالِ", "« Il connaît l'invisible et le visible, Il est le Très-Grand, le Très-Haut. »",
        "Coran, sourate Ar-Ra'd (13), verset 9.", "coran",
        "Précision sur la forme : Le verset emploie « الْمُتَعَالِ » (Al-Muta'âl), forme coranique de cette appellation. La forme « الْمُتَعَالِي » est celle couramment présentée dans les listes traditionnelles."),
      S("Quand invoquer Allah par cette appellation", "Lorsqu'on souhaite reconnaître Sa grandeur, demander à être préservé de l'orgueil et retrouver l'humilité."),
      I("« Ô Allah, Toi qui es infiniment élevé et parfait, éloigne-moi de l'orgueil et remplis mon cœur d'humilité. »", None, EX),
      A("CORAN", "Le sens et la forme coranique « Al-Muta'âl » sont attestés dans le Coran. La forme courante « Al-Muta'âlî » doit être présentée en signalant cette particularité linguistique.", "Authenticité du Nom")),

    F(79, 78, "الْبَرُّ", "Al-Barr", "Le Bienfaisant, Celui dont la bonté est immense.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Barr : Sa bonté envers Ses serviteurs est immense. Il leur accorde Ses bienfaits, leur ouvre les portes du repentir et leur manifeste une miséricorde parfaite.

        Sa bienfaisance n'est pas comparable à celle des créatures : elle est parfaite, sans faiblesse ni besoin.

        Ce Nom nous invite à reconnaître les bienfaits d'Allah et à chercher à agir avec bonté envers les autres."""),
      S(ENS, """
        - Remercier Allah pour Ses bienfaits visibles et invisibles.
        - Ne pas désespérer de Sa bonté et de Sa miséricorde.
        - Être bienfaisant envers les parents, les proches et les personnes dans le besoin.
        - Chercher à faire le bien avec sincérité."""),
      P("Preuve dans le Coran", "إِنَّا كُنَّا مِنْ قَبْلُ نَدْعُوهُ إِنَّهُ هُوَ الْبَرُّ الرَّحِيمُ",
        "« Auparavant, nous L'invoquions. C'est Lui, certes, le Bienfaisant, le Très Miséricordieux. »", "Coran, sourate At-Tûr (52), verset 28.", "coran"),
      S(Q, "Lorsqu'on souhaite remercier Allah pour Ses bienfaits, Lui demander Sa bonté et espérer Sa miséricorde."),
      I("« Ô Allah, Toi le Bienfaisant, accorde-moi Ta bonté, fais-moi miséricorde et aide-moi à faire le bien autour de moi. »", None, EX),
      A("CORAN", "Attesté explicitement dans le Coran.", "Authenticité du Nom")),

    F(80, 79, "التَّوَّابُ", "At-Tawwâb", "Celui qui accueille le repentir et accepte le retour de Ses serviteurs.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est At-Tawwâb : Il accueille le repentir de Ses serviteurs lorsqu'ils reviennent sincèrement vers Lui. Il leur ouvre la porte du pardon et leur permet de se détourner du péché pour retrouver le chemin de l'obéissance.

        Ce Nom exprime également la répétition de l'accueil du repentir : le serviteur peut revenir vers Allah chaque fois qu'il reconnaît sa faute et se repent sincèrement.

        Le repentir sincère implique notamment de regretter le péché, de cesser de le commettre et d'avoir la ferme intention de ne pas y retourner. Lorsqu'un droit humain a été lésé, il faut également s'efforcer de le restituer ou de réparer le tort."""),
      S(ENS, """
        - Ne jamais désespérer de la miséricorde d'Allah.
        - Reconnaître ses erreurs au lieu de les justifier.
        - Revenir sincèrement vers Allah après une faute.
        - Ne pas retarder son repentir.
        - Accueillir avec bienveillance ceux qui cherchent sincèrement à s'améliorer."""),
      P("Preuves dans le Coran", "إِنَّهُ هُوَ التَّوَّابُ الرَّحِيمُ", "« C'est Lui, certes, qui accueille le repentir, le Très Miséricordieux. »",
        "Coran, sourate Al-Baqara (2), verset 37.", "coran", "Autre référence : Coran, sourate At-Tawba (9), verset 104."),
      S(Q, "Lorsqu'on regrette un péché, qu'on souhaite revenir sincèrement vers Allah et qu'on Lui demande de nous aider à ne pas retomber dans nos erreurs."),
      I("« Ô Allah, At-Tawwâb, accepte mon repentir, pardonne mes fautes et aide-moi à ne pas retourner vers ce qui Te déplaît. »", None, EX),
      A("CORAN", "Attesté explicitement dans le Coran.", "Authenticité du Nom")),

    F(81, 80, "الْمُنْتَقِمُ", "Al-Muntaqim", "Celui qui exerce une juste rétribution.",
      "Terme coranique attesté ; statut comme Nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Allah est parfaitement juste. Il ne laisse aucune injustice Lui échapper et Il rétribue les injustes selon Sa justice et Sa sagesse.

        Cette appellation est présente dans les listes traditionnelles des 99 noms. Le Coran emploie bien le terme « muntaqim » pour évoquer la rétribution divine, notamment à propos des criminels. Toutefois, certains savants discutent le fait d'en faire un Nom divin indépendant, car les noms d'Allah doivent être établis à partir des textes et ne sont pas déduits automatiquement de chaque action mentionnée.

        Il faut surtout éviter de traduire ce Nom par une idée de vengeance humaine ou de colère injuste. Allah n'agit jamais par faiblesse, rancune ou injustice."""),
      S("Ce que cette appellation nous rappelle", """
        - Aucune injustice ne sera oubliée par Allah.
        - La justice divine est parfaite et ne comporte aucune erreur.
        - Nous ne devons pas nous croire autorisés à nous venger injustement.
        - Le croyant doit craindre de faire du tort à autrui et respecter les droits des personnes."""),
      P("Preuves dans le Coran", "إِنَّا مِنَ الْمُجْرِمِينَ مُنْتَقِمُونَ", "« Nous exercerons Notre rétribution contre les criminels. »",
        "Coran, sourate As-Sajda (32), verset 22.", "coran", """
        Autre référence : Coran, sourate Ad-Dukhân (44), verset 16.

        Précision importante : Ces versets attestent l'emploi coranique de la notion de rétribution divine. Ils ne suffisent pas, à eux seuls, à établir un consensus sur « Al-Muntaqim » comme Nom divin indépendant."""),
      S("Quand évoquer cette appellation", "On peut rappeler la justice parfaite d'Allah lorsqu'on est confronté à une injustice, tout en demandant à Allah de nous préserver de l'injustice et de nous guider vers un comportement juste."),
      I("« Ô Allah, Toi qui es parfaitement juste, protège-moi de l'injustice, aide-moi à ne faire de tort à personne et rends justice à ceux qui ont été lésés. »", None, EX),
      A("STATUT DISCUTÉ", "Terme et sens de rétribution attestés dans le Coran. Son établissement comme Nom divin indépendant est discuté par des savants. Afficher une mention de prudence.", "Authenticité du Nom")),
]
