create table if not exists public.ledger_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  schema_version smallint not null default 3 check (schema_version > 0),
  updated_at timestamptz not null default now(),
  constraint ledger_state_data_is_object check (jsonb_typeof(data) = 'object')
);

alter table public.ledger_state enable row level security;
alter table public.ledger_state alter column schema_version set default 3;

revoke all on table public.ledger_state from public;
revoke all on table public.ledger_state from anon;
grant select, insert, update, delete on table public.ledger_state to authenticated;

drop policy if exists "ledger owners can read" on public.ledger_state;
create policy "ledger owners can read"
on public.ledger_state
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ledger owners can insert" on public.ledger_state;
create policy "ledger owners can insert"
on public.ledger_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "ledger owners can update" on public.ledger_state;
create policy "ledger owners can update"
on public.ledger_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ledger owners can delete" on public.ledger_state;
create policy "ledger owners can delete"
on public.ledger_state
for delete
to authenticated
using ((select auth.uid()) = user_id);
