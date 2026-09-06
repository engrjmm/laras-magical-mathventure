create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.child_profiles enable row level security;
revoke all on public.child_profiles from anon;
grant select, insert, update, delete on public.child_profiles to authenticated;

create policy "Parents can read their child profiles"
on public.child_profiles for select to authenticated
using ((select auth.uid()) = parent_id);

create policy "Parents can create their child profiles"
on public.child_profiles for insert to authenticated
with check ((select auth.uid()) = parent_id);

create policy "Parents can update their child profiles"
on public.child_profiles for update to authenticated
using ((select auth.uid()) = parent_id)
with check ((select auth.uid()) = parent_id);

create policy "Parents can delete their child profiles"
on public.child_profiles for delete to authenticated
using ((select auth.uid()) = parent_id);

create index if not exists child_profiles_parent_id_idx
on public.child_profiles(parent_id);
