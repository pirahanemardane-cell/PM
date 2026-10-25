-- Lightweight job queue (Vercel cron worker)
create table if not exists public.job_queue (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_queue_pending_idx
  on public.job_queue (status, available_at)
  where status = 'pending';

create index if not exists job_queue_type_idx
  on public.job_queue (job_type);

alter table public.job_queue enable row level security;

-- only service role should touch jobs (no public policies)
drop policy if exists "job_queue_no_public" on public.job_queue;
-- intentional: no policies for anon/authenticated → RLS blocks them
