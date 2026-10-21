ALTER TABLE public.dsa_topics ADD COLUMN category text NOT NULL DEFAULT 'intermediate';
ALTER TABLE public.dsa_topics ADD CONSTRAINT dsa_topics_category_check CHECK (category IN ('basic','intermediate','advanced'));

CREATE TABLE public.cs_fundamentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subject text NOT NULL,
  priority integer NOT NULL DEFAULT 2,
  subtopics text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_fundamentals TO authenticated;
GRANT ALL ON public.cs_fundamentals TO service_role;
ALTER TABLE public.cs_fundamentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin write cs_fundamentals" ON public.cs_fundamentals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "read cs_fundamentals" ON public.cs_fundamentals FOR SELECT TO authenticated USING (company_visible(company_id));