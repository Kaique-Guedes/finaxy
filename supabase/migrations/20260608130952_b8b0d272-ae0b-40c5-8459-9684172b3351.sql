CREATE TABLE public.monthly_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_key TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_notes TO authenticated;
GRANT ALL ON public.monthly_notes TO service_role;

ALTER TABLE public.monthly_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notes" ON public.monthly_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notes" ON public.monthly_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.monthly_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.monthly_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_monthly_notes_updated_at
  BEFORE UPDATE ON public.monthly_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();