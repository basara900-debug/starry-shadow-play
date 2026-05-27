
-- scenes table
CREATE TABLE public.scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  image_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenes TO anon, authenticated;
GRANT ALL ON public.scenes TO service_role;

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scenes" ON public.scenes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert scenes" ON public.scenes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete scenes" ON public.scenes FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update scenes" ON public.scenes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scenes', 'scenes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read scenes bucket" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'scenes');
CREATE POLICY "Anyone upload scenes bucket" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'scenes');
CREATE POLICY "Anyone delete scenes bucket" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'scenes');
