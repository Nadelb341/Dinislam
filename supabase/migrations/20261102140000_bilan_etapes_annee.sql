-- 📅 Étapes de bilan choisies dans un menu (2026-11-02, demande de Nadia)
-- 1) L'année entre dans le libellé du bilan : « Avant les Vacances de Noël » → « Avant les Vacances de Noël 2026 »
--    (sans elle, le bilan de Noël 2027 d'un élève aurait écrasé celui de Noël 2026 : clé unique student_id + period_label).
--    Année = début des vacances qui suivent la période du bilan. Le libellé dans la photo du bilan (snapshot) suit.
UPDATE public.student_reports r
SET period_label = r.period_label || ' ' || to_char(h.start_date, 'YYYY'),
    snapshot = CASE WHEN r.snapshot ? 'periode'
      THEN jsonb_set(r.snapshot, '{periode,label}', to_jsonb(r.period_label || ' ' || to_char(h.start_date, 'YYYY')))
      ELSE r.snapshot END
FROM public.school_holidays h
WHERE r.period_label = 'Avant les ' || h.label
  AND r.period_label !~ '\d{4}$'
  AND h.start_date BETWEEN r.period_start AND r.period_end + 1;

-- 2) Vacances scolaires 2027-2028, zone C (arrêté publié au Journal officiel du 23/07/2026) ;
--    même convention que l'existant : 1er jour sans classe → dernier jour avant la reprise. Modifiables dans « 🏖️ Vacances scolaires ».
INSERT INTO public.school_holidays (label, start_date, end_date)
SELECT v.label, v.s::date, v.e::date
FROM (VALUES
  ('Vacances de la Toussaint', '2027-10-23', '2027-11-07'),
  ('Vacances de Noël',         '2027-12-18', '2028-01-02'),
  ('Vacances d''hiver',        '2028-02-12', '2028-02-27'),
  ('Vacances de printemps',    '2028-04-15', '2028-05-01'),
  ('Vacances d''été',          '2028-07-05', '2028-08-31')
) AS v(label, s, e)
WHERE NOT EXISTS (SELECT 1 FROM public.school_holidays x WHERE x.start_date = v.s::date);
