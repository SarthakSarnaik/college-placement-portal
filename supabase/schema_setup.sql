-- ============================================================================
-- PLACEMENTPREP / GRAD-TO-GREAT-JOBS: COMPLETE SUPABASE DATABASE SETUP
-- Project ID: wrfyspbqsfkfhfpeplfd
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. CUSTOM TYPES & ENUMS
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  branch text,
  graduation_year int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Helper security definer function for role evaluation
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- 3. CORE PLACEMENT TABLES
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text NOT NULL DEFAULT '',
  headquarters text NOT NULL DEFAULT '',
  overview text NOT NULL DEFAULT '',
  website text,
  first_visit_year int,
  dsa_difficulty public.difficulty NOT NULL DEFAULT 'medium',
  is_demo boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  hiring_year int NOT NULL,
  ctc_note text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eligibility_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year int NOT NULL,
  min_cgpa numeric(4,2),
  max_backlogs int,
  branches text NOT NULL DEFAULT '',
  notes text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dsa_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  topic text NOT NULL,
  category text NOT NULL DEFAULT 'intermediate' CHECK (category IN ('basic','intermediate','advanced')),
  difficulty public.difficulty NOT NULL DEFAULT 'medium',
  priority int NOT NULL DEFAULT 2,
  notes text
);

CREATE TABLE IF NOT EXISTS public.cs_fundamentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subject text NOT NULL,
  priority int NOT NULL DEFAULT 2,
  subtopics text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interview_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_order int NOT NULL,
  name text NOT NULL,
  purpose text NOT NULL DEFAULT '',
  preparation text NOT NULL DEFAULT '',
  duration text
);

CREATE TABLE IF NOT EXISTS public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  source_type text NOT NULL DEFAULT 'student_report',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.interview_rounds(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  question text NOT NULL,
  topic text,
  difficulty public.difficulty NOT NULL DEFAULT 'medium',
  asked_on date,
  experience text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now()
);

