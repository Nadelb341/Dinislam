"""
🌟 99 noms — 27/11/2026 (nuit) : fiche n° 67 AL-AHAD (texte ChatGPT de Nadia, vérifié) + ajout du verset « لَمُحْىِ ٱلْمَوْتَىٰ »
à la fiche 60 Al-Muhyî (Nadia : « 4 : ok »). Lit la v3, écrit :
  - supabase/data/allah_names_fiches_adultes_v4_2026-11-27.json
  - supabase/migrations/20261127250000_fiches_99_noms_al_ahad.sql
Vérifications faites le 27/11 :
  - 112:1, 30:50, 41:39 : édition quran-uthmani (api.alquran.cloud), traductions Hamidullah ;
  - Abû Dâwûd 1493 et At-Tirmidhî 3475 (hadith-api fawazahmed0) : même texte que la fiche (« بِأَنِّي » = version d'At-Tirmidhî) ;
    degrés : Abû Dâwûd 1493 → Al-Albânî sahih, Chou'ayb Al-Arna'ût sahih ; At-Tirmidhî 3475 → At-Tirmidhî « hasan gharîb »,
    Al-Albânî sahih, Ahmad Châkir sahih, Zubair 'Alî Zaï sahih.
Lancer : python3 scripts/fiches-99-noms/al_ahad_27_11.py   (depuis la racine du projet)
"""
import copy, json, os

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.abspath(os.path.join(ICI, "..", ".."))
V3 = os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v3_2026-11-27.json")
V4 = os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v4_2026-11-27.json")
MIGRATION = os.path.join(RACINE, "supabase/migrations/20261127250000_fiches_99_noms_al_ahad.sql")

V_112_1 = "قُلْ هُوَ ٱللَّهُ أَحَدٌ"
V_30_50 = "فَٱنظُرْ إِلَىٰٓ ءَاثَٰرِ رَحْمَتِ ٱللَّهِ كَيْفَ يُحْىِ ٱلْأَرْضَ بَعْدَ مَوْتِهَآ ۚ إِنَّ ذَٰلِكَ لَمُحْىِ ٱلْمَوْتَىٰ ۖ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ"
V_41_39_FIN = "إِنَّ ٱلَّذِىٓ أَحْيَاهَا لَمُحْىِ ٱلْمَوْتَىٰٓ ۚ إِنَّهُۥ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌ"
DOUA_BURAYDA = ("اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنِّي أَشْهَدُ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ الْأَحَدُ الصَّمَدُ، "
                "الَّذِي لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ")
DIVERGENCE_3475 = ("At-Tirmidhî : hasan gharîb. Al-Albânî : sahih. Ahmad Châkir : sahih. Zubair 'Alî Zaï : sahih. "
                   "Pour Abû Dâwûd 1493 : Al-Albânî et Chou'ayb Al-Arna'ût : sahih.")

