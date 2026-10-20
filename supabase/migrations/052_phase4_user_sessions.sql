-- Phase 4: active sessions registry
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_label text,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS user_sessions_user_idx
  ON public.user_sessions(user_id, created_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user read own sessions" ON public.user_sessions;
CREATE POLICY "user read own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user update own sessions" ON public.user_sessions;
CREATE POLICY "user update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);
-- inserts via service role from server actions
