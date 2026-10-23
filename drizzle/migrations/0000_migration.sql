create type public.app_role as enum ('admin','student');
create type public.difficulty as enum ('easy','medium','hard');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  branch text,
  graduation_year int,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- admin role management via security definer functions
create or replace function public.set_admin(_user_id uuid, _make_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'not authorized'; end if;
  if _user_id = auth.uid() and not _make_admin then raise exception 'cannot remove your own admin role'; end if;
  if _make_admin then insert into public.user_roles(user_id, role) values (_user_id,'admin') on conflict do nothing;
  else delete from public.user_roles where user_id=_user_id and role='admin'; end if;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''))
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email;
  -- Every user created via public sign-up is strictly assigned the student role.
  -- Administrative privileges must NEVER be assigned automatically on public signup.
  insert into public.user_roles(user_id, role) values (new.id, 'student')
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text not null default '',
  headquarters text not null default '',
  overview text not null default '',
  website text,
  first_visit_year int,
  dsa_difficulty difficulty not null default 'medium',
  is_demo boolean not null default true,
  is_published boolean not null default false,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.job_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  hiring_year int not null,
  ctc_note text,
  location text,
  created_at timestamptz not null default now()
);
create table public.eligibility_criteria (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  year int not null,
  min_cgpa numeric(4,2),
  max_backlogs int,
  branches text not null default '',
  notes text,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.dsa_topics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  topic text not null,
  difficulty difficulty not null default 'medium',
  priority int not null default 2,
  notes text
);
create table public.interview_rounds (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  round_order int not null,
  name text not null,
  purpose text not null default '',
  preparation text not null default '',
  duration text
);
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  url text,
  source_type text not null default 'student_report',
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  round_id uuid references public.interview_rounds(id) on delete set null,
  source_id uuid references public.sources(id) on delete set null,
  question text not null,
  topic text,
  difficulty difficulty not null default 'medium',
  asked_on date,
  experience text,
  created_at timestamptz not null default now()
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  company_id uuid references public.companies(id) on delete set null,
  is_demo boolean not null default true,
  published_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['companies','job_roles','eligibility_criteria','dsa_topics','interview_rounds','sources','questions','announcements'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin write %1$s" on public.%1$I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

create policy "read published companies" on public.companies for select to authenticated using (is_published);
create or replace function public.company_visible(_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.companies where id=_id and is_published) $$;
create policy "read" on public.job_roles for select to authenticated using (public.company_visible(company_id));
create policy "read" on public.eligibility_criteria for select to authenticated using (public.company_visible(company_id));
create policy "read" on public.dsa_topics for select to authenticated using (public.company_visible(company_id));
create policy "read" on public.interview_rounds for select to authenticated using (public.company_visible(company_id));
create policy "read" on public.questions for select to authenticated using (public.company_visible(company_id));
create policy "read" on public.sources for select to authenticated using (status='verified' or company_id is null or public.company_visible(company_id));
create policy "read" on public.announcements for select to authenticated using (true);

-- DEMO SEED (fictional companies, clearly labelled)
insert into public.companies (id,name,sector,headquarters,overview,first_visit_year,dsa_difficulty,is_demo,is_published) values
('11111111-0000-0000-0000-000000000001','Northwind Systems (Demo)','Software Services','Pune (fictional)','Fictional demo company used to illustrate how a service-based recruiter profile is presented. Not a real organisation.',2019,'easy',true,true),
('11111111-0000-0000-0000-000000000002','Halden Analytics (Demo)','Data & Analytics','Bengaluru (fictional)','Fictional demo company illustrating a product/analytics recruiter with a coding-heavy process. Not a real organisation.',2021,'hard',true,true),
('11111111-0000-0000-0000-000000000003','Orrin Embedded (Demo)','Electronics / Embedded','Hyderabad (fictional)','Fictional demo company illustrating a core-engineering recruiter open to ECE/EEE branches. Not a real organisation.',2020,'medium',true,true);

insert into public.job_roles (company_id,title,hiring_year,ctc_note,location) values
('11111111-0000-0000-0000-000000000001','Graduate Engineer Trainee',2026,'Demo value — not a real offer','Pune'),
('11111111-0000-0000-0000-000000000002','Software Engineer I',2026,'Demo value — not a real offer','Bengaluru'),
('11111111-0000-0000-0000-000000000002','Data Analyst',2025,'Demo value — not a real offer','Bengaluru'),
('11111111-0000-0000-0000-000000000003','Firmware Engineer',2026,'Demo value — not a real offer','Hyderabad');

insert into public.eligibility_criteria (company_id,year,min_cgpa,max_backlogs,branches,notes,is_current) values
('11111111-0000-0000-0000-000000000001',2024,6.00,1,'CSE, IT, ECE','Demo criteria',false),
('11111111-0000-0000-0000-000000000001',2026,6.50,0,'CSE, IT, ECE, EEE','Demo criteria — backlog rule tightened',true),
('11111111-0000-0000-0000-000000000002',2025,7.50,0,'CSE, IT','Demo criteria',false),
('11111111-0000-0000-0000-000000000002',2026,7.00,0,'CSE, IT, ECE','Demo criteria — CGPA relaxed, ECE added',true),
('11111111-0000-0000-0000-000000000003',2026,6.50,1,'ECE, EEE, EIE','Demo criteria',true);

insert into public.dsa_topics (company_id,topic,difficulty,priority) values
('11111111-0000-0000-0000-000000000001','Arrays & Strings','easy',1),
('11111111-0000-0000-0000-000000000001','Basic Recursion','easy',2),
('11111111-0000-0000-0000-000000000001','SQL Queries','easy',2),
('11111111-0000-0000-0000-000000000002','Dynamic Programming','hard',1),
('11111111-0000-0000-0000-000000000002','Graphs (BFS/DFS, shortest path)','hard',1),
('11111111-0000-0000-0000-000000000002','Sliding Window & Two Pointers','medium',2),
('11111111-0000-0000-0000-000000000002','Heaps & Priority Queues','medium',3),
('11111111-0000-0000-0000-000000000003','Bit Manipulation','medium',1),
('11111111-0000-0000-0000-000000000003','Linked Lists','easy',2),
('11111111-0000-0000-0000-000000000003','C Pointers & Memory','medium',1);

insert into public.interview_rounds (id,company_id,round_order,name,purpose,preparation,duration) values
('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',1,'Online Aptitude Test','Screens quantitative, logical and verbal ability.','Practise timed aptitude sets; revise percentages, ratios, seating arrangements.','60 min'),
('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001',2,'Technical Interview','Checks programming fundamentals and project understanding.','Be able to explain every line of your projects; revise OOP and DBMS basics.','30 min'),
('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001',3,'HR Interview','Assesses communication and willingness to relocate.','Prepare a clear introduction and answers on relocation and shifts.','15 min'),
('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000002',1,'Online Coding Assessment','Two to three algorithmic problems, auto-graded.','Solve medium/hard problems under time limits; focus on DP and graphs.','90 min'),
('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000002',2,'DSA Interview','Live problem solving with complexity analysis.','Think aloud, state brute force first, then optimise.','60 min'),
('22222222-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000002',3,'System Design Basics','Evaluates ability to structure a small service.','Learn caching, load balancing, database indexing at an introductory level.','45 min'),
('22222222-0000-0000-0000-000000000007','11111111-0000-0000-0000-000000000002',4,'Hiring Manager','Culture and motivation fit.','Prepare STAR-format stories about teamwork and conflict.','30 min'),
('22222222-0000-0000-0000-000000000008','11111111-0000-0000-0000-000000000003',1,'Written Technical Test','Digital electronics, C and microcontroller MCQs.','Revise flip-flops, timers, interrupts and C output questions.','60 min'),
('22222222-0000-0000-0000-000000000009','11111111-0000-0000-0000-000000000003',2,'Technical Interview','Embedded C and hardware debugging discussion.','Be ready to write bit-manipulation code by hand.','45 min');

insert into public.sources (id,company_id,title,source_type,status) values
('33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','Demo student experience report','student_report','pending'),
('33333333-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000002','Demo placement cell debrief','tpo_debrief','pending');

insert into public.questions (company_id,round_id,source_id,question,topic,difficulty,asked_on,experience) values
('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001','Reverse a string without using built-in functions.','Strings','easy','2025-09-12','Demo entry: interviewer asked for two approaches.'),
('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001','Difference between primary key and unique key.','DBMS','easy','2025-09-12',null),
('11111111-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002','Find the longest increasing subsequence and explain its time complexity.','Dynamic Programming','hard','2025-10-03','Demo entry: follow-up asked for O(n log n) version.'),
('11111111-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002','Detect a cycle in a directed graph.','Graphs','medium','2025-10-03',null),
('11111111-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000009',null,'Write a macro to set, clear and toggle a given bit.','Bit Manipulation','medium','2025-08-20',null);

insert into public.announcements (title,body,company_id,is_demo) values
('Demo: Pre-placement talk scheduled','This is a demo announcement showing how the placement cell would publish a pre-placement talk notice.','11111111-0000-0000-0000-000000000002',true),
('Demo: Resume review window open','Demo announcement. Students can submit resumes for review by the placement cell.',null,true);