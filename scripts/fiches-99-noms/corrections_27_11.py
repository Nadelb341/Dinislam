"""
🌟 99 noms — CORRECTIONS du 27/11/2026 (soir), demandées par Nadia après relecture avec ChatGPT (points 1 à 17 de la page
« Vérification des 99 noms »). Lit la copie de référence v2, applique les corrections, écrit :
  - supabase/data/allah_names_fiches_adultes_v3_2026-11-27.json
  - supabase/migrations/20261127240000_fiches_99_noms_corrections.sql
Sécurité : une fiche adulte n'est remplacée que si elle est ENCORE identique à la v2 (pas retouchée au crayon ✏️ depuis) ;
sinon elle est laissée telle quelle et la requête de contrôle finale la signale.
Textes arabes du Coran : recopiés de l'édition « quran-uthmani » (Tanzil, via api.alquran.cloud, la même que le lecteur
de sourates de l'appli), jamais de mémoire. Degrés des hadiths : vérifiés sur hadith-api (fawazahmed0) le 27/11.
Lancer : python3 scripts/fiches-99-noms/corrections_27_11.py   (depuis la racine du projet)
"""
import copy, json, os

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.abspath(os.path.join(ICI, "..", ".."))
V2 = os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v2_2026-11-27.json")
V3 = os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v3_2026-11-27.json")
MIGRATION = os.path.join(RACINE, "supabase/migrations/20261127240000_fiches_99_noms_corrections.sql")
PRUDENCE = "Les savants ne sont pas tous d'accord pour dire que c'est un nom d'Allah."

# --- Versets (édition quran-uthmani, copiés tels quels) ---
V_1_3 = "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
V_2_163 = "وَإِلَٰهُكُمْ إِلَٰهٌۭ وَٰحِدٌۭ ۖ لَّآ إِلَٰهَ إِلَّا هُوَ ٱلرَّحْمَٰنُ ٱلرَّحِيمُ"
V_59_23 = "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ"
V_59_24_FIN = "وَهُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ"
V_6_65_DEBUT = "قُلْ هُوَ ٱلْقَادِرُ عَلَىٰٓ أَن يَبْعَثَ عَلَيْكُمْ عَذَابًۭا مِّن فَوْقِكُمْ أَوْ مِن تَحْتِ أَرْجُلِكُمْ"
V_75_40 = "أَلَيْسَ ذَٰلِكَ بِقَٰدِرٍ عَلَىٰٓ أَن يُحْۦِىَ ٱلْمَوْتَىٰ"
V_6_37_EXTRAIT = "قُلْ إِنَّ ٱللَّهَ قَادِرٌ عَلَىٰٓ أَن يُنَزِّلَ ءَايَةًۭ"
V_6_103 = "لَّا تُدْرِكُهُ ٱلْأَبْصَٰرُ وَهُوَ يُدْرِكُ ٱلْأَبْصَٰرَ ۖ وَهُوَ ٱللَّطِيفُ ٱلْخَبِيرُ"
V_4_85_FIN = "وَكَانَ ٱللَّهُ عَلَىٰ كُلِّ شَىْءٍۢ مُّقِيتًۭا"
V_14_8_FIN = "فَإِنَّ ٱللَّهَ لَغَنِىٌّ حَمِيدٌ"
V_11_73_FIN = "إِنَّهُۥ حَمِيدٌۭ مَّجِيدٌۭ"
V_35_15 = "يَٰٓأَيُّهَا ٱلنَّاسُ أَنتُمُ ٱلْفُقَرَآءُ إِلَى ٱللَّهِ ۖ وَٱللَّهُ هُوَ ٱلْغَنِىُّ ٱلْحَمِيدُ"
V_2_245_FIN = "وَٱللَّهُ يَقْبِضُ وَيَبْصُۜطُ وَإِلَيْهِ تُرْجَعُونَ"

TRAD_59_23 = ("« C'est Lui, Allah, en dehors de qui il n'y a pas de divinité : le Souverain, le Très Saint, la Paix, "
              "Celui qui accorde la sécurité, le Gardien, le Tout-Puissant, Celui dont la volonté s'accomplit, le Suprême. "
              "Gloire à Allah ! Il est au-dessus de ce qu'ils Lui associent. »")
