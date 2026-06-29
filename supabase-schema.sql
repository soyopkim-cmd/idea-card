create table if not exists public.ideas (
  id bigint primary key,
  content text not null default '',
  video_url text not null default '',
  video_id text not null default '',
  created_at timestamptz not null default now()
);

alter table public.ideas enable row level security;

drop policy if exists "Anyone can read ideas" on public.ideas;
create policy "Anyone can read ideas"
  on public.ideas
  for select
  using (true);

drop policy if exists "Anyone can create ideas" on public.ideas;
create policy "Anyone can create ideas"
  on public.ideas
  for insert
  with check (true);

drop policy if exists "Anyone can update ideas" on public.ideas;
create policy "Anyone can update ideas"
  on public.ideas
  for update
  using (true)
  with check (true);

drop policy if exists "Anyone can delete ideas" on public.ideas;
create policy "Anyone can delete ideas"
  on public.ideas
  for delete
  using (true);
