#!/bin/sh
# Teste la 2ᵉ migration des 99 noms DANS UNE TRANSACTION ANNULÉE (rien n'est écrit en base), lancée 2 fois (idempotence).
cd "$(dirname "$0")/../.." || exit 1
M=supabase/migrations/20261127220000_fiches_99_noms_lots_3_11_enfants.sql
T=$(mktemp)
{
  echo "begin;"
  cat "$M"
  cat "$M"
  echo "select string_agg(display_order||' '||transliteration||' <- '||coalesce(fiche_adulte->>'translit','(ancienne)')||' '||coalesce(fiche_adulte->'sections'->0->>'titre','')||' / enfant '||coalesce(fiche_enfant->>'translit','—'), ' ; ' order by display_order) as l from allah_names where display_order in (10,11,12,13,20,21,66,67,68,91,92,94,99);"
  echo "rollback;"
} > "$T"
supabase db query --linked -f "$T"
rm -f "$T"
