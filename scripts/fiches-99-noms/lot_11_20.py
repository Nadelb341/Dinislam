from outils import F, S, P, I, A, PR

# LOT 3 COMPLET (message de Nadia du 27/11, 2ᵉ envoi) — appli 11 à 20 = ChatGPT 11 à 20.
# Remplace pour 11 et 12 la version tirée du lot 3 coupé (gardée dans lot_03_coupe_ancien.py et dans
# supabase/data/allah_names_fiches_adultes_2026-11-27.json).
E = "Explication"
ENS = "Ce que ce Nom nous enseigne"
Q = "Quand invoquer Allah par ce Nom"
EX = "Exemple d'invocation personnelle"
AN = "Authenticité du Nom"
ATT = "Attesté explicitement dans le Coran."

FICHES = [
    F(11, 11, "الْخَالِقُ", "Al-Khâliq", "Le Créateur, Celui qui crée toute chose.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Khâliq, le Créateur de toute existence. Il a créé les cieux, la terre, les êtres vivants et tout ce qui existe.

        Sa création ne ressemble pas à celle des êtres humains : nous transformons des éléments déjà existants, tandis qu'Allah est le Créateur de toute chose. Rien ne Lui est impossible et rien n'existe indépendamment de Lui.

        Ce Nom nous invite à contempler la création et à reconnaître la grandeur de Celui qui en est à l'origine."""),
      S(ENS, """
        - Reconnaître qu'Allah est l'unique Créateur.
        - Être reconnaissant pour la vie et les bienfaits reçus.
        - Méditer sur les merveilles de la création.
        - Ne pas attribuer à une créature un pouvoir de création comparable à celui d'Allah."""),
      P("Preuves dans le Coran", "اللَّهُ خَالِقُ كُلِّ شَيْءٍ", "« Allah est le Créateur de toute chose. »",
        "Coran, sourate Az-Zumar (39), verset 62.", "coran"),
      P("Autre preuve", "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ",
        "« Il est Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. »", "Coran, sourate Al-Hashr (59), verset 24.", "coran"),
      S(Q, "Lorsqu'on contemple la création, qu'on remercie Allah pour la vie ou qu'on Lui demande de nous guider vers ce qui est bon."),
      I("« Ô Allah, Al-Khâliq, Toi qui as créé toute chose, guide-moi vers ce qui Te satisfait et fais de moi un serviteur reconnaissant. »", None, EX),
      A("CORAN", ATT, AN)),

    F(12, 12, "الْبَارِئُ", "Al-Bâri'", "Celui qui donne existence à la création, Celui qui fait surgir les créatures.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Bâri'. Il fait exister les créatures selon Sa volonté et Sa sagesse. Il leur donne une existence propre et les distingue les unes des autres.

        Ce Nom est associé à Al-Khâliq et Al-Musawwir dans le verset 24 de la sourate Al-Hashr.

        On peut comprendre ces trois appellations comme évoquant des aspects complémentaires de la création : Allah crée, fait exister et donne leur forme aux créatures. Il ne faut toutefois pas enfermer les attributs divins dans une explication humaine limitée."""),
      S(ENS, """
        - Reconnaître que notre existence dépend entièrement d'Allah.
        - Contempler la diversité et la richesse de la création.
        - Être humble devant la puissance du Créateur.
        - Remercier Allah pour notre existence et nos capacités."""),
      P("Preuve dans le Coran", "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ",
        "« Il est Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. »", "Coran, sourate Al-Hashr (59), verset 24.", "coran"),
      S(Q, "Lorsqu'on médite sur notre existence, la naissance et la diversité des êtres vivants, ou lorsqu'on remercie Allah pour Ses bienfaits."),
      I("« Ô Allah, Al-Bâri', Toi qui as donné existence à toute chose, accorde-moi une vie remplie de foi et d'obéissance. »", None, EX),
      A("CORAN", ATT, AN)),

    F(13, 13, "الْمُصَوِّرُ", "Al-Musawwir", "Celui qui donne aux créatures leur forme et leur apparence.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Musawwir. Il donne à chaque créature sa forme, ses caractéristiques et son apparence selon Sa sagesse.

        Les êtres humains, les animaux, les plantes et toutes les créatures présentent une diversité extraordinaire. Cette diversité témoigne de la perfection de la création d'Allah.

        Aucune créature ne possède une apparence qui échappe à Sa connaissance ou à Sa volonté."""),
      S(ENS, """
        - Contempler la diversité des créatures.
        - Reconnaître la sagesse d'Allah dans la création.
        - Ne pas mépriser les personnes en raison de leur apparence.
        - Remercier Allah pour le corps et les capacités qu'Il nous a accordés."""),
      P("Preuve dans le Coran", "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ",
        "« Il est Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. »", "Coran, sourate Al-Hashr (59), verset 24.", "coran"),
      P("Autre référence", "يُصَوِّرُكُمْ فِي الْأَرْحَامِ كَيْفَ يَشَاءُ", "« Il vous façonne dans les matrices comme Il veut. »",
        "Coran, sourate Âl 'Imrân (3), verset 6.", "coran"),
      S(Q, "Lorsqu'on contemple la création, qu'on remercie Allah pour les bienfaits de notre corps ou qu'on Lui demande de nous embellir par la foi et les bonnes actions."),
      I("« Ô Allah, Al-Musawwir, embellis mon cœur par la foi, améliore mon comportement et fais de moi une personne reconnaissante. »", None, EX),
      A("CORAN", ATT, AN)),

    F(14, 14, "الْغَفَّارُ", "Al-Ghaffâr", "Celui qui pardonne abondamment et à maintes reprises.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Ghaffâr. Son pardon est immense et Il pardonne les péchés de ceux qui reviennent sincèrement vers Lui.

        Ce Nom exprime l'immensité et la répétition du pardon d'Allah. Même lorsque le serviteur commet plusieurs fautes, il ne doit jamais désespérer de Sa miséricorde s'il revient sincèrement vers Lui.

        Le pardon d'Allah ne doit cependant pas être un prétexte pour banaliser les péchés. Le croyant doit s'efforcer de les délaisser et de se repentir sincèrement."""),
      S(ENS, """
        - Ne jamais désespérer du pardon d'Allah.
        - Reconnaître ses fautes et demander pardon.
        - Se repentir sincèrement et éviter de persister volontairement dans le péché.
        - Apprendre à pardonner aux autres lorsque cela est juste et possible."""),
      P("Preuves dans le Coran", "وَإِنِّي لَغَفَّارٌ لِمَنْ تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ",
        "« Et Je suis Grand Pardonneur envers celui qui se repent, croit, accomplit de bonnes œuvres puis suit le bon chemin. »",
        "Coran, sourate Tâ-Hâ (20), verset 82.", "coran", "Autre référence : Coran, sourate Ghâfir (40), verset 42."),
      S(Q, "Lorsqu'on regrette un péché, qu'on demande pardon à Allah et qu'on souhaite retrouver le chemin de l'obéissance."),
      I("« Ô Allah, Al-Ghaffâr, pardonne mes fautes, accepte mon repentir et aide-moi à ne pas retourner vers ce qui Te déplaît. »", None, EX),
      A("CORAN", ATT, AN)),

    F(15, 15, "الْقَهَّارُ", "Al-Qahhâr", "Le Dominateur absolu, Celui à qui rien ne peut résister.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Qahhâr. Sa puissance domine toute chose et aucune créature ne peut s'opposer à Son pouvoir.

        Tout ce qui existe est soumis à Sa souveraineté. Aucun être, aucune force et aucun événement ne peuvent échapper à Son autorité.

        Ce Nom nous rappelle que la puissance d'Allah est absolue, tandis que celle des créatures est limitée et temporaire."""),
      S(ENS, """
        - Reconnaître la puissance absolue d'Allah.
        - Ne pas se laisser impressionner par la puissance des êtres humains.
        - Éviter l'arrogance et l'oppression.
        - Se soumettre humblement à Allah."""),
      P("Preuves dans le Coran", "قُلِ اللَّهُ خَالِقُ كُلِّ شَيْءٍ وَهُوَ الْوَاحِدُ الْقَهَّارُ",
        "« Dis : Allah est le Créateur de toute chose, et Il est l'Unique, le Dominateur suprême. »",
        "Coran, sourate Ar-Ra'd (13), verset 16.", "coran", "Autre référence : Coran, sourate Ibrâhîm (14), verset 48."),
      S(Q, "Lorsqu'on souhaite se rappeler que rien ne peut résister à Sa puissance, demander Son aide face à une difficulté ou Lui demander de nous préserver de l'injustice."),
      I("« Ô Allah, Al-Qahhâr, Toi dont la puissance domine toute chose, aide-moi à maîtriser mon âme et à rester sur le droit chemin. »", None, EX),
      A("CORAN", ATT, AN)),

    F(16, 16, "الْوَهَّابُ", "Al-Wahhâb", "Le Grand Donateur, Celui qui accorde Ses dons généreusement.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Wahhâb. Il accorde Ses bienfaits à Ses serviteurs par Sa générosité, sans avoir besoin de recevoir quoi que ce soit en retour.

        Il donne la vie, la santé, la subsistance, la connaissance, la foi et de nombreux bienfaits visibles et invisibles.

        Ce Nom nous rappelle que tout ce que nous possédons est un don d'Allah et que nous devons Lui en être reconnaissants."""),
      S(ENS, """
        - Remercier Allah pour Ses bienfaits.
        - Ne pas considérer les dons reçus comme un droit qui nous serait dû.
        - Demander à Allah les bienfaits utiles à notre vie et à notre foi.
        - Être généreux avec les autres selon nos possibilités."""),
      P("Preuves dans le Coran", "إِنَّكَ أَنْتَ الْوَهَّابُ", "« C'est Toi, certes, le Grand Donateur. »",
        "Coran, sourate Âl 'Imrân (3), verset 8.", "coran", "Autre référence : Coran, sourate Sâd (38), verset 9."),
      PR("Invocation coranique", "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ", None,
         "« Seigneur, ne laisse pas nos cœurs dévier après nous avoir guidés et accorde-nous une miséricorde venant de Toi. C'est Toi, certes, le Grand Donateur. »",
         "Coran, sourate Âl 'Imrân (3), verset 8.", "coran"),
      S(Q, "Lorsqu'on demande à Allah un bienfait, une bonne descendance, la connaissance bénéfique, la foi ou Sa miséricorde."),
      I("« Ô Allah, Al-Wahhâb, accorde-moi Tes bienfaits, une foi sincère et une connaissance utile. »", None, EX),
      A("CORAN", ATT, AN)),

    F(17, 17, "الرَّزَّاقُ", "Ar-Razzâq", "Le Pourvoyeur absolu, Celui qui accorde la subsistance.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Ar-Razzâq. Il est Celui qui pourvoit aux besoins de toutes Ses créatures.

        La subsistance ne se limite pas à l'argent : elle comprend la nourriture, l'eau, la santé, la famille, la connaissance, la tranquillité et tous les bienfaits dont nous profitons.

        Le croyant doit rechercher sa subsistance par des moyens licites, tout en sachant que son véritable Pourvoyeur est Allah."""),
      S(ENS, """
        - Placer sa confiance en Allah concernant sa subsistance.
        - Rechercher des moyens de gagner sa vie de manière licite.
        - Être reconnaissant pour les bienfaits reçus.
        - Ne pas envier les richesses des autres.
        - Se rappeler que la subsistance d'Allah ne se limite pas aux biens matériels."""),
      P("Preuve dans le Coran", "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ", "« Allah est certes le Grand Pourvoyeur, le Détenteur de la force, l'Inébranlable. »",
        "Coran, sourate Adh-Dhâriyât (51), verset 58.", "coran"),
      S(Q, "Lorsqu'on demande une subsistance licite, qu'on traverse des difficultés financières ou qu'on souhaite remercier Allah pour les bienfaits reçus."),
      I("« Ô Allah, Ar-Razzâq, accorde-moi une subsistance licite, abondante et bénie, et rends-moi reconnaissant pour Tes bienfaits. »", None, EX),
      A("CORAN", ATT, AN)),

    F(18, 18, "الْفَتَّاحُ", "Al-Fattâh", "Celui qui ouvre les portes du bien et qui juge avec vérité.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-Fattâh. Il ouvre les portes de Sa miséricorde, de Sa sagesse et de Ses bienfaits. Il accorde la réussite à qui Il veut et tranche avec justice entre Ses serviteurs.

        Il est Celui qui connaît parfaitement les situations et qui juge sans injustice.

        Ce Nom nous rappelle que les solutions, les issues favorables et la véritable réussite viennent d'Allah."""),
      S(ENS, """
        - Demander à Allah de nous ouvrir les portes du bien.
        - Lui demander de faciliter les difficultés.
        - Rechercher la vérité et la justice.
        - Ne pas désespérer lorsqu'une porte semble fermée.
        - Faire confiance à Sa sagesse."""),
      P("Preuve dans le Coran", "قُلْ يَجْمَعُ بَيْنَنَا رَبُّنَا ثُمَّ يَفْتَحُ بَيْنَنَا بِالْحَقِّ وَهُوَ الْفَتَّاحُ الْعَلِيمُ",
        "« Dis : Notre Seigneur nous réunira, puis Il tranchera entre nous en toute vérité. C'est Lui le Grand Juge, l'Omniscient. »",
        "Coran, sourate Saba' (34), verset 26.", "coran"),
      S(Q, "Lorsqu'on demande à Allah de faciliter une situation, d'ouvrir une porte vers le bien, de nous guider dans une décision ou de nous accorder une issue favorable."),
      I("« Ô Allah, Al-Fattâh, ouvre-moi les portes du bien, facilite mes affaires et guide-moi vers les décisions qui Te satisfont. »", None, EX),
      A("CORAN", ATT, AN)),

    F(19, 19, "الْعَلِيمُ", "Al-'Alîm", "L'Omniscient, Celui qui sait absolument toute chose.", "Coran — attesté explicitement.", "etabli", "coran",
      S(E, """
        Allah est Al-'Alîm. Sa connaissance est parfaite, complète et illimitée.

        Il connaît le passé, le présent et l'avenir. Rien ne Lui échappe, qu'il s'agisse des choses visibles ou invisibles, des paroles prononcées, des intentions ou des pensées les plus secrètes.

        La connaissance humaine est limitée et acquise progressivement, tandis que la connaissance d'Allah est parfaite et n'a ni commencement ni fin."""),
      S(ENS, """
        - Être sincère dans nos intentions, car Allah connaît nos cœurs.
        - Ne pas croire que nos actes cachés échappent à Sa connaissance.
        - Reconnaître les limites de notre propre savoir.
        - Demander à Allah une connaissance bénéfique.
        - Éviter de juger les autres sur ce que nous ignorons de leurs intentions."""),
      P("Preuves dans le Coran", "وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ", "« Et Il est Omniscient de toute chose. »",
        "Coran, sourate Al-Baqara (2), verset 29.", "coran", "Autre référence : Coran, sourate Al-An'âm (6), verset 101."),
      S(Q, "Lorsqu'on demande à Allah de nous guider dans une décision, de nous accorder une connaissance utile ou de nous aider à agir avec sincérité."),
      I("« Ô Allah, Al-'Alîm, Toi qui connais toute chose, accorde-moi une connaissance bénéfique, purifie mes intentions et guide-moi vers la vérité. »", None, EX),
      A("CORAN", ATT, AN)),

    F(20, 20, "الْقَابِضُ", "Al-Qâbid", "Celui qui retient et restreint selon Sa sagesse.", "Sunna — hadith qualifié de « hasan sahih » par At-Tirmidhî.", "etabli", "sunna",
      S(E, """
        Allah est Celui qui peut restreindre ou retenir certains bienfaits selon Sa sagesse et Son décret.

        Ce Nom est associé à Al-Bâsit, Celui qui étend et accorde largement. Allah peut accorder une subsistance abondante à certains moments et la restreindre à d'autres.

        Cela ne signifie pas que chaque difficulté financière ou chaque privation est une punition. Nous ne connaissons pas toujours la sagesse qui se trouve derrière les événements.

        Le croyant doit continuer à faire les efforts licites, à demander l'aide d'Allah et à garder confiance en Lui."""),
      S(ENS, """
        - Reconnaître qu'Allah est le Maître de toute subsistance.
        - Faire preuve de patience lorsque les ressources sont limitées.
        - Ne pas désespérer pendant les périodes difficiles.
        - Ne pas oublier Allah lorsque les bienfaits sont abondants.
        - Être reconnaissant et généreux selon ses possibilités."""),
      PR("Preuve dans la Sunna", "إِنَّ اللَّهَ هُوَ الْمُسَعِّرُ الْقَابِضُ الْبَاسِطُ الرَّزَّاقُ", "Inna Allâha huwa al-Mus'iru al-Qâbidu al-Bâsitu ar-Razzâq.",
         "« Allah est Celui qui fixe les prix, Celui qui retient, Celui qui étend et le Pourvoyeur. »", "Jâmi' At-Tirmidhî, hadith 1314.", "sahih",
         """
         Le Prophète ﷺ a enseigné qu'Allah est notamment Al-Qâbid, Al-Bâsit et Ar-Razzâq.

         Le hadith rapporte qu'à une période où les prix avaient augmenté, des personnes demandèrent au Prophète ﷺ de fixer les prix. Il répondit :""",
         """
         Authenticité : At-Tirmidhî qualifie ce hadith de « hasan sahih ». Il est également classé authentique dans l'édition de Dârussalâm.

         Précision importante : Ce hadith constitue une preuve dans la Sunna pour les termes Al-Qâbid, Al-Bâsit et Ar-Razzâq. Il faut donc distinguer cette attestation prophétique des noms uniquement déduits d'une action coranique."""),
      S(Q, "Lorsqu'on traverse une période de restriction ou de difficulté, tout en demandant à Allah de nous accorder une subsistance licite et suffisante."),
      I("« Ô Allah, Toi qui accordes et qui retiens selon Ta sagesse, facilite mes affaires, accorde-moi une subsistance licite et rends-moi reconnaissant dans toutes les situations. »", None, EX),
      A("SUNNA", "Attesté dans un hadith qualifié de « hasan sahih » par At-Tirmidhî. Le terme apparaît explicitement dans la parole prophétique rapportée.", AN)),
]
