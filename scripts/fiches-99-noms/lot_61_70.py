from outils import F, S, P, I, A, D, PR, FP_LONG, FP_RAPPEL

E = "Explication"
ENS = "Ce que ce nom nous enseigne"
Q = "Quand invoquer Allah par ce nom"
EX = "Exemple d'invocation personnelle"
PC = "Preuve dans le Coran"
AUT = "Nom explicitement attesté dans le Coran."
PROV = "Coran — nom explicitement attesté."
HAYY = "Yâ Hayyu, Yâ Qayyûm, bi-rahmatika astaghîth."
HAYY_SENS = "Sens : « Ô Vivant, ô Celui qui subsiste par Lui-même, c'est par Ta miséricorde que je cherche secours. »"

# ⚠️ Numéros : ChatGPT 61 à 66 = appli 61 à 66 ; ChatGPT 67 As-Samad = appli 68 (l'appli a « 67 Al-Ahad »)
FICHES = [
    F(61, 61, "الْمُمِيتُ", "Al-Mumît", "Celui qui donne la mort.", "Coran — acte attesté ; forme nominale à présenter avec prudence.", "divergence", "discute",
      S(E, """
        Al-Mumît est traditionnellement expliqué comme Celui qui décrète la mort et met fin à la vie des créatures selon Sa volonté.

        Allah est Celui qui donne la vie et Celui qui décrète la mort. Aucune créature ne peut échapper au terme de sa vie lorsqu'Allah l'a décrété.

        La mort n'est pas une injustice ou un événement qui échappe à la connaissance d'Allah : elle fait partie de Son décret et de l'ordre de la création.

        Il faut toutefois distinguer l'affirmation coranique selon laquelle Allah fait mourir de l'établissement de la forme nominale Al-Mumît comme nom indépendant. Le Coran atteste clairement l'acte divin de donner la mort ; la forme nominale exacte doit être présentée avec prudence."""),
      S(ENS, """
        - Se rappeler que la vie terrestre est temporaire.
        - Préparer notre rencontre avec Allah par la foi et les bonnes œuvres.
        - Ne pas considérer la mort comme la fin de toute existence.
        - Être reconnaissants pour le temps qui nous est accordé.
        - Éviter de remettre à plus tard le repentir et les bonnes actions."""),
      P("Preuve dans le Coran liée à son sens", None, "« C'est Lui qui donne la vie et qui donne la mort. »", "Sourate Al-Mu'minûn, 23:80.", "coran",
        "Autre référence : Sourate Âl 'Imrân, 3:156."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - L'acte de donner la mort est explicitement affirmé dans le Coran.
        - La forme exacte Al-Mumît comme nom indépendant est à distinguer de l'affirmation de cet acte.
        - Ne pas prétendre que le simple emploi d'un verbe établit automatiquement un nom divin."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur le fait que notre vie et notre mort sont entre les mains d'Allah. Ne pas présenter une formule particulière avec Al-Mumît comme invocation prophétique établie."),
      I("« Ô Allah, Toi qui décides de la vie et de la mort, accorde-moi une vie consacrée à Ton obéissance et une bonne fin. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ")),

    F(62, 62, "الْحَيُّ", "Al-Hayy", "Le Vivant, Celui dont la vie est parfaite et éternelle.", PROV, "etabli", "coran",
      S(E, """
        Al-Hayy signifie qu'Allah est le Vivant, Celui dont la vie est parfaite et éternelle.

        Sa vie n'a ni commencement ni fin. Elle ne dépend d'aucune créature et n'est accompagnée d'aucune faiblesse, fatigue ou disparition.

        La vie des êtres humains est limitée et dépend de leur Créateur. La vie d'Allah, elle, est parfaite et éternelle, conformément à Sa majesté.

        Ce nom nous rappelle que nous devons nous tourner vers Celui qui ne meurt jamais et qui ne connaît aucune faiblesse."""),
      S(ENS, """
        - Reconnaître qu'Allah est le Vivant éternel.
        - Placer notre confiance en Celui qui ne disparaît jamais.
        - Comprendre que notre existence dépend entièrement de Lui.
        - Ne pas attribuer à Allah les limites propres aux créatures."""),
      P(PC, None, "« Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. »", "Sourate Al-Baqara, 2:255.", "coran",
        "Autre référence : Sourate Âl 'Imrân, 3:2."),
      S(Q, "Lorsque nous demandons à Allah de nous soutenir, de nous guider et de nous accorder une foi vivante et sincère."),
      I("« Ô Allah, Al-Hayy, Toi le Vivant qui ne meurs jamais, raffermis mon cœur dans la foi et aide-moi à vivre dans Ton obéissance. »", None, EX),
      PR("Invocation prophétique à distinguer", None, HAYY, "Le Prophète ﷺ invoquait Allah avec cette formule.\n\n" + HAYY_SENS,
         "Jâmi' At-Tirmidhî, 3524. Rapporté également dans d'autres recueils.", None, None,
         "À vérifier selon l'édition et la numérotation retenues ; ne pas afficher une gradation sans source précise."),
      A("CORAN", AUT)),

    F(63, 63, "الْقَيُّومُ", "Al-Qayyûm", "Celui qui subsiste par Lui-même et qui fait subsister toute chose.", PROV, "etabli", "coran",
      S(E, """
        Al-Qayyûm signifie qu'Allah existe par Lui-même, sans dépendre de personne, tandis que toute la création dépend de Lui.

        Il maintient l'existence de toute chose et veille sur Sa création.

        Il n'a besoin ni de repos, ni de sommeil, ni d'aide. Rien ne subsiste sans Sa volonté et Sa puissance.

        Ce nom nous rappelle notre dépendance totale envers Allah et Sa perfection absolue."""),
      S(ENS, """
        - Reconnaître que nous dépendons entièrement d'Allah.
        - Ne pas placer notre confiance absolue dans les créatures.
        - Lui demander de nous soutenir dans toutes nos affaires.
        - Garder à l'esprit qu'Allah ne connaît aucune faiblesse."""),
      P(PC, None, "« Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. »", "Sourate Al-Baqara, 2:255.", "coran",
        "Autre référence : Sourate Âl 'Imrân, 3:2."),
      S(Q, "Lorsque nous demandons Son soutien, Sa protection et Son aide dans les affaires importantes de notre vie."),
      I("« Ô Allah, Al-Qayyûm, Toi qui fais subsister toute chose, prends en charge mes affaires, raffermis ma foi et ne me laisse pas livré à mes seules faiblesses. »", None, EX),
      PR("Invocation prophétique à distinguer", None, HAYY, HAYY_SENS, "Jâmi' At-Tirmidhî, 3524.", None),
      A("CORAN", AUT)),

    F(64, 64, "الْوَاجِدُ", "Al-Wâjid", "Celui à qui rien ne manque, Celui qui ne perd ni ne manque de rien.", "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Wâjid est traditionnellement expliqué comme Celui qui ne manque de rien et qui possède une richesse, une puissance et une perfection absolues.

        Allah n'a besoin d'aucune chose et aucune réalité ne Lui échappe.

        Il ne faut pas comprendre ce nom selon le sens humain du fait de chercher ou de trouver quelque chose après l'avoir perdu. Allah ne connaît ni perte, ni manque, ni recherche liée à une ignorance préalable.

        Ce nom figure dans certaines énumérations traditionnelles des 99 noms, mais son établissement comme nom indépendant fait l'objet de discussions. La liste détaillée populaire attribuée au hadith des 99 noms ne constitue pas, à elle seule, une preuve incontestable de chaque nom."""),
      S(ENS, """
        - Reconnaître qu'Allah n'a besoin de personne.
        - Comprendre que toute créature dépend de Lui.
        - Éviter de nous croire indépendants de notre Créateur.
        - Placer notre confiance en Celui qui possède toute perfection."""),
      P("Preuve et prudence", None, "« Allah, Le Seul à être imploré pour ce que nous désirons. »", "Référence liée au sens : Sourate Al-Ikhlâs, 112:2.", "coran", """
        Le sens général de la perfection et de l'absence de besoin d'Allah est établi dans le Coran.

        Autre référence : Sourate Fâtir, 35:15."""),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - Son statut comme nom indépendant est discuté.
        - Ne pas présenter la liste détaillée attribuée à At-Tirmidhî comme une preuve authentique incontestable de ce nom."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur le fait qu'Allah n'a besoin de rien et que toute la création dépend de Lui. Par prudence, ne pas présenter une invocation spécifique avec Al-Wâjid comme formule prophétique établie."),
      I("« Ô Allah, Toi qui n'as besoin de rien, aide-moi à reconnaître ma dépendance envers Toi et à ne rechercher que Ton agrément. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ")),

    F(65, 65, "الْمَاجِدُ", "Al-Mâjid", "Le Noble, Celui dont la gloire et la noblesse sont parfaites.", "Statut comme nom indépendant discuté.", "divergence", "discute",
      S(E, """
        Al-Mâjid est traditionnellement expliqué comme Celui dont la noblesse, la gloire et la générosité sont parfaites.

        Il exprime l'excellence absolue d'Allah, Sa grandeur et Sa dignité.

        Il convient de distinguer Al-Mâjid de Al-Majîd, qui est attesté dans le Coran. Les deux formes sont proches par leur racine et leur sens, mais ne doivent pas être confondues.

        Al-Mâjid figure dans certaines listes traditionnelles des 99 noms. Son établissement comme nom indépendant doit être présenté avec prudence, car la liste détaillée populaire attribuée au hadith des 99 noms est discutée."""),
      S(ENS, """
        - Reconnaître la noblesse et la perfection d'Allah.
        - Le glorifier et Le louer.
        - Développer l'humilité devant Sa grandeur.
        - Être reconnaissants pour Ses bienfaits."""),
      P("Preuve liée à son sens", None, "Le Coran atteste explicitement le nom Al-Majîd, de la même racine :\n\n« Glorieux est Celui qui détient le Trône. »",
        "Sourate Al-Burûj, 85:15.", "coran", "Cette preuve concerne la forme Al-Majîd, et ne doit pas être présentée comme une attestation directe de la forme Al-Mâjid."),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - La forme Al-Majîd est attestée dans le Coran.
        - La forme Al-Mâjid est distincte et son statut comme nom indépendant est discuté.
        - Ne pas confondre les deux formes dans la rubrique « Authenticité »."""),
      S("Quand évoquer Allah par ce nom", "On peut méditer sur la noblesse et la gloire parfaites d'Allah. Par prudence, ne pas présenter une formule particulière avec Al-Mâjid comme invocation prophétique établie."),
      I("« Ô Allah, Toi qui possèdes la noblesse et la gloire parfaites, aide-moi à Te glorifier et à vivre dans l'humilité et la reconnaissance. »", FP_RAPPEL, "Exemple de rappel personnel"),
      A("STATUT DISCUTÉ")),

    F(66, 66, "الْوَاحِدُ", "Al-Wâhid", "L'Unique, Celui qui est seul dans Sa divinité et Sa perfection.", PROV, "etabli", "coran",
      S(E, """
        Al-Wâhid signifie qu'Allah est unique et sans associé.

        Il est le seul véritable Dieu, digne d'être adoré. Il n'a ni égal, ni partenaire, ni semblable.

        Son unicité concerne Sa divinité, Sa seigneurie et Ses noms et attributs.

        Ce nom est au cœur du message de l'islam : adorer Allah seul et ne rien Lui associer."""),
      S(ENS, """
        - Adorer Allah seul.
        - Rejeter toute forme d'association à Allah.
        - Placer notre confiance en Lui seul.
        - Reconnaître que personne ne partage Sa divinité."""),
      P(PC, None, "« Dis : Il est Allah, Unique. »", "Sourate Al-Ikhlâs, 112:1.", "coran", "Autre référence : Sourate Al-Baqara, 2:163."),
      S(Q, "Lorsque nous affirmons Son unicité, Lui demandons de raffermir notre foi et recherchons Son aide dans notre adoration."),
      I("« Ô Allah, Al-Wâhid, raffermis mon cœur dans Ton unicité, éloigne-moi de toute forme d'association et aide-moi à T'adorer sincèrement. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(68, 67, "الصَّمَدُ", "As-Samad", "Celui dont toute la création dépend et vers qui tous se tournent.", PROV, "etabli", "coran",
      S(E, """
        As-Samad est un nom d'une grande profondeur.

        Les savants l'expliquent notamment comme Celui qui est parfait dans Sa grandeur, Sa souveraineté et Ses attributs, Celui dont toutes les créatures ont besoin et vers qui elles se tournent dans leurs besoins.

        Allah, Lui, n'a besoin de personne.

        Ce nom nous rappelle que quels que soient nos besoins, nos difficultés ou nos inquiétudes, nous devons nous tourner vers Allah."""),
      S(ENS, """
        - Ne demander le secours ultime qu'à Allah.
        - Reconnaître que toute la création dépend de Lui.
        - Ne pas placer notre confiance absolue dans les créatures.
        - Comprendre qu'Allah n'a besoin de rien."""),
      P(PC, None, "« Allah, Le Seul à être imploré pour ce que nous désirons. »", "Sourate Al-Ikhlâs, 112:2.", "coran"),
      S(Q, "Lorsque nous avons un besoin important, cherchons Son secours ou souhaitons nous rappeler que Lui seul est indépendant de toute chose."),
      I("« Ô Allah, As-Samad, Toi dont toute la création dépend, réponds à mes besoins par Ta grâce et aide-moi à ne dépendre que de Toi dans mon cœur. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(69, 68, "الْقَادِرُ", "Al-Qâdir", "Le Tout-Puissant, Celui qui a pouvoir sur toute chose.", PROV, "etabli", "coran",
      S(E, """
        Al-Qâdir signifie qu'Allah possède une puissance parfaite et qu'Il est capable de toute chose.

        Rien ne peut Le limiter ou L'empêcher d'accomplir ce qu'Il veut.

        La puissance des créatures est limitée et dépend de Lui. La puissance d'Allah est absolue.

        Ce nom nous apprend à ne jamais considérer une difficulté comme impossible pour Allah."""),
      S(ENS, """
        - Reconnaître la puissance absolue d'Allah.
        - Garder espoir dans les situations difficiles.
        - Ne pas désespérer de Sa capacité à changer une situation.
        - Placer notre confiance en Lui tout en prenant les moyens licites."""),
      P(PC, None, """
        « Ne sait-Il pas, Lui qui a créé, alors que c'est Lui le Compatissant, le Parfaitement Connaisseur ? »

        Pour une attestation directe de la forme Al-Qâdir :

        « Dis : Il est capable de faire venir contre vous un châtiment d'en haut ou de dessous vos pieds. »""",
        "Sourate Al-An'âm, 6:65.", "coran", "Autre référence : Sourate Al-Qiyâma, 75:40."),
      S(Q, "Lorsque nous faisons face à une difficulté qui nous semble insurmontable ou lorsque nous demandons à Allah de faciliter une affaire."),
      I("« Ô Allah, Al-Qâdir, Tu es capable de toute chose. Facilite mes affaires, éloigne de moi ce qui est mauvais et guide-moi vers ce qui est bon. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(70, 69, "الْمُقْتَدِرُ", "Al-Muqtadir", "Le Tout-Puissant, Celui dont la puissance est absolue et parfaite.", PROV, "etabli", "coran",
      S(E, """
        Al-Muqtadir exprime la puissance absolue et la maîtrise parfaite d'Allah.

        Il possède une capacité totale sur toute chose. Rien ne peut contrarier Sa volonté ni limiter Sa puissance.

        Ce nom est proche du sens de Al-Qâdir, mais les deux formes sont distinctes et toutes deux apparaissent dans le Coran.

        Il nous rappelle que toute puissance appartient à Allah et que les capacités des créatures restent limitées."""),
      S(ENS, """
        - Reconnaître la souveraineté et la puissance absolues d'Allah.
        - Garder confiance en Lui face aux difficultés.
        - Ne pas être impressionnés par la puissance des créatures au point d'oublier leur dépendance envers Allah.
        - Se rappeler que tout dépend de Sa volonté et de Sa sagesse."""),
      P(PC, None, "« Dans un séjour de vérité, auprès d'un Souverain Omnipotent. »", "Sourate Al-Qamar, 54:55.", "coran", "Autre référence : Sourate Al-Kahf, 18:45."),
      S(Q, "Lorsque nous demandons à Allah de nous aider dans une affaire difficile et lorsque nous reconnaissons Sa puissance absolue."),
      I("« Ô Allah, Al-Muqtadir, Toi dont la puissance est parfaite, accorde-moi Ton aide, facilite ce qui est bon et éloigne-moi de ce qui pourrait me nuire. »", FP_LONG, EX),
      A("CORAN", AUT)),

    F(71, 70, "الْمُقَدِّمُ", "Al-Muqaddim", "Celui qui fait avancer et qui place en avant selon Sa sagesse.",
      "Forme nominale à présenter avec prudence ; employée dans une invocation prophétique authentique.", "divergence", "discute",
      S(E, """
        Al-Muqaddim est traditionnellement expliqué comme Celui qui fait avancer, donne la priorité ou place en avant ce qu'Il veut selon Sa sagesse.

        Allah décide de l'ordre des événements et de ce qui doit être avancé ou retardé.

        Ce nom est souvent associé à Al-Mu'akhkhir, Celui qui retarde.

        Il faut cependant distinguer l'expression du sens de cet acte divin de l'établissement de la forme Al-Muqaddim comme nom indépendant. Les preuves doivent être examinées selon les critères retenus pour les noms divins, et il ne faut pas présenter une interprétation comme un consensus incontestable."""),
      S(ENS, """
        - Reconnaître que les événements se déroulent selon la sagesse d'Allah.
        - Ne pas désespérer lorsque certaines choses prennent du temps.
        - Demander à Allah de faciliter les bonnes initiatives.
        - Faire preuve de patience et de confiance dans Ses décisions."""),
      P("Preuve et prudence", texte="""
        Le Coran établit qu'Allah fait avancer ou retarde selon Sa volonté et Sa sagesse, mais il faut éviter de présenter une occurrence verbale comme une preuve automatique de la forme nominale Al-Muqaddim.

        Pour l'association traditionnelle de Al-Muqaddim et Al-Mu'akhkhir, une invocation authentique rapportée dans Sahîh Muslim est particulièrement pertinente.""",
        ref="Référence liée au sens de l'ordre et de la sagesse divine : Sourate Ibrâhîm, 14:4.", degre="coran"),
      D("""
        - Présent dans la liste traditionnelle des 99 noms.
        - La forme nominale Al-Muqaddim est à présenter avec prudence dans une classification fondée sur les preuves explicites.
        - Une invocation prophétique authentique emploie les expressions « Al-Muqaddim » et « Al-Mu'akhkhir »."""),
      S(Q, "Lorsque nous demandons à Allah de faire avancer une affaire bénéfique, de faciliter une bonne décision et de nous guider vers ce qui est meilleur."),
      PR("Invocation prophétique authentique à distinguer", None, "Anta al-Muqaddimu wa Anta al-Mu'akhkhir.",
         "Le Prophète ﷺ disait notamment :\n\nSens : « C'est Toi qui fais avancer et c'est Toi qui fais retarder. »", "Sahîh Muslim, 771.", "sahih"),
      I("« Ô Allah, Toi qui fais avancer et retarder selon Ta sagesse, fais avancer pour moi ce qui est bénéfique et éloigne ce qui n'est pas bon pour ma religion et ma vie. »",
        "Cette dernière formulation est personnelle ; la citation précédente est la formule rapportée dans le hadith.", EX),
      A("STATUT DISCUTÉ")),
]
