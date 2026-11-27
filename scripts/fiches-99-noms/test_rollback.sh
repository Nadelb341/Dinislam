#!/bin/sh
# Teste la migration des fiches adultes DANS UNE TRANSACTION ANNULÉE (rien n'est écrit en base).
cd "$(dirname "$0")/../.." || exit 1
T=$(mktemp)
{
  echo "begin;"
  cat supabase/migrations/20261127200000_fiches_adultes_99_noms.sql
  cat supabase/migrations/20261127200000_fiches_adultes_99_noms.sql
  echo "select display_order||' '||transliteration||' <- '||coalesce(fiche_adulte->>'translit','(ancienne fiche)')||' '||coalesce(fiche_adulte->>'statut','') as l from allah_names where display_order in (1,13,66,67,68,71,81,91,99) order by display_order;"
  echo "rollback;"
} > "$T"
supabase db query --linked -f "$T"
rm -f "$T"
