create extension if not exists "uuid-ossp";

create table public.classrooms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  code text not null,
  color text not null default '#8fce9e',
  icon text not null default 'graduation-cap',
  professor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  category text not null check (category in ('Aulas', 'Fotos', 'Trabalhos', 'Referências')),
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade,
  title text not null,
  type text not null check (type in ('lesson', 'deadline', 'event', 'exam')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.summaries (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  source_file_id uuid references public.files(id) on delete set null,
  provider text not null,
  mode text not null check (mode in ('quick', 'technical', 'checklist', 'key-points', 'exercises')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.classrooms enable row level security;
alter table public.lessons enable row level security;
alter table public.files enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.summaries enable row level security;

create policy "Users manage own classrooms" on public.classrooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read linked lessons" on public.lessons
  for all using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()));

create policy "Users read linked files" on public.files
  for all using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()));

create policy "Users read linked notes" on public.notes
  for all using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()));

create policy "Users read linked tasks" on public.tasks
  for all using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()));

create policy "Users read linked events" on public.events
  for all using (classroom_id is null or exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()))
  with check (classroom_id is null or exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()));

create policy "Users read linked summaries" on public.summaries
  for all using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.user_id = auth.uid()));
