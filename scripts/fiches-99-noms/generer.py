"""
Génère, à partir des fiches de Nadia (lot_*.py) :
  - supabase/data/allah_names_fiches_adultes_2026-11-27.json  (copie de référence)
  - supabase/migrations/20261127200000_fiches_adultes_99_noms.sql (migration additive, idempotente)
Contrôle : chaque fiche est rattachée au BON nom de l'appli (comparaison des translittérations, jamais le seul numéro).
Lancer : python3 scripts/fiches-99-noms/generer.py   (depuis la racine du projet)
"""
import json, os, re, sys, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
RACINE = os.path.abspath(os.path.join(ICI, "..", ".."))

from lot_01_12 import FICHES as L1
from lot_21_30 import FICHES as L2
from lot_31_40 import FICHES as L3
from lot_41_50 import FICHES as L4
from lot_51_60 import FICHES as L5
from lot_61_70 import FICHES as L6
from lot_71_80 import FICHES as L7
from lot_81_90 import FICHES as L8

FICHES = L1 + L2 + L3 + L4 + L5 + L6 + L7 + L8


def cle(t):
    """Squelette d'une translittération : sans accents, sans « Al- », sans voyelles doublées ni y/i, pour comparer."""
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"^(al|ar|as|ash|at|ad|adh|az|an)[- ]", "", t)
    t = re.sub(r"[^a-z]", "", t)
    t = t.replace("y", "i").replace("ou", "u").replace("sh", "ch")
    t = re.sub(r"(.)\1+", r"\1", t)
    return t


def main():
    noms = {n["display_order"]: n["transliteration"] for n in json.load(open(os.path.join(RACINE, "supabase/data/allah_names_fiches_2026-11-27.json")))}
    vus = set()
    for f in FICHES:
        o = f["o"]
        assert o not in vus, f"fiche en double : {o}"
        vus.add(o)
        a, b = cle(noms[o]), cle(f["translit"])
        # Quelques écritures différentes du même nom (vérifiées à la main)
        equiv = {("muhaimin", "muhaymin"), ("ali", "ali"), ("mutaali", "mutaali"), ("malikalmulk", "malikulmulk"),
                 ("dhuljalalwalikram", "dhuljalaliwalikram")}
        if a != b and (a, b) not in equiv and not (a.startswith(b) or b.startswith(a)):
            raise SystemExit(f"❌ Nom différent pour la fiche {o} : appli « {noms[o]} » ≠ fiche « {f['translit']} »")
    manquants = [o for o in range(1, 100) if o not in vus]

    fiches = sorted(FICHES, key=lambda f: f["o"])
    sortie = [{**{k: v for k, v in f.items() if k not in ("o", "s")}, "numero_appli": f["o"], "numero_source": f["s"]} for f in fiches]
    with open(os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_2026-11-27.json"), "w", encoding="utf-8") as fp:
        json.dump(sortie, fp, ensure_ascii=False, indent=1)

    lignes = [
        "-- 🌟 99 noms d'Allah : fiches ADULTES de Nadia (textes validés par elle, rédigés avec ChatGPT, 27/11/2026).",
        "-- Fichier GÉNÉRÉ par scripts/fiches-99-noms/generer.py (ne pas modifier à la main).",
        "-- ADDITIF : 2 colonnes (fiche_adulte = version de Nadia, fiche_enfant = future version enfant, vide et non affichée).",
        "-- Les anciennes colonnes fiche_* (fiches du 27/11) sont GARDÉES telles quelles.",
        "-- Chaque fiche ne s'écrit que si la place est vide ET que le nom correspond (sécurité contre un décalage de numéros).",
        "-- Fiches pas encore fournies par Nadia (gardent l'ancienne fiche) : " + ", ".join(map(str, manquants)) + ".",
        "-- À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`).",
        "alter table public.allah_names add column if not exists fiche_adulte jsonb;",
        "alter table public.allah_names add column if not exists fiche_enfant jsonb;",
        "comment on column public.allah_names.fiche_adulte is 'Fiche détaillée (version adulte) écrite par Nadia : traduction, statut, classement, sections.';",
        "comment on column public.allah_names.fiche_enfant is 'Future version enfant (3-12 ans) : vide tant que Nadia n''a pas validé la proposition.';",
    ]
    for f in sortie:
        j = json.dumps({k: v for k, v in f.items() if k != "numero_appli"}, ensure_ascii=False)
        assert "$fiche$" not in j
        lignes.append(
            f"update public.allah_names set fiche_adulte = $fiche${j}$fiche$::jsonb "
            f"where display_order = {f['numero_appli']} and fiche_adulte is null;")
    lignes.append("select count(*) as fiches_adultes from public.allah_names where fiche_adulte is not null;")
    with open(os.path.join(RACINE, "supabase/migrations/20261127200000_fiches_adultes_99_noms.sql"), "w", encoding="utf-8") as fp:
        fp.write("\n".join(lignes) + "\n")
    print(f"✅ {len(sortie)} fiches ; manquantes : {manquants}")


if __name__ == "__main__":
    main()