-- 4. HARDENED USER CREATION TRIGGER (STRICT STUDENT ASSIGNMENT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- Every user created via public sign-up is strictly assigned the student role.
  -- Administrative privileges must NEVER be assigned automatically on public signup.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. SECURE ADMIN PROVISIONING & USER MANAGEMENT PROCEDURES
CREATE OR REPLACE FUNCTION public.set_admin(_user_id uuid, _make_admin boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _user_id = auth.uid() AND NOT _make_admin THEN
    RAISE EXCEPTION 'cannot remove your own admin role';
  END IF;
  IF _make_admin THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (_user_id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'::public.app_role;
  END IF;
END $$;

-- Guarded first-admin bootstrap stored procedure
CREATE OR REPLACE FUNCTION public.bootstrap_admin_by_email(_target_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _target_id uuid;
BEGIN
  -- Security check: only callable via service_role (Supabase SQL Editor) or existing admin
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access Denied: Only a database administrator via Supabase SQL Editor or an existing administrator can bootstrap staff privileges.';
  END IF;

  SELECT id INTO _target_id
  FROM auth.users
  WHERE lower(email) = lower(trim(_target_email));

  IF _target_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" was not found in auth.users. Please register the account first at /auth or in Supabase Auth.', _target_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_id, 'admin'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END $$;

GRANT EXECUTE ON FUNCTION public.bootstrap_admin_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_by_email(text) TO service_role;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Loop to apply standard authenticated admin write and basic permissions across operational tables
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'job_roles', 'eligibility_criteria', 'dsa_topics',
    'cs_fundamentals', 'interview_rounds', 'sources', 'questions', 'announcements'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin write %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "admin write %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))', t);
  END LOOP;
END $$;

-- Student visibility rules: only published companies and their related child records
DROP POLICY IF EXISTS "read published companies" ON public.companies;
CREATE POLICY "read published companies" ON public.companies
  FOR SELECT TO authenticated
  USING (is_published);

CREATE OR REPLACE FUNCTION public.company_visible(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = _id AND is_published);
$$;

DROP POLICY IF EXISTS "read" ON public.job_roles;
CREATE POLICY "read" ON public.job_roles FOR SELECT TO authenticated USING (public.company_visible(company_id));

DROP POLICY IF EXISTS "read" ON public.eligibility_criteria;
CREATE POLICY "read" ON public.eligibility_criteria FOR SELECT TO authenticated USING (public.company_visible(company_id));

DROP POLICY IF EXISTS "read" ON public.dsa_topics;
CREATE POLICY "read" ON public.dsa_topics FOR SELECT TO authenticated USING (public.company_visible(company_id));

DROP POLICY IF EXISTS "read cs_fundamentals" ON public.cs_fundamentals;
CREATE POLICY "read cs_fundamentals" ON public.cs_fundamentals FOR SELECT TO authenticated USING (public.company_visible(company_id));

DROP POLICY IF EXISTS "read" ON public.interview_rounds;
CREATE POLICY "read" ON public.interview_rounds FOR SELECT TO authenticated USING (public.company_visible(company_id));

DROP POLICY IF EXISTS "read" ON public.questions;
CREATE POLICY "read" ON public.questions FOR SELECT TO authenticated USING (public.company_visible(company_id));

DROP POLICY IF EXISTS "read" ON public.sources;
CREATE POLICY "read" ON public.sources FOR SELECT TO authenticated USING (status = 'verified' OR company_id IS NULL OR public.company_visible(company_id));

DROP POLICY IF EXISTS "read" ON public.announcements;
CREATE POLICY "read" ON public.announcements FOR SELECT TO authenticated USING (true);

-- 7. INITIAL DEMO SEED DATA (CLEARLY LABELED FICTIONAL RECRUITERS)
INSERT INTO public.companies (id, name, sector, headquarters, overview, first_visit_year, dsa_difficulty, is_demo, is_published, verification_status)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Northwind Systems (Demo)', 'Software Services', 'Pune (Demo Campus)', 'Fictional demo company used to illustrate how a service-based recruiter profile is presented. Not a real organisation.', 2019, 'easy', true, true, 'verified'),
  ('11111111-0000-0000-0000-000000000002', 'Halden Analytics (Demo)', 'Data & Analytics', 'Bengaluru (Demo Campus)', 'Fictional demo company illustrating a product/analytics recruiter with a coding-heavy process. Not a real organisation.', 2021, 'hard', true, true, 'verified'),
  ('11111111-0000-0000-0000-000000000003', 'Orrin Embedded (Demo)', 'Electronics / Embedded', 'Hyderabad (Demo Campus)', 'Fictional demo company illustrating a core-engineering recruiter open to ECE/EEE branches. Not a real organisation.', 2020, 'medium', true, true, 'verified')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.job_roles (company_id, title, hiring_year, ctc_note, location)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Graduate Engineer Trainee', 2026, 'Demo value — not a real offer', 'Pune'),
  ('11111111-0000-0000-0000-000000000002', 'Software Engineer I', 2026, 'Demo value — not a real offer', 'Bengaluru'),
  ('11111111-0000-0000-0000-000000000002', 'Data Analyst', 2025, 'Demo value — not a real offer', 'Bengaluru'),
  ('11111111-0000-0000-0000-000000000003', 'Firmware Engineer', 2026, 'Demo value — not a real offer', 'Hyderabad')
ON CONFLICT DO NOTHING;

INSERT INTO public.eligibility_criteria (company_id, year, min_cgpa, max_backlogs, branches, notes, is_current)
VALUES
  ('11111111-0000-0000-0000-000000000001', 2024, 6.00, 1, 'CSE, IT, ECE', 'Historical criteria', false),
  ('11111111-0000-0000-0000-000000000001', 2026, 6.50, 0, 'CSE, IT, ECE, EEE', 'Current criteria — backlog rule tightened', true),
  ('11111111-0000-0000-0000-000000000002', 2025, 7.50, 0, 'CSE, IT', 'Historical criteria', false),
  ('11111111-0000-0000-0000-000000000002', 2026, 7.00, 0, 'CSE, IT, ECE', 'Current criteria — CGPA relaxed, ECE added', true),
  ('11111111-0000-0000-0000-000000000003', 2026, 6.50, 1, 'ECE, EEE, EIE', 'Current core-engineering criteria', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.dsa_topics (company_id, topic, category, difficulty, priority, notes)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Arrays & Strings', 'basic', 'easy', 1, 'Preliminary screening tests'),
  ('11111111-0000-0000-0000-000000000001', 'Basic Recursion', 'basic', 'easy', 2, 'Recursion trees and stacks'),
  ('11111111-0000-0000-0000-000000000001', 'SQL Queries & Joins', 'intermediate', 'easy', 2, 'Basic queries in round 2'),
  ('11111111-0000-0000-0000-000000000002', 'Dynamic Programming', 'advanced', 'hard', 1, 'Knapsack, partition, memoization'),
  ('11111111-0000-0000-0000-000000000002', 'Graphs (BFS/DFS, shortest path)', 'advanced', 'hard', 1, 'Topological sort, cycle detection'),
  ('11111111-0000-0000-0000-000000000002', 'Sliding Window & Two Pointers', 'intermediate', 'medium', 2, 'Core coding round problems'),
  ('11111111-0000-0000-0000-000000000002', 'Heaps & Priority Queues', 'intermediate', 'medium', 3, 'Top-K elements'),
  ('11111111-0000-0000-0000-000000000003', 'Bit Manipulation', 'intermediate', 'medium', 1, 'Register manipulation in embedded C'),
  ('11111111-0000-0000-0000-000000000003', 'Linked Lists', 'basic', 'easy', 2, 'Pointer traversal'),
  ('11111111-0000-0000-0000-000000000003', 'C Pointers & Memory Management', 'advanced', 'medium', 1, 'Stack vs heap, malloc/free')
ON CONFLICT DO NOTHING;

INSERT INTO public.cs_fundamentals (company_id, subject, priority, subtopics, notes)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Database Management Systems', 1, 'ACID Properties, Normalization, Primary vs Unique Key', 'Tested during technical round'),
  ('11111111-0000-0000-0000-000000000001', 'Object-Oriented Programming', 1, 'Inheritance, Polymorphism, Encapsulation, Abstraction', 'Explain real-world examples'),
  ('11111111-0000-0000-0000-000000000002', 'Operating Systems', 1, 'Virtual Memory, Paging, Deadlocks, Mutex vs Semaphore', 'High weightage for analytics recruiter'),
  ('11111111-0000-0000-0000-000000000002', 'Computer Networks', 2, 'TCP 3-Way Handshake, DNS, HTTP/HTTPS, OSI Layers', 'Screening questions'),
  ('11111111-0000-0000-0000-000000000003', 'Embedded Systems & Microcontrollers', 1, 'Timers, Interrupts, I2C, SPI, UART, Registers', 'Core hardware test subject')
ON CONFLICT DO NOTHING;

INSERT INTO public.interview_rounds (id, company_id, round_order, name, purpose, preparation, duration)
VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 1, 'Online Aptitude Test', 'Screens quantitative, logical and verbal ability.', 'Practise timed aptitude sets; revise percentages, ratios, seating arrangements.', '60 min'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 2, 'Technical Interview', 'Checks programming fundamentals and project understanding.', 'Be able to explain every line of your projects; revise OOP and DBMS basics.', '30 min'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 3, 'HR Interview', 'Assesses communication and willingness to relocate.', 'Prepare a clear introduction and answers on relocation and shifts.', '15 min'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 1, 'Online Coding Assessment', 'Two to three algorithmic problems, auto-graded.', 'Solve medium/hard problems under time limits; focus on DP and graphs.', '90 min'),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 2, 'DSA Interview', 'Live problem solving with complexity analysis.', 'Think aloud, state brute force first, then optimise.', '60 min'),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002', 3, 'System Design Basics', 'Evaluates ability to structure a small service.', 'Learn caching, load balancing, database indexing at an introductory level.', '45 min'),
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002', 4, 'Hiring Manager', 'Culture and motivation fit.', 'Prepare STAR-format stories about teamwork and conflict.', '30 min'),
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000003', 1, 'Written Technical Test', 'Digital electronics, C and microcontroller MCQs.', 'Revise flip-flops, timers, interrupts and C output questions.', '60 min'),
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000003', 2, 'Technical Interview', 'Embedded C and hardware debugging discussion.', 'Be ready to write bit-manipulation code by hand.', '45 min')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sources (id, company_id, title, source_type, status)
VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Demo student experience report', 'student_report', 'verified'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Demo placement cell debrief', 'tpo_debrief', 'verified')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questions (company_id, round_id, source_id, question, topic, difficulty, asked_on, experience)
VALUES
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'Reverse a string without using built-in library functions.', 'Strings', 'easy', '2024-09-12', 'Interviewer asked for two approaches: in-place vs extra buffer.'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'Explain the difference between primary key and unique key in PostgreSQL.', 'DBMS', 'easy', '2025-09-15', 'Follow-up asked if unique columns allow NULL values.'),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', 'Find the longest increasing subsequence and explain time/space complexity.', 'Dynamic Programming', 'hard', '2025-10-03', 'Follow-up asked for O(n log n) binary search patience sorting.'),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', 'Detect a cycle in a directed graph using Kahn’s Algorithm or DFS coloring.', 'Graphs', 'medium', '2026-08-20', 'Discussed microservice dependency trees.'),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000009', NULL, 'Write a macro in C to set, clear and toggle a specific bit in a register.', 'Bit Manipulation', 'medium', '2026-09-01', 'Live code written on whiteboard.')
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (title, body, company_id, is_demo)
VALUES
  ('Campus Placement Season 2025–2026 Commences', 'The Training & Placement Office announces the official opening of campus placement drives. All eligible students must register and verify their academic profiles.', NULL, true),
  ('Pre-Placement Talk: Halden Analytics', 'Halden Analytics will hold a virtual pre-placement presentation covering the SDE-1 and Data Analyst roles.', '11111111-0000-0000-0000-000000000002', true)
ON CONFLICT DO NOTHING;
