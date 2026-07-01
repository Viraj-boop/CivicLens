
CREATE TABLE public.ai_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  context_summary JSONB NOT NULL,
  response TEXT,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_request_logs TO anon, authenticated;
GRANT ALL ON public.ai_request_logs TO service_role;

ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read AI logs (transparency)"
  ON public.ai_request_logs FOR SELECT
  USING (true);

CREATE INDEX ai_request_logs_created_at_idx ON public.ai_request_logs (created_at DESC);