REF_59_23 = "Sourate Al-Hachr, 59:23."
TEXTE_59_23 = "Traduction du sens, avec les mêmes mots que les titres des fiches 3 à 10."


def P(titre, arabe, traduction, ref, degre="coran", texte=None):
    return {"type": "preuve", "titre": titre, "arabe": arabe, "traduction": traduction, "ref": ref, "degre": degre, "texte": texte}


def section(f, titre=None, type_=None):
    r = [s for s in f["sections"] if (titre is None or s["titre"] == titre) and (type_ is None or s["type"] == type_)]
    assert len(r) == 1, (f["translit"], titre, type_, len(r))
    return r[0]


def remplacer_texte(s, cle, ancien, nouveau):
    assert s[cle] and s[cle].count(ancien) == 1, (s["titre"], ancien)
    s[cle] = s[cle].replace(ancien, nouveau)


def corriger(d):
    """d : {numero_appli: fiche}. Modifie sur place. Renvoie {numero: changements de la version enfant}."""
    enfants = {}

    # ---- Point 15 : fiches 2 à 10, texte arabe + traduction des versets cités ----
    f = d[2]
    i = f["sections"].index(section(f, "Preuves"))
    f["sections"][i:i + 1] = [
        P("Preuve dans le Coran", V_1_3, "« Le Tout Miséricordieux, le Très Miséricordieux. »", "Sourate Al-Fâtiha, 1:3."),
        P("Autre preuve dans le Coran", V_2_163,
          "« Et votre Divinité est une divinité unique. Pas de divinité à part Lui, le Tout Miséricordieux, le Très Miséricordieux. »",
          "Sourate Al-Baqara, 2:163."),
    ]
    for o in range(3, 11):
        s = section(d[o], "Preuve")
        assert s["arabe"] is None and s["ref"].startswith("Coran 59:23"), o
        s.update({"arabe": V_59_23, "traduction": TRAD_59_23, "ref": REF_59_23, "texte": TEXTE_59_23})
    f = d[8]
    i = f["sections"].index(section(f, "Preuve"))
    f["sections"].insert(i + 1, P("Autre preuve dans le Coran", V_59_24_FIN, "« … Et c'est Lui le Tout-Puissant, le Sage. »",
                                  "Sourate Al-Hachr, 59:24 (fin du verset)."))

    # ---- Point 9 : 21 Al-Bâsit, 2:245 comme dans le Mushaf (ص avec un petit س) ----
    s = section(d[21], "Preuve dans le Coran")
    s["arabe"] = V_2_245_FIN
    s["ref"] = "Sourate Al-Baqara, 2:245 (fin du verset)."
    s["texte"] += "\n\nDans le Mushaf, « يَبْصُۜطُ » s'écrit avec la lettre ص surmontée d'un petit س, et se lit « yabsutu »."

    # ---- Points 10 et 13 : 22 Al-Khâfid ----
    f = d[22]
    f["statut"] = "non_etabli"
    f["provenance"] = "Non établi comme nom divin indépendant."
    remplacer_texte(section(f, "Ce que ce nom nous apprend"), "texte",
                    "Il ne faut pas attribuer à Allah une injustice ou une injustice arbitraire.",
                    "Il ne faut jamais attribuer à Allah la moindre injustice.")
    a = section(f, type_="authenticite")
    a["badge"] = "NON ÉTABLI"
    a["texte"] = ("Le terme Al-Khâfid, comme nom divin indépendant, n'est pas établi de manière suffisamment explicite et "
                  "incontestable par une preuve authentique.\n\nLe Coran parle d'abaisser et d'élever, mais cela ne prouve pas "
                  "directement que « Al-Khâfid » est un nom d'Allah.")
    enfants[22] = {"statut": "non_etabli"}

    # ---- Point 2 : 31 Al-Khabîr, 6:103 ----
    s = section(d[31], "Preuve dans le Coran")
    s.update({"arabe": V_6_103,
              "traduction": "« Les regards ne peuvent L'atteindre, cependant qu'Il saisit tous les regards. Et Il est le Subtil, le Parfaitement Informé. »",
              "ref": "Sourate Al-An'âm, 6:103.",
              "texte": "Ce verset cite deux noms d'Allah : Al-Latîf (اللَّطِيف), le Subtil, et Al-Khabîr (الْخَبِير), le Parfaitement Informé.\n\nAutre référence : Sourate Al-Mulk, 67:14."})

    # ---- Point 7 : 34 Al-Ghafûr et 82 Al-'Afuww, At-Tirmidhî 3513 (même appréciation dans les 2 fiches) ----
    DIV_3513 = "At-Tirmidhî : hasan sahih. Al-Albânî : sahih. Zubair 'Alî Zaï : faible (da'îf)."
    s = section(d[34], type_="prophetique")
    s["ref"] = "Jâmi' At-Tirmidhî, 3513, invocation rapportée dans le hadith de 'Â'isha au sujet de la nuit du Destin."
    s["degre"], s["divergence"] = "sahih", DIV_3513
    s["texte"] = "Avis divergents sur son authenticité : " + DIV_3513
    s = section(d[82], type_="prophetique")
    s["ref"] = "Jâmi' At-Tirmidhî, 3513."
    s["degre"], s["divergence"] = "sahih", DIV_3513
    s["note"] = "Avis divergents sur son authenticité : " + DIV_3513
    a = section(d[82], type_="authenticite")
    a["texte"] = "Attesté explicitement dans le Coran. L'invocation rapportée par At-Tirmidhî fait l'objet d'avis divergents sur son authenticité."

    # ---- Point 3 : 39 Al-Muqît, 4:85 ----
    s = section(d[39], "Preuve dans le Coran")
    s.update({"arabe": V_4_85_FIN, "traduction": "« … et Allah veille sur toute chose. »", "ref": "Sourate An-Nisâ', 4:85 (fin du verset).",
              "texte": "Le verset contient le nom Al-Muqît dans l'expression arabe « مُقِيتًا ».\n\nAl-Muqît renvoie notamment à Celui qui veille "
                       "sur toute chose, qui en assure la subsistance et qui a pouvoir sur elle. Il ne faut donc pas réduire son sens "
                       "à la seule puissance."})

    # ---- Point 17 : 55 Al-Walî, renvoi vers la fiche 77 ----
    remplacer_texte(section(d[55], "Explication"), "texte", "qui apparaît plus loin dans la liste traditionnelle",
                    "qui apparaît plus loin dans la liste traditionnelle (fiche 77)")

    # ---- Point 4 : 56 Al-Hamîd, 14:8 en preuve principale (39:7 retiré) ----
    f = d[56]
    i = f["sections"].index(section(f, "Preuve dans le Coran"))
    f["sections"][i:i + 1] = [
        P("Preuve dans le Coran", V_14_8_FIN, "« … Allah Se suffit à Lui-même et Il est digne de louange. »", "Sourate Ibrâhîm, 14:8 (fin du verset)."),
        P("Autre preuve dans le Coran", V_11_73_FIN, "« … Il est digne de louange et de gloire. »", "Sourate Hûd, 11:73 (fin du verset)."),
    ]

    # ---- Point 11 : 60 Al-Muhyî, forme nominale à préciser ----
    f = d[60]
    f["statut"], f["classement"] = "divergence", "discute"
    f["provenance"] = "Coran — Allah donne la vie (action clairement attestée) ; forme nominale « Al-Muhyî » à préciser."
    a = section(f, type_="authenticite")
    a["badge"] = "FORME NOMINALE À PRÉCISER"
    a["texte"] = ("Le sens est directement confirmé par le Coran : Allah donne la vie et fait revivre les morts.\n\n"
                  "Le statut de la forme « Al-Muhyî » comme nom indépendant dépend de la méthode retenue pour établir les noms divins.\n\n"
                  "Cette précision ne remet jamais en cause le fait qu'Allah donne la vie.")
    enfants[60] = {"statut": "divergence", "prudence": PRUDENCE, "dire": "Ô Allah, donne vie à mon cœur."}

    # ---- Point 6 : 62 Al-Hayy et 63 Al-Qayyûm, At-Tirmidhî 3524 = HASAN ----
    for o in (62, 63):
        s = section(d[o], type_="prophetique")
        s.update({"arabe": "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
                  "traduction": "Le Prophète ﷺ invoquait Allah avec cette formule.\n\n« Ô Vivant, ô Celui qui subsiste par Lui-même et par qui tout subsiste, c'est par Ta miséricorde que je cherche secours. »",
                  "ref": "Jâmi' At-Tirmidhî, 3524.", "degre": "hasan",
                  "note": "Jugé hasan, notamment par Al-Albânî. At-Tirmidhî qualifie sa transmission de « gharîb » (une seule chaîne connue), ce qui n'est pas un jugement de faiblesse."})

    # ---- Point 5 : 64 Al-Wâjid, 112:2 retiré, 35:15 en éclairage ----
    f = d[64]
    i = f["sections"].index(section(f, "Preuve et prudence"))
    f["sections"][i] = P("Éclairage sur le sens (pas une preuve du nom)", V_35_15,
                         "« Ô hommes ! Vous êtes les indigents ayant besoin d'Allah, et Allah est Celui qui Se suffit à Lui-même, le Digne de louange. »",
                         "Sourate Fâtir, 35:15.",
                         texte="Ce verset établit qu'Allah est parfaitement indépendant de Ses créatures et que toutes les créatures ont besoin de Lui. "
                               "Il éclaire un aspect du sens que certains associent à Al-Wâjid, mais ne prouve pas directement que ce terme est un nom divin établi.")
    section(f, type_="authenticite")["badge"] = "STATUT DISCUTÉ"

    # ---- Point 1 : 69 Al-Qâdir, 67:14 retiré ; 6:65, 75:40 et 6:37 ----
    f = d[69]
    i = f["sections"].index(section(f, "Preuve dans le Coran"))
    f["sections"][i:i + 1] = [
        P("Preuve dans le Coran", V_6_65_DEBUT,
          "« Dis : Il est capable (Al-Qâdir) de faire venir contre vous un châtiment d'en haut ou de dessous vos pieds… »",
          "Sourate Al-An'âm, 6:65 (début du verset)."),
        P("Autre preuve dans le Coran", V_75_40, "« Celui-là n'est-Il pas capable de faire revivre les morts ? »", "Sourate Al-Qiyâma, 75:40.",
          texte="Le verset emploie « بِقَادِرٍ » : Allah est capable de ressusciter les morts."),
        P("Autre preuve dans le Coran", V_6_37_EXTRAIT, "« Dis : Certes, Allah est capable de faire descendre un signe. »",
          "Sourate Al-An'âm, 6:37 (extrait)."),
    ]

    # ---- Point 8 : 71 Al-Muqaddim et 72 Al-Mu'akhkhir, même statut « Sunna authentique » ----
    REF_8 = "Sahîh Al-Boukhârî 1120 et Sahîh Mouslim 771."
    PRUDENT = ("Cette invocation authentique ne permet pas d'inventer des mérites particuliers ni un nombre de répétitions "
               "pour ces deux noms.")
    f = d[71]
    f["statut"], f["classement"] = "etabli", "sunna"
    f["provenance"] = "Sunna authentique."
    remplacer_texte(section(f, "Explication"), "texte",
                    "Il faut cependant distinguer l'expression du sens de cet acte divin de l'établissement de la forme Al-Muqaddim comme nom indépendant. "
                    "Les preuves doivent être examinées selon les critères retenus pour les noms divins, et il ne faut pas présenter une interprétation comme un consensus incontestable.",
                    "Les deux noms sont cités ensemble dans une invocation prophétique authentique. " + PRUDENT)
    i = f["sections"].index(section(f, "Preuve et prudence"))
    f["sections"][i] = P("Preuve authentique", "أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ",
                         "Le Prophète ﷺ disait dans une invocation :\n\nAnta al-Muqaddimu wa anta al-Mu'akhkhir.\n\n« Tu es Celui qui fait avancer et Tu es Celui qui retarde. »",
                         REF_8, degre="sahih")
    f["sections"].remove(section(f, type_="divergence"))
    f["sections"].remove(section(f, type_="prophetique"))  # même hadith que la preuve ci-dessus : plus de doublon
    remplacer_texte(section(f, type_="invocation"), "note",
                    "Cette dernière formulation est personnelle ; la citation précédente est la formule rapportée dans le hadith.",
                    "Cette formulation est personnelle ; la preuve ci-dessus est la formule rapportée dans le hadith.")
    a = section(f, type_="authenticite")
    a["titre"], a["badge"] = "Authenticité du Nom", "SUNNA AUTHENTIQUE"
    a["texte"] = "Attesté explicitement dans la Sunna authentique, dans l'invocation rapportée par Al-Boukhârî et Mouslim.\n\n" + PRUDENT
    enfants[71] = {"statut": "etabli", "prudence": None}
    f = d[72]
    s = section(f, "Preuve authentique")
    s["ref"], s["texte"] = REF_8, "Authenticité : hadith authentique, rapporté par Al-Boukhârî et Mouslim."
    a = section(f, type_="authenticite")
    a["texte"] = "Attesté explicitement dans la Sunna authentique, dans l'invocation rapportée par Al-Boukhârî et Mouslim.\n\n" + PRUDENT

    # ---- Point 12 : 78 Al-Muta'âlî, badge CORAN gardé (rien à changer) ----

    # ---- Point 14 : 85 Dhul-Jalâli wal-Ikrâm ----
    s = section(d[85], "Preuves dans le Coran")
    s["traduction"] = "« Seule subsistera la Face de ton Seigneur, Détenteur de la majesté et de la générosité. »"
    s["texte"] = ("Le mot « al-Ikrâm » est riche : il évoque la générosité, mais aussi l'honneur, la noblesse et la munificence. "
                  "Certaines traductions disent « noblesse ».\n\nAutre référence : Coran, sourate Ar-Rahmân (55), verset 78.")

    # ---- Point 16 : numéros de hadiths gardés avec leur lettre quand il y en a une (rien à changer) ----
    return enfants


