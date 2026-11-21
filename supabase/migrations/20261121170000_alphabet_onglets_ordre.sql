-- ✋ Ordre des 3 onglets de l'Alphabet, choisi par Nadia (glisser-déposer) ; les élèves voient le même ordre.
alter table public.alphabet_onglets add column if not exists position integer not null default 0;
update public.alphabet_onglets set position = case cle when 'arabe' then 10 when 'particularites' then 20 else 30 end where position = 0;
