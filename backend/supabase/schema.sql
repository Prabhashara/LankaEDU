-- Online Exam Platform - Supabase/Postgres schema
-- Run this in Supabase SQL Editor.
-- It creates normalized tables and can migrate data from the existing
-- app_json_store table used by the current Java backend bridge.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'lecturer', 'admin')),
  student_id text,
  is_active boolean not null default true,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_unique_lower
  on public.users (lower(email));

create unique index if not exists users_student_id_unique_lower
  on public.users (lower(student_id))
  where student_id is not null and btrim(student_id) <> '';

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  description text,
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Inactive', 'Archived')),
  created_by uuid references public.users(id) on delete set null,
  duration_mins numeric(10, 2) not null check (duration_mins > 0),
  pass_mark numeric(10, 2) not null default 0 check (pass_mark >= 0),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exams_created_by_idx on public.exams(created_by);
create index if not exists exams_status_idx on public.exams(status);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  source_question_id text,
  type text not null default 'multiple_choice',
  marks numeric(10, 2) not null default 1 check (marks >= 0),
  order_no integer not null default 1 check (order_no > 0),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exam_id, order_no)
);

create index if not exists questions_exam_id_idx on public.questions(exam_id);
create index if not exists questions_created_by_idx on public.questions(created_by);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_no integer not null default 1 check (order_no > 0),
  unique (question_id, order_no)
);

create index if not exists question_options_question_id_idx on public.question_options(question_id);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  result_id uuid,
  unique (student_id, exam_id)
);

create index if not exists attempts_exam_id_idx on public.attempts(exam_id);
create index if not exists attempts_student_id_idx on public.attempts(student_id);

create table if not exists public.attempt_answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  primary key (attempt_id, question_id)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  total_score numeric(10, 2) not null default 0,
  max_score numeric(10, 2) not null default 0,
  percentage numeric(6, 2) not null default 0,
  grade text,
  is_passed boolean not null default false,
  published_at timestamptz not null default now()
);

create index if not exists results_student_id_idx on public.results(student_id);
create index if not exists results_exam_id_idx on public.results(exam_id);

