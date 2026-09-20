-- Lexistencehub - database schema (Supabase / Postgres)
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again: everything is "if not exists" / "or replace".

-- ---------------------------------------------------------------------------
-- 1. user_state: the student's learning data, one row per kind of data.
--    The app keeps its data as named JSON documents (progress, statistics,
--    answer record, settings ...). Each document is stored here under its name,
--    so a new kind of data needs no schema change.
-- ---------------------------------------------------------------------------
create table if not exists public.user_state (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null check (char_length(key) between 1 and 80),
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

drop policy if exists "user_state: owner reads"   on public.user_state;
drop policy if exists "user_state: owner inserts" on public.user_state;
drop policy if exists "user_state: owner updates" on public.user_state;
drop policy if exists "user_state: owner deletes" on public.user_state;

create policy "user_state: owner reads"   on public.user_state for select using (auth.uid() = user_id);
create policy "user_state: owner inserts" on public.user_state for insert with check (auth.uid() = user_id);
create policy "user_state: owner updates" on public.user_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_state: owner deletes" on public.user_state for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. entitlements: the membership plan of a user.
--    Students can READ their own plan but can never write it: only the server
--    (service role) does - after a purchase is confirmed by the App Store /
--    Google Play (phase 3, RevenueCat webhook). This is what makes Premium real.
-- ---------------------------------------------------------------------------
create table if not exists public.entitlements (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  plan       text        not null default 'free' check (plan in ('free', 'premium')),
  expires_at timestamptz,                       -- null = no end date
  source     text        not null default 'manual', -- 'app_store' | 'play_store' | 'manual'
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "entitlements: owner reads" on public.entitlements;
create policy "entitlements: owner reads" on public.entitlements for select using (auth.uid() = user_id);
-- no insert / update / delete policy: only the service role can write.

-- ---------------------------------------------------------------------------
-- 3. ai_usage: how much of the paid AI features a user has used today.
--    Written only by the server; it enforces the daily limits.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  feature text not null,          -- 'chat' | 'speaking' | 'analysis' ...
  count   int  not null default 0,
  primary key (user_id, day, feature)
);

alter table public.ai_usage enable row level security;
drop policy if exists "ai_usage: owner reads" on public.ai_usage;
create policy "ai_usage: owner reads" on public.ai_usage for select using (auth.uid() = user_id);

-- Atomic "count one more use, tell me the new total" for the server.
create or replace function public.bump_ai_usage(p_user uuid, p_feature text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.ai_usage (user_id, day, feature, count)
  values (p_user, (now() at time zone 'utc')::date, p_feature, 1)
  on conflict (user_id, day, feature) do update set count = public.ai_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

revoke all on function public.bump_ai_usage(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. support_messages: Help & Support messages (written by the server).
-- ---------------------------------------------------------------------------
create table if not exists public.support_messages (
  ref        text        primary key,
  user_id    uuid        references auth.users (id) on delete set null,
  topic      text        not null,
  email      text        not null,
  message    text        not null,
  context    jsonb       not null default '{}'::jsonb,
  emailed    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;
-- no policies: only the service role reads and writes.
