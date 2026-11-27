"""
Génère, à partir des fiches de Nadia (lot_*.py) et de la version enfant (enfants.py) :
  - supabase/data/allah_names_fiches_adultes_v2_2026-11-27.json  (copie de référence : TOUTES les fiches adultes)
  - supabase/data/allah_names_fiches_enfants_2026-11-27.json     (copie de référence : version enfant)
  - supabase/migrations/20261127220000_fiches_99_noms_lots_3_11_enfants.sql (migration additive, idempotente)
La 1ʳᵉ migration (20261127200000, déjà appliquée) et sa copie JSON ne sont PLUS réécrites : historique.
Contrôle : chaque fiche est rattachée au BON nom de l'appli (comparaison des translittérations, jamais le seul numéro).
Lancer : python3 scripts/fiches-99-noms/generer.py   (depuis la racine du projet)
"""
import json, os, re, sys, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
RACINE = os.path.abspath(os.path.join(ICI, "..", ".."))

from lot_01_12 import FICHES as L1
from lot_11_20 import FICHES as L11_20
from lot_21_30 import FICHES as L2
from lot_31_40 import FICHES as L3
from lot_41_50 import FICHES as L4
from lot_51_60 import FICHES as L5
from lot_61_70 import FICHES as L6
from lot_71_80 import FICHES as L7
from lot_81_90 import FICHES as L8
from lot_92_99 import FICHES as L92_99
from enfants import ENFANTS, TEXTES

# 11 et 12 : la version du lot 3 coupé (dans lot_01_12.py) est remplacée par le lot 3 complet (lot_11_20.py).
FICHES = [f for f in L1 if f["o"] not in (11, 12)] + L11_20 + L2 + L3 + L4 + L5 + L6 + L7 + L8 + L92_99
# Numéros écrits par la NOUVELLE migration (les autres sont déjà en base depuis 20261127200000)
NOUVEAUX = set(range(11, 21)) | set(range(92, 100))
REMPLACES = {11, 12}

PRUDENCE = "Les savants ne sont pas tous d'accord pour dire que c'est un nom d'Allah."
MIGRATION = "supabase/migrations/20261127220000_fiches_99_noms_lots_3_11_enfants.sql"


def cle(t):
    """Squelette d'une translittération : sans accents, sans « Al- », sans voyelles doublées ni y/i, pour comparer."""
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"^(al|ar|as|ash|at|ad|adh|az|an)[- ]", "", t)
    t = re.sub(r"[^a-z]", "", t)
    t = t.replace("y", "i").replace("ou", "u").replace("sh", "ch")
    t = re.sub(r"(.)\1+", r"\1", t)
    return t


def sql_txt(x):
    return "'" + x.replace("'", "''") + "'"


