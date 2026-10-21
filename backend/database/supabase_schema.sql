-- ==============================================================================
-- EGS Quizit! Inter-school Quiz Arena — Supabase Database Schema & RLS Policies
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. QUIZ SETTINGS & RULES
create table if not exists public.quiz_settings (
  id text primary key default 'arena_settings',
  theme text not null default 'midnight-gold',
  correct_points integer not null default 10,
  wrong_points integer not null default 0,
  pounce_correct_points integer not null default 10,
  pounce_incorrect_points integer not null default -5,
  default_timer_seconds integer not null default 45,
  allow_audience_pass boolean not null default true,
  audio_effects_enabled boolean not null default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TEAMS TABLE
create table if not exists public.teams (
  id text primary key,
  name text not null,
  school text not null,
  short_name text not null,
  color text not null default '#3b82f6',
  logo_url text,
  scores_by_round integer[] default array[0,0,0,0,0,0],
  total_score integer not null default 0,
  has_pounced boolean not null default false,
  pounce_timestamp timestamp with time zone,
  sort_order integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. QUESTION BANK (Scales to 1000+ questions per round)
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  tag text not null unique,
  round integer not null check (round between 1 and 6),
  question text not null,
  answer text not null,
  source text,
  media_type text check (media_type in ('image', 'audio', 'video')),
  media_url text,
  status text not null default 'available' check (status in ('available', 'drawn', 'archived', 'reset')),
  drawn_at timestamp with time zone,
  drawn_by text,
  drawn_for_team text references public.teams(id) on delete set null,
  draw_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_questions_round_status on public.questions (round, status);
create index if not exists idx_questions_tag on public.questions (tag);

-- 5. LIVE QUIZ STATE (Synchronized projector & operator view)
create table if not exists public.live_quiz_state (
  id text primary key default 'current_arena',
  active_round integer not null default 1,
  active_question_id uuid references public.questions(id) on delete set null,
  active_question_tag text,
  assigned_team_id text references public.teams(id) on delete set null,
  is_answer_revealed boolean not null default false,
  is_timer_running boolean not null default false,
  timer_seconds_remaining integer not null default 45,
  pounce_teams text[] default array[]::text[],
  scoring_locked boolean not null default false,
  last_draw_method text check (last_draw_method in ('chit', 'random', 'manual')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. QUESTION DRAWS AUDIT
create table if not exists public.question_draws (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade,
  question_tag text not null,
  round integer not null,
  assigned_team_id text references public.teams(id) on delete set null,
  draw_method text not null check (draw_method in ('chit', 'random', 'manual')),
  drawn_by text not null default 'Operator',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. SCORE EVENTS & CORRECTION AUDIT TRAIL
create table if not exists public.score_events (
  id uuid primary key default uuid_generate_v4(),
  team_id text not null references public.teams(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  question_tag text,
  round integer not null,
  type text not null check (type in ('correct', 'wrong', 'pounce_correct', 'pounce_incorrect', 'manual_adjustment')),
  points_delta integer not null,
  reason text,
  operator_email text not null default 'Operator',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. STORAGE BUCKET FOR LOGOS & MEDIA
insert into storage.buckets (id, name, public) 
values ('quiz_assets', 'quiz_assets', true)
on conflict (id) do nothing;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.quiz_settings enable row level security;
alter table public.teams enable row level security;
alter table public.questions enable row level security;
alter table public.live_quiz_state enable row level security;
alter table public.question_draws enable row level security;
alter table public.score_events enable row level security;

-- PUBLIC READ ACCESS (Allows unauthenticated audience / projector screens to view real-time state)
create policy "Public viewers can read settings" on public.quiz_settings for select using (true);
create policy "Public viewers can read teams" on public.teams for select using (true);
create policy "Public viewers can read live state" on public.live_quiz_state for select using (true);
create policy "Public viewers can read score events" on public.score_events for select using (true);
create policy "Public viewers can read questions" on public.questions for select using (true);

-- AUTHENTICATED ADMIN ACCESS (Allows only logged-in operators to mutate data)
create policy "Admins can update settings" on public.quiz_settings for all using (auth.role() = 'authenticated');
create policy "Admins can manage teams" on public.teams for all using (auth.role() = 'authenticated');
create policy "Admins can manage questions" on public.questions for all using (auth.role() = 'authenticated');
create policy "Admins can update live state" on public.live_quiz_state for all using (auth.role() = 'authenticated');
create policy "Admins can insert question draws" on public.question_draws for all using (auth.role() = 'authenticated');
create policy "Admins can manage score events" on public.score_events for all using (auth.role() = 'authenticated');

-- STORAGE POLICIES
create policy "Public can view assets" on storage.objects for select using (bucket_id = 'quiz_assets');
create policy "Admins can upload assets" on storage.objects for insert with check (bucket_id = 'quiz_assets' and auth.role() = 'authenticated');
create policy "Admins can update assets" on storage.objects for update with check (bucket_id = 'quiz_assets' and auth.role() = 'authenticated');
create policy "Admins can delete assets" on storage.objects for delete with check (bucket_id = 'quiz_assets' and auth.role() = 'authenticated');

-- ENABLE REALTIME REPLICATION FOR LIVE QUIZ STATE & TEAMS
alter publication supabase_realtime add table public.live_quiz_state;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.score_events;
