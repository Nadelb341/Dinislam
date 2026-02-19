-- Add correct_options column (array of integers) to support multiple correct answers
ALTER TABLE public.ramadan_quizzes ADD COLUMN correct_options integer[] DEFAULT '{}';

-- Migrate existing data: copy correct_option into correct_options array
UPDATE public.ramadan_quizzes 
SET correct_options = ARRAY[correct_option] 
WHERE correct_option IS NOT NULL;