def mots(t):
    return len([m for m in re.split(r"[\s,.!?;:«»]+", t) if m])


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
    assert manquants == [67], manquants

    fiches = sorted(FICHES, key=lambda f: f["o"])
    adultes = [{**{k: v for k, v in f.items() if k not in ("o", "s")}, "numero_appli": f["o"], "numero_source": f["s"]} for f in fiches]
    with open(os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v2_2026-11-27.json"), "w", encoding="utf-8") as fp:
        json.dump(adultes, fp, ensure_ascii=False, indent=1)

    # 🧒 Version enfant : une par fiche adulte de Nadia, rien d'autre
    assert set(ENFANTS) == vus, sorted(set(ENFANTS) ^ vus)
    enfants = []
    for f in fiches:
        sens, comme, faire, dire = ENFANTS[f["o"]]
        discute = f["statut"] != "etabli"
        texte = TEXTES.get(f["o"])
        if discute:
            # Nom discuté : « Je dis » ne s'adresse pas à Allah par ce nom
            assert cle(f["translit"]) not in cle(dire), f"{f['o']} : « Je dis » emploie un nom discuté"
        assert mots(dire) <= 10, (f["o"], dire)
        enfants.append({
            "numero_appli": f["o"], "nom_arabe": f["nom_arabe"], "translit": f["translit"], "statut": f["statut"],
            "sens": sens, "comme": comme, "faire": faire, "dire": dire,
            "dire_type": "texte" if texte else "personnelle",
            **({"dire_arabe": texte["arabe"], "dire_traduction": texte["traduction"], "dire_ref": texte["ref"], "dire_degre": texte["degre"]} if texte else {}),
            "prudence": PRUDENCE if discute else None,
            "a_relire": True,
        })
    with open(os.path.join(RACINE, "supabase/data/allah_names_fiches_enfants_2026-11-27.json"), "w", encoding="utf-8") as fp:
        json.dump(enfants, fp, ensure_ascii=False, indent=1)

    lignes = [
        "-- 🌟 99 noms d'Allah (27/11/2026, 2ᵉ série) — fichier GÉNÉRÉ par scripts/fiches-99-noms/generer.py (ne pas modifier à la main).",
        "-- 1. Fiches ADULTES de Nadia : lot 3 complet (appli 11 à 20) + lot 11 (ChatGPT 91 à 98 = appli 92 à 99, décalage d'Al-Ahad).",
        "--    11 et 12 : la version du lot 3 coupé est REMPLACÉE (seulement si elle n'a pas été modifiée depuis : 1ʳᵉ section « Signification »).",
        "--    Toujours sans fiche de Nadia : 67 Al-Ahad (garde l'ancienne fiche).",
        "-- 2. Version ENFANT (fiche_enfant) pour chaque nom qui a une fiche adulte, marquée « à relire » ; écrite seulement si la place est vide.",
        "-- 3. Table allah_names_version_eleve : version des 99 noms choisie par l'enseignante pour un élève (auto / petit / enfant / adulte).",
        "-- Sécurité : chaque ligne n'est écrite que si le numéro ET la translittération de l'appli correspondent.",
        "-- À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`). Relancer = sans effet.",
        "",
        "create table if not exists public.allah_names_version_eleve (",
        "  user_id uuid primary key references auth.users(id) on delete cascade,",
        "  version text not null default 'auto' check (version in ('auto', 'petit', 'enfant', 'adulte')),",
        "  updated_at timestamptz not null default now()",
        ");",
        "comment on table public.allah_names_version_eleve is '99 noms : version enfant / adulte choisie par l''enseignante pour un élève (auto = selon l''âge).';",
        "alter table public.allah_names_version_eleve enable row level security;",
        "drop policy if exists allah_names_version_lecture on public.allah_names_version_eleve;",
        "create policy allah_names_version_lecture on public.allah_names_version_eleve for select to authenticated",
        "  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));",
        "drop policy if exists allah_names_version_admin on public.allah_names_version_eleve;",
        "create policy allah_names_version_admin on public.allah_names_version_eleve for all to authenticated",
        "  using (public.has_role(auth.uid(), 'admin'::app_role)) with check (public.has_role(auth.uid(), 'admin'::app_role));",
        "do $$ begin",
        "  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'allah_names_version_eleve') then",
        "    alter publication supabase_realtime add table public.allah_names_version_eleve;",
        "  end if;",
        "end $$;",
        "",
    ]
    for f in adultes:
        o = f["numero_appli"]
        if o not in NOUVEAUX:
            continue
        j = json.dumps({k: v for k, v in f.items() if k != "numero_appli"}, ensure_ascii=False)
        assert "$fiche$" not in j
        garde = ("(fiche_adulte is null or fiche_adulte->'sections'->0->>'titre' = 'Signification')" if o in REMPLACES
                 else "fiche_adulte is null")
        lignes.append(f"update public.allah_names set fiche_adulte = $fiche${j}$fiche$::jsonb "
                      f"where display_order = {o} and transliteration = {sql_txt(noms[o])} and {garde};")
    lignes.append("")
    for e in enfants:
        o = e["numero_appli"]
        j = json.dumps({k: v for k, v in e.items() if k != "numero_appli"}, ensure_ascii=False)
        assert "$fiche$" not in j
        lignes.append(f"update public.allah_names set fiche_enfant = $fiche${j}$fiche$::jsonb "
                      f"where display_order = {o} and transliteration = {sql_txt(noms[o])} and fiche_enfant is null;")
    lignes.append("select count(*) filter (where fiche_adulte is not null) as fiches_adultes, count(*) filter (where fiche_enfant is not null) as fiches_enfants from public.allah_names;")
    with open(os.path.join(RACINE, MIGRATION), "w", encoding="utf-8") as fp:
        fp.write("\n".join(lignes) + "\n")
    print(f"✅ {len(adultes)} fiches adultes ({len(NOUVEAUX)} nouvelles), {len(enfants)} fiches enfants ; manquantes : {manquants}")


if __name__ == "__main__":
    main()
