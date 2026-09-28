create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  admin_note text
);
alter table public.contact_messages enable row level security;
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages (status);
