-- Выполните в Supabase: SQL Editor → New query → Run.
-- Затем Settings → API: скопируйте Project URL и anon public key в .env (см. env.example).

create table if not exists public.bookings (
  id text primary key,
  created_at timestamptz not null,
  name text not null default '',
  phone text not null default '',
  date_ymd text not null default '',
  time_hm text not null default '',
  master_id text not null default '',
  master_name text not null default ''
);

alter table public.bookings enable row level security;

-- Внимание: любой посетитель сайта с anon-ключом сможет читать/удалять записи.
-- Для продакшена ограничьте через Supabase Auth или отдельный backend.
create policy "bookings_select_anon" on public.bookings
  for select to anon using (true);

create policy "bookings_insert_anon" on public.bookings
  for insert to anon with check (true);

create policy "bookings_delete_anon" on public.bookings
  for delete to anon using (true);

-- Realtime (обновление списка без перезагрузки)
alter publication supabase_realtime add table public.bookings;
