
-- Single-user personal app: no auth. Allow anon full access (acknowledged trade-off).

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  short_description TEXT,
  target_audience TEXT,
  main_cta TEXT,
  brand_tone TEXT,
  primary_language TEXT NOT NULL DEFAULT 'en',
  brand_color TEXT NOT NULL DEFAULT '#6366f1',
  master_brief TEXT,
  brief_extracted JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER t_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- project_knowledge_files
CREATE TABLE public.project_knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  original_filename TEXT,
  notes TEXT,
  extracted_text TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_knowledge_files TO anon, authenticated;
GRANT ALL ON public.project_knowledge_files TO service_role;
ALTER TABLE public.project_knowledge_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.project_knowledge_files FOR ALL USING (true) WITH CHECK (true);

-- project_knowledge_notes
CREATE TABLE public.project_knowledge_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  summary TEXT,
  key_features TEXT,
  differentiators TEXT,
  tone_rules TEXT,
  forbidden_topics TEXT,
  approved_keywords TEXT,
  audience_notes TEXT,
  offer_notes TEXT,
  content_pillars TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_knowledge_notes TO anon, authenticated;
GRANT ALL ON public.project_knowledge_notes TO service_role;
ALTER TABLE public.project_knowledge_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.project_knowledge_notes FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER t_pkn_updated BEFORE UPDATE ON public.project_knowledge_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- schedules
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL DEFAULT 0,  -- 0=daily, 1-7 specific day
  posts_per_day SMALLINT NOT NULL DEFAULT 1,
  slot_time TEXT NOT NULL DEFAULT '09:00',
  platform_mode TEXT NOT NULL DEFAULT 'both', -- 'x' | 'linkedin' | 'both'
  topic_mode TEXT NOT NULL DEFAULT 'auto',
  image_required BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO anon, authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER t_schedules_updated BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- generated_content
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  content_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TEXT,
  platform TEXT NOT NULL DEFAULT 'both',
  topic_title TEXT,
  objective TEXT,
  x_post TEXT,
  linkedin_post TEXT,
  cta_text TEXT,
  hashtags TEXT,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | generating | ready | approved | rejected | failed
  generation_source TEXT NOT NULL DEFAULT 'manual',
  favorite BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_content TO anon, authenticated;
GRANT ALL ON public.generated_content TO service_role;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.generated_content FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER t_gc_updated BEFORE UPDATE ON public.generated_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_gc_date ON public.generated_content(content_date DESC);
CREATE INDEX idx_gc_project ON public.generated_content(project_id);
CREATE INDEX idx_gc_status ON public.generated_content(status);

-- review_actions
CREATE TABLE public.review_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_actions TO anon, authenticated;
GRANT ALL ON public.review_actions TO service_role;
ALTER TABLE public.review_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.review_actions FOR ALL USING (true) WITH CHECK (true);

-- app_settings (singleton row)
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  default_language TEXT NOT NULL DEFAULT 'en',
  default_hashtag_count SMALLINT NOT NULL DEFAULT 3,
  x_style_mode TEXT NOT NULL DEFAULT 'concise',
  linkedin_style_mode TEXT NOT NULL DEFAULT 'professional',
  image_aspect_ratio TEXT NOT NULL DEFAULT '1024x1024',
  image_brand_consistency TEXT NOT NULL DEFAULT 'high',
  dark_mode_default BOOLEAN NOT NULL DEFAULT true,
  simple_mode BOOLEAN NOT NULL DEFAULT true,
  tone_strictness TEXT NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER t_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed single settings row
INSERT INTO public.app_settings (id) VALUES (gen_random_uuid());
