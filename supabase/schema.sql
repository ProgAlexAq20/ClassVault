create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  payment_status text not null default 'beta' check (payment_status in ('beta', 'pending', 'active')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classrooms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  code text not null,
  color text not null default '#8fce9e',
  icon text not null default 'graduation-cap',
  professor text,
  description text,
  categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  name text not null check (char_length(name) between 1 and 240),
  storage_path text not null unique,
  mime_type text not null,
  category text not null check (category in ('Aulas', 'Fotos', 'Trabalhos', 'Referências')),
  size_bytes bigint not null default 0 check (size_bytes between 0 and 20971520),
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  type text not null check (type in ('lesson', 'deadline', 'event', 'exam')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  source_file_id uuid references public.files(id) on delete set null,
  provider text not null,
  mode text not null check (mode in ('quick', 'technical', 'checklist', 'key-points', 'exercises')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.classrooms add column if not exists description text;
alter table public.classrooms add column if not exists categories text[] not null default '{}';
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.events add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.lessons add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.files add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.notes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.tasks add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.summaries add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.events item set user_id = classroom.user_id from public.classrooms classroom where item.classroom_id = classroom.id and item.user_id is null;
update public.lessons item set user_id = classroom.user_id from public.classrooms classroom where item.classroom_id = classroom.id and item.user_id is null;
update public.files item set user_id = classroom.user_id from public.classrooms classroom where item.classroom_id = classroom.id and item.user_id is null;
update public.notes item set user_id = classroom.user_id from public.classrooms classroom where item.classroom_id = classroom.id and item.user_id is null;
update public.tasks item set user_id = classroom.user_id from public.classrooms classroom where item.classroom_id = classroom.id and item.user_id is null;
update public.summaries item set user_id = classroom.user_id from public.classrooms classroom where item.classroom_id = classroom.id and item.user_id is null;

delete from public.events where user_id is null;
alter table public.events alter column user_id set not null;
alter table public.lessons alter column user_id set not null;
alter table public.files alter column user_id set not null;
alter table public.notes alter column user_id set not null;
alter table public.tasks alter column user_id set not null;
alter table public.summaries alter column user_id set not null;

create index if not exists classrooms_user_created_idx on public.classrooms (user_id, created_at desc);
create index if not exists lessons_user_classroom_idx on public.lessons (user_id, classroom_id, starts_at);
create index if not exists files_user_classroom_idx on public.files (user_id, classroom_id, created_at desc);
create index if not exists notes_user_classroom_idx on public.notes (user_id, classroom_id, created_at desc);
create index if not exists tasks_user_classroom_idx on public.tasks (user_id, classroom_id, created_at desc);
create index if not exists events_user_starts_idx on public.events (user_id, starts_at);
create index if not exists summaries_user_classroom_idx on public.summaries (user_id, classroom_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_classrooms_updated_at on public.classrooms;
create trigger set_classrooms_updated_at
  before update on public.classrooms
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

create or replace function public.owns_classroom(target_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classrooms
    where id = target_classroom_id
      and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.lessons enable row level security;
alter table public.files enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.summaries enable row level security;

alter table public.profiles force row level security;
alter table public.classrooms force row level security;
alter table public.lessons force row level security;
alter table public.files force row level security;
alter table public.notes force row level security;
alter table public.tasks force row level security;
alter table public.events force row level security;
alter table public.summaries force row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_request_only" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = id and payment_status = 'beta' and is_admin = false);

create policy "profiles_update_own_request_only" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = false
    and payment_status in ('beta', 'pending')
  );

create policy "profiles_update_admin" on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "classrooms_select_own" on public.classrooms;
drop policy if exists "classrooms_insert_own" on public.classrooms;
drop policy if exists "classrooms_update_own" on public.classrooms;
drop policy if exists "classrooms_delete_own" on public.classrooms;
drop policy if exists "Users manage own classrooms" on public.classrooms;

create policy "classrooms_select_own" on public.classrooms
  for select using (auth.uid() = user_id);

create policy "classrooms_insert_own" on public.classrooms
  for insert with check (auth.uid() = user_id);

create policy "classrooms_update_own" on public.classrooms
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "classrooms_delete_own" on public.classrooms
  for delete using (auth.uid() = user_id);

drop policy if exists "lessons_select_own" on public.lessons;
drop policy if exists "lessons_insert_own" on public.lessons;
drop policy if exists "lessons_update_own" on public.lessons;
drop policy if exists "lessons_delete_own" on public.lessons;
drop policy if exists "Users read linked lessons" on public.lessons;

create policy "lessons_select_own" on public.lessons
  for select using (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "lessons_insert_own" on public.lessons
  for insert with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "lessons_update_own" on public.lessons
  for update using (auth.uid() = user_id and public.owns_classroom(classroom_id)) with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "lessons_delete_own" on public.lessons
  for delete using (auth.uid() = user_id and public.owns_classroom(classroom_id));

drop policy if exists "files_select_own" on public.files;
drop policy if exists "files_insert_own" on public.files;
drop policy if exists "files_update_own" on public.files;
drop policy if exists "files_delete_own" on public.files;
drop policy if exists "Users read linked files" on public.files;

create policy "files_select_own" on public.files
  for select using (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "files_insert_own" on public.files
  for insert with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "files_update_own" on public.files
  for update using (auth.uid() = user_id and public.owns_classroom(classroom_id)) with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "files_delete_own" on public.files
  for delete using (auth.uid() = user_id and public.owns_classroom(classroom_id));

drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;
drop policy if exists "Users read linked notes" on public.notes;

create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id and public.owns_classroom(classroom_id)) with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id and public.owns_classroom(classroom_id));

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
drop policy if exists "Users read linked tasks" on public.tasks;

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id and public.owns_classroom(classroom_id)) with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id and public.owns_classroom(classroom_id));

drop policy if exists "events_select_own" on public.events;
drop policy if exists "events_insert_own" on public.events;
drop policy if exists "events_update_own" on public.events;
drop policy if exists "events_delete_own" on public.events;
drop policy if exists "Users read linked events" on public.events;

create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id and (classroom_id is null or public.owns_classroom(classroom_id)));
create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id and (classroom_id is null or public.owns_classroom(classroom_id)));
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);

