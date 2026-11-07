-- 🗑️ Audit ZAT du 2026-11-07 — idée 6 : la suppression d'un élève doit marcher et TOUT effacer (droit à l'effacement)

-- (a) Liens qui BLOQUAIENT la suppression (« NO ACTION ») :
--     notifications ciblées sur l'élève → effacées avec lui ; « fait par » (uploaded_by, reviewed_by, sent_by…) → vidé.
do $$
declare r record; v_null boolean; v_action text;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl, a.attname as col, a.attnotnull
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and c.confdeltype in ('a', 'r')
      and c.conrelid::regclass::text not like 'auth.%'
  loop
    if r.col in ('target_user_id') or r.attnotnull then v_action := 'cascade'; else v_action := 'set null'; end if;
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format('alter table %s add constraint %I foreign key (%I) references auth.users(id) on delete %s',
                   r.tbl, r.conname, r.col, v_action);
  end loop;
end $$;

-- (b) Colonnes « élève » SANS lien : leurs lignes restaient après la suppression → lien ajouté (effacées avec l'élève)
do $$
declare x text[]; tbl text; col text; act text;
begin
  foreach x slice 1 in array array[
    ['absence_justifications','student_id','cascade'], ['behavior_marks','student_id','cascade'],
    ['bilan_envois','student_id','cascade'], ['coran_reminder_logs','user_id','cascade'],
    ['devoir_decisions','student_id','cascade'], ['devoir_vues','student_id','cascade'],
    ['devoirs','student_id','cascade'], ['devoirs_rendus','student_id','cascade'],
    ['homework_reminder_logs','student_id','cascade'], ['nourania_commentaires_eleves','student_id','cascade'],
    ['nourania_lesson_content','target_user_id','cascade'], ['sourate_content','target_user_id','cascade'],
    ['parent_codes','child_id','cascade'], ['parent_links','child_id','cascade'], ['parent_links','parent_id','cascade'],
    ['sourate_recitations','student_id','cascade'], ['user_grammaire_progress','user_id','cascade'],
    ['devoir_modeles','created_by','set null'], ['devoirs','created_by','set null'], ['parent_codes','created_by','set null']
  ] loop
    tbl := x[1]; col := x[2]; act := x[3];
    if act = 'set null' and exists (select 1 from information_schema.columns
        where table_schema='public' and table_name=tbl and column_name=col and is_nullable='NO') then
      act := 'cascade';
    end if;
    execute format('alter table public.%I drop constraint if exists %I', tbl, tbl || '_' || col || '_compte_fkey');
    execute format('alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete %s',
                   tbl, tbl || '_' || col || '_compte_fkey', col, act);
  end loop;
end $$;

-- (c) Pendant l'effacement d'un compte, le recalcul des points (déclenché par l'effacement de ses progrès)
--     ne doit pas recréer sa ligne de classement : on ne fait rien si le compte n'existe plus.
do $$
declare d text;
begin
  d := pg_get_functiondef('public.recalculate_student_points(uuid)'::regprocedure);
  if position('compte en cours de suppression' in d) = 0 then
    d := regexp_replace(d, E'\\nBEGIN\\n',
      E'\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF; -- compte en cours de suppression\n', '');
    execute d;
  end if;
end $$;