AL_AHAD = {
    "nom_arabe": "الأَحَدُ",
    "translit": "Al-Ahad",
    "traduction": "L'Unique, le Seul, sans associé ni égal.",
    "provenance": "Coran (sourate Al-Ikhlâs, 112:1) et Sunna authentique.",
    "statut": "etabli",
    "classement": "coran",
    "sections": [
        {"type": "texte", "titre": "Explication", "texte":
            "Al-Ahad signifie qu'Allah est absolument Unique, seul dans Sa divinité, Sa seigneurie, Ses noms et Ses attributs.\n\n"
            "Il n'a aucun associé, aucun égal, aucun semblable et personne ne Lui est comparable. Il est unique dans Sa perfection "
            "et rien dans Sa création ne Lui ressemble.\n\n"
            "Ce nom exprime le fondement même du monothéisme : Allah seul mérite d'être adoré. Aucun être ne partage avec Lui Sa "
            "divinité ni Sa perfection.\n\n"
            "Il ne faut pas confondre l'unicité d'Allah avec une simple unité de nombre : Allah est unique d'une manière qui Lui "
            "est propre, sans pareil ni équivalent."},
        {"type": "texte", "titre": "Ce que ce nom nous enseigne", "texte":
            "- Adorer Allah seul, sans rien Lui associer.\n"
            "- Placer notre confiance en Lui : Il est notre seul Seigneur, et toutes nos demandes Lui sont adressées.\n"
            "- Ne rien comparer à Allah : aucune créature ne Lui ressemble.\n"
            "- Renforcer notre foi : le vrai monothéisme, c'est reconnaître l'unicité absolue d'Allah.\n"
            "- Être sincères : notre prière, nos invocations et notre adoration sont pour Allah seul."},
        {"type": "preuve", "titre": "Preuve dans le Coran", "arabe": V_112_1,
         "traduction": "« Dis : Il est Allah, l'Unique. »", "ref": "Sourate Al-Ikhlâs, 112:1.", "degre": "coran",
         "texte": "Ce verset affirme directement l'unicité absolue d'Allah et contient le nom Al-Ahad."},
        {"type": "texte", "titre": "Quand invoquer Allah par ce nom", "texte":
            "Nous pouvons invoquer Allah par ce nom quand nous voulons :\n"
            "- affirmer notre foi en Son unicité ;\n"
            "- Lui demander de raffermir notre foi et notre attachement au tawhîd ;\n"
            "- Lui demander de nous préserver de toute forme d'association ;\n"
            "- Lui confier nos besoins en reconnaissant qu'Il est le seul Seigneur digne d'adoration.\n\n"
            "Sans lui attribuer un moment particulier, un nombre de répétitions ou un mérite qui ne seraient pas établis."},
        {"type": "invocation", "titre": "Exemple d'invocation personnelle", "texte":
            "« Ô Allah, Al-Ahad, Toi l'Unique, raffermis mon cœur dans la foi, préserve-moi de toute forme d'association et "
            "aide-moi à T'adorer sincèrement, sans rien T'associer. »",
         "note": "Cette formulation est une invocation personnelle, et non une formule prophétique spécifique rapportée."},
        {"type": "prophetique", "titre": "Invocation entendue par le Prophète ﷺ", "arabe": DOUA_BURAYDA, "phonetique": None,
         "traduction": "« Ô Allah ! Je Te demande en attestant que Tu es Allah, qu'il n'y a aucune divinité digne d'être adorée "
                       "en dehors de Toi, l'Unique, Celui dont toutes les créatures ont besoin, Celui qui n'a pas engendré et "
                       "n'a pas été engendré, et auquel nul n'est égal. »",
         "ref": "Sunan Abî Dâwûd 1493 et Jâmi' At-Tirmidhî 3475, d'après Burayda ibn Al-Husayb (qu'Allah l'agrée).",
         "degre": "sahih",
         "texte": "Avis sur son authenticité : " + DIVERGENCE_3475,
         "note": "Précision importante : dans ce récit, le Prophète ﷺ entend un homme prononcer cette invocation, puis il dit que "
                 "cet homme a invoqué Allah par Son Nom suprême. Ce n'est donc pas une invocation que le Prophète ﷺ aurait "
                 "lui-même prononcée.",
         "divergence": DIVERGENCE_3475},
        {"type": "authenticite", "titre": "Authenticité et provenance", "badge": "CORAN", "texte":
            "Statut : établi par le Coran et attesté dans la Sunna.\n\n"
            "Le nom Al-Ahad apparaît dans le Coran, sourate Al-Ikhlâs, verset 1.\n\n"
            "Il figure aussi dans l'invocation rapportée par Abû Dâwûd (1493) et At-Tirmidhî (3475), jugée authentique par "
            "des spécialistes du hadith.\n\n"
            "Son sens est fondamental dans la croyance sunnite : Allah est Unique et rien ne Lui est comparable."},
    ],
    "numero_appli": 67,
    "numero_source": None,
}