drop policy if exists "summaries_select_own" on public.summaries;
drop policy if exists "summaries_insert_own" on public.summaries;
drop policy if exists "summaries_update_own" on public.summaries;
drop policy if exists "summaries_delete_own" on public.summaries;
drop policy if exists "Users read linked summaries" on public.summaries;

create policy "summaries_select_own" on public.summaries
  for select using (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "summaries_insert_own" on public.summaries
  for insert with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "summaries_update_own" on public.summaries
  for update using (auth.uid() = user_id and public.owns_classroom(classroom_id)) with check (auth.uid() = user_id and public.owns_classroom(classroom_id));
create policy "summaries_delete_own" on public.summaries
  for delete using (auth.uid() = user_id and public.owns_classroom(classroom_id));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'classvault-files',
  'classvault-files',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_select_own_classvault_files" on storage.objects;
drop policy if exists "storage_insert_own_classvault_files" on storage.objects;
drop policy if exists "storage_update_own_classvault_files" on storage.objects;
drop policy if exists "storage_delete_own_classvault_files" on storage.objects;

create policy "storage_select_own_classvault_files" on storage.objects
  for select
  using (bucket_id = 'classvault-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "storage_insert_own_classvault_files" on storage.objects
  for insert
  with check (bucket_id = 'classvault-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "storage_update_own_classvault_files" on storage.objects
  for update
  using (bucket_id = 'classvault-files' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'classvault-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "storage_delete_own_classvault_files" on storage.objects
  for delete
  using (bucket_id = 'classvault-files' and auth.uid()::text = (storage.foldername(name))[1]);
