create table if not exists public.chat_threads (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id text primary key,
  thread_id text not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_threads_user_updated_idx on public.chat_threads(user_id, updated_at desc);
create index if not exists chat_messages_thread_created_idx on public.chat_messages(thread_id, created_at);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

create policy "Own threads" on public.chat_threads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own messages" on public.chat_messages for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.chat_threads t where t.id = thread_id and t.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.chat_threads t where t.id = thread_id and t.user_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.chat_threads, public.chat_messages to authenticated;
