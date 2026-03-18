CREATE TABLE IF NOT EXISTS nourania_commentaires_eleves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lecon_id uuid REFERENCES nourania_lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  commentaire text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lecon_id, student_id)
);

ALTER TABLE nourania_commentaires_eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_commentaires" ON nourania_commentaires_eleves
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "student_read_own_commentaire" ON nourania_commentaires_eleves
FOR SELECT TO authenticated
USING (student_id = auth.uid());