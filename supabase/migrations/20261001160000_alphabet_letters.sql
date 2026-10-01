-- Page Alphabet vide (accord de Nadia du 2026-10-01) : ajout des 28 lettres préparées à l'époque Lovable
-- (migration 20260219222226, jamais appliquée à la base), dans l'ordre de l'alphabet.
INSERT INTO public.alphabet_letters (letter_arabic, name_french, name_arabic, position_isolated, position_initial, position_medial, position_final, display_order)
SELECT * FROM (VALUES
  ('ا', 'Alif', 'أَلِف', 'ا', 'ا', 'ـا', 'ـا', 1),
  ('ب', 'Ba', 'بَاء', 'ب', 'بـ', 'ـبـ', 'ـب', 2),
  ('ت', 'Ta', 'تَاء', 'ت', 'تـ', 'ـتـ', 'ـت', 3),
  ('ث', 'Tha', 'ثَاء', 'ث', 'ثـ', 'ـثـ', 'ـث', 4),
  ('ج', 'Jim', 'جِيم', 'ج', 'جـ', 'ـجـ', 'ـج', 5),
  ('ح', 'Ha', 'حَاء', 'ح', 'حـ', 'ـحـ', 'ـح', 6),
  ('خ', 'Kha', 'خَاء', 'خ', 'خـ', 'ـخـ', 'ـخ', 7),
  ('د', 'Dal', 'دَال', 'د', 'د', 'ـد', 'ـد', 8),
  ('ذ', 'Dhal', 'ذَال', 'ذ', 'ذ', 'ـذ', 'ـذ', 9),
  ('ر', 'Ra', 'رَاء', 'ر', 'ر', 'ـر', 'ـر', 10),
  ('ز', 'Zay', 'زَاي', 'ز', 'ز', 'ـز', 'ـز', 11),
  ('س', 'Sin', 'سِين', 'س', 'سـ', 'ـسـ', 'ـس', 12),
  ('ش', 'Shin', 'شِين', 'ش', 'شـ', 'ـشـ', 'ـش', 13),
  ('ص', 'Sad', 'صَاد', 'ص', 'صـ', 'ـصـ', 'ـص', 14),
  ('ض', 'Dad', 'ضَاد', 'ض', 'ضـ', 'ـضـ', 'ـض', 15),
  ('ط', 'Ta (emphatique)', 'طَاء', 'ط', 'طـ', 'ـطـ', 'ـط', 16),
  ('ظ', 'Dha (emphatique)', 'ظَاء', 'ظ', 'ظـ', 'ـظـ', 'ـظ', 17),
  ('ع', 'Ayn', 'عَيْن', 'ع', 'عـ', 'ـعـ', 'ـع', 18),
  ('غ', 'Ghayn', 'غَيْن', 'غ', 'غـ', 'ـغـ', 'ـغ', 19),
  ('ف', 'Fa', 'فَاء', 'ف', 'فـ', 'ـفـ', 'ـف', 20),
  ('ق', 'Qaf', 'قَاف', 'ق', 'قـ', 'ـقـ', 'ـق', 21),
  ('ك', 'Kaf', 'كَاف', 'ك', 'كـ', 'ـكـ', 'ـك', 22),
  ('ل', 'Lam', 'لَام', 'ل', 'لـ', 'ـلـ', 'ـل', 23),
  ('م', 'Mim', 'مِيم', 'م', 'مـ', 'ـمـ', 'ـم', 24),
  ('ن', 'Nun', 'نُون', 'ن', 'نـ', 'ـنـ', 'ـن', 25),
  ('ه', 'Ha (souffle)', 'هَاء', 'ه', 'هـ', 'ـهـ', 'ـه', 26),
  ('و', 'Waw', 'وَاو', 'و', 'و', 'ـو', 'ـو', 27),
  ('ي', 'Ya', 'يَاء', 'ي', 'يـ', 'ـيـ', 'ـي', 28)
) AS v(letter_arabic, name_french, name_arabic, position_isolated, position_initial, position_medial, position_final, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.alphabet_letters);