def main():
    v2 = json.load(open(V2, encoding="utf-8"))
    avant = {f["numero_appli"]: f for f in v2}
    apres = copy.deepcopy(avant)
    enfants = corriger(apres)
    changees = [o for o in sorted(apres) if apres[o] != avant[o]]
    json.dump([apres[o] for o in sorted(apres)], open(V3, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    j = lambda f: json.dumps({k: v for k, v in f.items() if k != "numero_appli"}, ensure_ascii=False)
    lignes = [
        "-- 🌟 99 noms : corrections du 27/11/2026 (points 1 à 17 relus par Nadia avec ChatGPT) — GÉNÉRÉ par scripts/fiches-99-noms/corrections_27_11.py.",
        "-- Une fiche adulte n'est remplacée que si elle est encore identique à la version d'origine (pas retouchée au ✏️).",
        "-- Version enfant : seuls les champs concernés changent (statut, prudence, « Je dis »).",
        "-- À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`). Relancer = sans effet.",
        "",
    ]
    for o in changees:
        a, b = j(avant[o]), j(apres[o])
        assert "$v$" not in a + b
        lignes.append(f"update public.allah_names set fiche_adulte = $v${b}$v$::jsonb where display_order = {o} and fiche_adulte = $v${a}$v$::jsonb;")
    lignes.append("")
    for o, ch in sorted(enfants.items()):
        lignes.append(f"update public.allah_names set fiche_enfant = fiche_enfant || $v${json.dumps(ch, ensure_ascii=False)}$v$::jsonb "
                      f"where display_order = {o} and fiche_enfant is not null;")
    lignes.append("")
    lignes.append("-- Contrôle : fiches qui n'ont PAS reçu la correction (retouchées au ✏️ entre-temps) → à corriger à la main")
    lignes.append("select display_order, transliteration from public.allah_names where display_order in ("
                  + ", ".join(map(str, changees)) + ") and fiche_adulte not in ("
                  + ", ".join(f"$v${j(apres[o])}$v$::jsonb" for o in changees) + ") order by 1;")
    open(MIGRATION, "w", encoding="utf-8").write("\n".join(lignes) + "\n")
    print(f"✅ {len(changees)} fiches adultes corrigées : {changees} ; enfants : {sorted(enfants)}")


if __name__ == "__main__":
    main()
