-- 🌆 26/11 : les 10 fonds du soir plus clairs (tous gardés par Nadia) sont ACTIFS dans le réglage des fonds d'écran
update reglages_appli
set valeur = jsonb_set(valeur, '{actifs}', (
  select to_jsonb(array(select distinct x from unnest(
    array(select jsonb_array_elements_text(valeur->'actifs')) || array['ns1','ns2','ns3','ns4','ns5','ns6','ns7','ns8','ns9','ns10']) x)))
)
where cle = 'fonds_ecran';
select cle, jsonb_array_length(valeur->'actifs') n from reglages_appli where cle = 'fonds_ecran';
