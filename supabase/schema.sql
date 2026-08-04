-- Habit Tracker schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Safe to re-run. Also safe to run against a project that already has a
-- `habits` table from a different, unrelated app: it only adds the columns
-- this app needs and never drops or overwrites existing columns/data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- if `habits` pre-existed (e.g. from a different app) and its `id` column has
-- no default, give it one so inserts don't have to supply an id themselves
do $$
declare
  id_default text;
  id_type text;
begin
  select column_default, data_type into id_default, id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'habits' and column_name = 'id';

  if id_default is null then
    if id_type = 'uuid' then
      execute 'alter table public.habits alter column id set default gen_random_uuid()';
    else
      execute 'create sequence if not exists public.habits_id_seq owned by public.habits.id';
      execute 'alter table public.habits alter column id set default nextval(''public.habits_id_seq'')';
      perform setval('public.habits_id_seq', coalesce((select max(id) from public.habits), 0) + 1, false);
    end if;
  end if;
end $$;

alter table public.habits add column if not exists name text;
alter table public.habits add column if not exists description text;
alter table public.habits add column if not exists color text not null default '#3f5b46';
alter table public.habits add column if not exists icon text;
alter table public.habits add column if not exists frequency text not null default 'daily';
alter table public.habits add column if not exists goal_target integer not null default 1;
alter table public.habits add column if not exists archived boolean not null default false;
alter table public.habits add column if not exists reminder_time time;
alter table public.habits add column if not exists created_at timestamptz not null default now();

-- backfill name from a legacy `title` column, if this table pre-existed with one
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habits' and column_name = 'title'
  ) then
    update public.habits set name = title where name is null and title is not null;
  end if;
end $$;

-- relax any other legacy NOT NULL columns (e.g. a leftover `title`) that this
-- app doesn't know about and doesn't populate, so inserts don't need them
do $$
declare
  col record;
begin
  for col in
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'habits'
      and is_nullable = 'NO' and column_default is null
      and column_name not in ('id', 'user_id')
  loop
    execute format('alter table public.habits alter column %I drop not null', col.column_name);
  end loop;
end $$;

update public.habits set name = 'Untitled habit' where name is null or name = '';
alter table public.habits alter column name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habits_frequency_check'
  ) then
    alter table public.habits
      add constraint habits_frequency_check check (frequency in ('daily', 'weekly'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'habits_goal_target_check'
  ) then
    alter table public.habits
      add constraint habits_goal_target_check check (goal_target > 0);
  end if;
end $$;

create index if not exists habits_user_id_idx on public.habits (user_id);

alter table public.habits enable row level security;

drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- habit_logs
-- (habit_id's type is matched to whatever type habits.id actually is, since
-- a pre-existing `habits` table from another app may use bigint instead of uuid)
-- ---------------------------------------------------------------------------
do $$
declare
  habits_id_type text;
begin
  select data_type into habits_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'habits' and column_name = 'id';

  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'habit_logs'
  ) then
    execute format(
      'create table public.habit_logs (
         id uuid primary key default gen_random_uuid(),
         habit_id %s not null references public.habits (id) on delete cascade,
         user_id uuid not null references auth.users (id) on delete cascade,
         date date not null,
         created_at timestamptz not null default now(),
         unique (habit_id, date)
       )',
      habits_id_type
    );
  end if;
end $$;

create index if not exists habit_logs_user_id_idx on public.habit_logs (user_id);
create index if not exists habit_logs_habit_id_idx on public.habit_logs (habit_id);

alter table public.habit_logs enable row level security;

drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs
  for select using (auth.uid() = user_id);

drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own" on public.habit_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own" on public.habit_logs
  for delete using (auth.uid() = user_id);