create table if not exists public.result_answers (
  result_id uuid not null references public.results(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  is_correct boolean not null default false,
  marks_awarded numeric(10, 2) not null default 0,
  primary key (result_id, question_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exams_set_updated_at on public.exams;
create trigger exams_set_updated_at
before update on public.exams
for each row
execute function public.set_updated_at();

-- Migration from app_json_store, if you already ran the Java app with DATABASE_URL.
-- The current bridge stores one JSON array per key: users.json, exams.json,
-- questions.json, attempts.json, and results.json.

create table if not exists public.app_json_store (
  store_key text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.users (id, name, email, role, student_id, is_active, password_hash, created_at)
select
  (item->>'id')::uuid,
  item->>'name',
  item->>'email',
  item->>'role',
  nullif(item->>'student_id', ''),
  coalesce((item->>'is_active')::boolean, true),
  item->>'password_hash',
  coalesce(nullif(item->>'created_at', '')::timestamptz, now())
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as item
where store.store_key = 'users.json'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  student_id = excluded.student_id,
  is_active = excluded.is_active,
  password_hash = excluded.password_hash;

insert into public.exams (
  id,
  title,
  subject,
  description,
  status,
  created_by,
  duration_mins,
  pass_mark,
  start_at,
  end_at,
  created_at,
  updated_at
)
select
  (item->>'id')::uuid,
  item->>'title',
  item->>'subject',
  item->>'description',
  coalesce(nullif(item->>'status', ''), 'Draft'),
  nullif(item->>'created_by', '')::uuid,
  coalesce((item->>'duration_mins')::numeric, 1),
  coalesce((item->>'pass_mark')::numeric, 0),
  nullif(item->>'start_at', '')::timestamptz,
  nullif(item->>'end_at', '')::timestamptz,
  coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
  coalesce(nullif(item->>'updated_at', '')::timestamptz, now())
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as item
where store.store_key = 'exams.json'
on conflict (id) do update set
  title = excluded.title,
  subject = excluded.subject,
  description = excluded.description,
  status = excluded.status,
  created_by = excluded.created_by,
  duration_mins = excluded.duration_mins,
  pass_mark = excluded.pass_mark,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  updated_at = excluded.updated_at;

insert into public.questions (
  id,
  exam_id,
  question_text,
  source_question_id,
  type,
  marks,
  order_no,
  created_by,
  created_at
)
select
  (item->>'id')::uuid,
  (item->>'exam_id')::uuid,
  item->>'question_text',
  item->>'source_question_id',
  coalesce(nullif(item->>'type', ''), 'multiple_choice'),
  coalesce((item->>'marks')::numeric, 1),
  coalesce((item->>'order_no')::integer, 1),
  nullif(item->>'created_by', '')::uuid,
  coalesce(nullif(item->>'created_at', '')::timestamptz, now())
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as item
where store.store_key = 'questions.json'
on conflict (id) do update set
  exam_id = excluded.exam_id,
  question_text = excluded.question_text,
  source_question_id = excluded.source_question_id,
  type = excluded.type,
  marks = excluded.marks,
  order_no = excluded.order_no,
  created_by = excluded.created_by;

insert into public.question_options (id, question_id, option_text, is_correct, order_no)
select
  (option_item->>'id')::uuid,
  (question_item->>'id')::uuid,
  option_item->>'option_text',
  coalesce((option_item->>'is_correct')::boolean, false),
  option_position::integer
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as question_item
cross join lateral jsonb_array_elements(question_item->'options') with ordinality as option_values(option_item, option_position)
where store.store_key = 'questions.json'
on conflict (id) do update set
  question_id = excluded.question_id,
  option_text = excluded.option_text,
  is_correct = excluded.is_correct,
  order_no = excluded.order_no;

insert into public.attempts (id, exam_id, student_id, status, created_at, submitted_at, result_id)
select
  (item->>'id')::uuid,
  (item->>'exam_id')::uuid,
  (item->>'student_id')::uuid,
  coalesce(nullif(item->>'status', ''), 'in_progress'),
  coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
  nullif(item->>'submitted_at', '')::timestamptz,
  nullif(item->>'result_id', '')::uuid
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as item
where store.store_key = 'attempts.json'
on conflict (id) do update set
  exam_id = excluded.exam_id,
  student_id = excluded.student_id,
  status = excluded.status,
  submitted_at = excluded.submitted_at,
  result_id = excluded.result_id;

insert into public.attempt_answers (attempt_id, question_id, selected_option_id)
select
  (attempt_item->>'id')::uuid,
  answer.key::uuid,
  nullif(answer.value #>> '{}', '')::uuid
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as attempt_item
cross join lateral jsonb_each(attempt_item->'answers') as answer
where store.store_key = 'attempts.json'
on conflict (attempt_id, question_id) do update set
  selected_option_id = excluded.selected_option_id;

insert into public.results (
  id,
  attempt_id,
  student_id,
  exam_id,
  total_score,
  max_score,
  percentage,
  grade,
  is_passed,
  published_at
)
select
  (item->>'id')::uuid,
  (item->>'attempt_id')::uuid,
  (item->>'student_id')::uuid,
  (item->>'exam_id')::uuid,
  coalesce((item->>'total_score')::numeric, 0),
  coalesce((item->>'max_score')::numeric, 0),
  coalesce((item->>'percentage')::numeric, 0),
  item->>'grade',
  coalesce((item->>'is_passed')::boolean, false),
  coalesce(nullif(item->>'published_at', '')::timestamptz, now())
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as item
where store.store_key = 'results.json'
on conflict (id) do update set
  attempt_id = excluded.attempt_id,
  student_id = excluded.student_id,
  exam_id = excluded.exam_id,
  total_score = excluded.total_score,
  max_score = excluded.max_score,
  percentage = excluded.percentage,
  grade = excluded.grade,
  is_passed = excluded.is_passed,
  published_at = excluded.published_at;

insert into public.result_answers (
  result_id,
  question_id,
  selected_option_id,
  is_correct,
  marks_awarded
)
select
  (result_item->>'id')::uuid,
  (answer_item->>'question_id')::uuid,
  nullif(answer_item->>'selected_option_id', '')::uuid,
  coalesce((answer_item->>'is_correct')::boolean, false),
  coalesce((answer_item->>'marks_awarded')::numeric, 0)
from public.app_json_store store
cross join lateral jsonb_array_elements(store.data) as result_item
cross join lateral jsonb_array_elements(result_item->'answers') as answer_item
where store.store_key = 'results.json'
on conflict (result_id, question_id) do update set
  selected_option_id = excluded.selected_option_id,
  is_correct = excluded.is_correct,
  marks_awarded = excluded.marks_awarded;

alter table public.attempts
  drop constraint if exists attempts_result_id_fkey;

alter table public.attempts
  add constraint attempts_result_id_fkey
  foreign key (result_id) references public.results(id) on delete set null;