AL_AHAD_ENFANT = {
    "nom_arabe": "الأَحَدُ",
    "translit": "Al-Ahad",
    "statut": "etabli",
    "sens": "Allah est l'Unique : personne n'est comme Lui.",
    "comme": "Quand je récite la sourate Al-Ikhlâs, je dis qu'Allah est Unique.",
    "faire": "J'adore Allah seul et je fais mes prières pour Lui.",
    "dire": "Qoul houwa llâhou ahad.",
    "dire_type": "texte",
    "dire_arabe": V_112_1,
    "dire_traduction": "« Dis : Il est Allah, l'Unique. »",
    "dire_ref": "Coran, sourate Al-Ikhlâs (112), verset 1.",
    "dire_degre": "coran",
    "prudence": None,
    "a_relire": True,
}


def corriger_60(f):
    p = [s for s in f["sections"] if s["type"] == "preuve"]
    assert len(p) == 1 and p[0]["ref"] == "Sourate Ar-Rûm, 30:50." and p[0]["arabe"] is None
    p[0]["arabe"] = V_30_50
    p[0]["texte"] = ("Le Coran dit « لَمُحْىِ ٱلْمَوْتَىٰ » (muhyî al-mawtâ : « Celui qui fait revivre les morts ») : le mot est "
                     "suivi d'un complément. C'est pourquoi la forme seule « Al-Muhyî » est discutée.")
    i = f["sections"].index(p[0])
    f["sections"].insert(i + 1, {
        "type": "preuve", "titre": "Autre verset", "arabe": V_41_39_FIN,
        "traduction": "« Celui qui lui redonne la vie est certes Celui qui fera revivre les morts, car Il est Omnipotent. »",
        "ref": "Sourate Fussilat, 41:39 (fin du verset).", "degre": "coran", "texte": None})


def main():
    v3 = json.load(open(V3, encoding="utf-8"))
    avant = {f["numero_appli"]: f for f in v3}
    assert 67 not in avant
    apres = copy.deepcopy(avant)
    corriger_60(apres[60])
    apres[67] = AL_AHAD
    json.dump([apres[o] for o in sorted(apres)], open(V4, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    j = lambda f: json.dumps({k: v for k, v in f.items() if k != "numero_appli"}, ensure_ascii=False)
    lignes = [
        "-- 🌟 99 noms : fiche n° 67 Al-Ahad (adulte + enfant) et verset « muhyî al-mawtâ » sur la fiche 60 — GÉNÉRÉ par",
        "-- scripts/fiches-99-noms/al_ahad_27_11.py. À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`). Relancer = sans effet.",
        "",
        f"update public.allah_names set fiche_adulte = $v${j(apres[67])}$v$::jsonb, "
        f"fiche_enfant = $v${json.dumps(AL_AHAD_ENFANT, ensure_ascii=False)}$v$::jsonb "
        f"where display_order = 67 and fiche_adulte is null;",
        f"update public.allah_names set fiche_adulte = $v${j(apres[60])}$v$::jsonb where display_order = 60 "
        f"and fiche_adulte = $v${j(avant[60])}$v$::jsonb;",
        "",
        "-- Contrôle : 2 lignes attendues avec ok = true",
        f"select display_order, transliteration, fiche_adulte = $v${j(apres[67])}$v$::jsonb and fiche_enfant is not null as ok "
        f"from public.allah_names where display_order = 67 union all "
        f"select display_order, transliteration, fiche_adulte = $v${j(apres[60])}$v$::jsonb from public.allah_names where display_order = 60 order by 1;",
    ]
    assert "$v$" not in j(apres[67]) + j(apres[60])
    open(MIGRATION, "w", encoding="utf-8").write("\n".join(lignes) + "\n")
    print("✅ v4 écrite (99 fiches) + migration")


if __name__ == "__main__":
    main()
