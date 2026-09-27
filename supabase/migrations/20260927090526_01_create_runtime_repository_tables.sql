/*
# Runtime Repository Tables — Canonical mirror from CSV sources

1. Purpose
   - Store validated runtime repository data imported from the 19 CSV files.
   - These tables are read-only mirrors of the canonical source files.
   - They are NOT editable through the application UI.
   - Repository refresh must originate from the governed source package.

2. Tables created:
   - repo_courses, repo_modules, repo_subtopics
   - repo_kcrs, repo_kprs, repo_kfrs, repo_scrs
   - repo_guardrails, repo_application_contexts
   - repo_sdg_goals, repo_sdg_targets, repo_sdg_indicators
   - repo_esd_objectives, repo_esd_competencies
   - repo_cf_knowledge, repo_cf_skills, repo_cf_values, repo_cf_competencies
   - repo_relationships
   - repo_release_meta (version/hash tracking)

3. Security
   - RLS enabled on all tables.
   - All authenticated users can SELECT (read-only mirror).
   - No INSERT/UPDATE/DELETE via normal app policies.
   - Repository import is done via service role (server-side only).
*/

-- Course
CREATE TABLE IF NOT EXISTS repo_courses (
  course_id TEXT PRIMARY KEY,
  title TEXT, domain TEXT, discipline TEXT, description TEXT,
  objectives TEXT, learning_outcomes TEXT, course_type TEXT,
  level TEXT, status TEXT
);

-- Module
CREATE TABLE IF NOT EXISTS repo_modules (
  module_id TEXT PRIMARY KEY,
  name TEXT, module_no TEXT, description TEXT,
  module_sd_id TEXT, status TEXT
);

-- Subtopic
CREATE TABLE IF NOT EXISTS repo_subtopics (
  subtopic_id TEXT PRIMARY KEY,
  name TEXT, subtopic_no TEXT, description TEXT,
  subtopic_sd_id TEXT, review_status TEXT, status TEXT, version TEXT
);

-- KCR
CREATE TABLE IF NOT EXISTS repo_kcrs (
  kcr_id TEXT PRIMARY KEY,
  name TEXT, domain TEXT, concept_category TEXT, concept_type TEXT,
  definition TEXT, scope TEXT, core_principles TEXT,
  semantic_description TEXT, keywords_synonyms TEXT, status TEXT
);

-- KPR
CREATE TABLE IF NOT EXISTS repo_kprs (
  kpr_id TEXT PRIMARY KEY,
  name TEXT, domain TEXT, discipline TEXT, principle_type TEXT,
  principle_granularity TEXT, definition TEXT, scope TEXT,
  core_ideas TEXT, semantic_description TEXT, keywords_synonyms TEXT, status TEXT
);

-- KFR
CREATE TABLE IF NOT EXISTS repo_kfrs (
  kfr_id TEXT PRIMARY KEY,
  name TEXT, domain TEXT, discipline TEXT, function_type TEXT,
  function_granularity TEXT, definition TEXT, scope TEXT, purpose TEXT,
  inputs TEXT, outputs TEXT, realization_or_mechanism TEXT,
  semantic_description TEXT, keywords_synonyms TEXT, status TEXT
);

-- SCR
CREATE TABLE IF NOT EXISTS repo_scrs (
  scr_id TEXT PRIMARY KEY,
  name TEXT, sustainability_dimension TEXT, domain TEXT,
  definition TEXT, scope TEXT, core_ideas TEXT,
  semantic_description TEXT, keywords_synonyms TEXT,
  sustainability_principle TEXT, principle_origin TEXT,
  underlying_mechanism TEXT, derived_from_practice_or_system TEXT,
  evidence_status TEXT, implementation_maturity TEXT,
  transferability TEXT, boundary_conditions TEXT,
  recommendation_trigger TEXT, status TEXT
);

-- Guardrail
CREATE TABLE IF NOT EXISTS repo_guardrails (
  guardrail_id TEXT PRIMARY KEY,
  guardrail_level TEXT, topic TEXT, allowed_concepts TEXT,
  excluded_claims TEXT, evidence_type TEXT, status TEXT
);

-- Application Context
CREATE TABLE IF NOT EXISTS repo_application_contexts (
  application_context_id TEXT PRIMARY KEY,
  name TEXT, context_granularity TEXT, application_domain TEXT,
  description TEXT, technical_problem TEXT, operational_action TEXT,
  mechanism TEXT, sustainability_outcome TEXT, boundary_conditions TEXT,
  relevant_disciplines TEXT, transferability TEXT,
  keywords_synonyms TEXT, status TEXT, context_source TEXT
);

-- SDG Goal
CREATE TABLE IF NOT EXISTS repo_sdg_goals (
  sdg_goal_id TEXT PRIMARY KEY,
  goal_number TEXT, title TEXT, description TEXT, status TEXT
);

-- SDG Target
CREATE TABLE IF NOT EXISTS repo_sdg_targets (
  sdg_target_id TEXT PRIMARY KEY,
  target_code TEXT, text TEXT, status TEXT
);

-- SDG Indicator
CREATE TABLE IF NOT EXISTS repo_sdg_indicators (
  sdg_indicator_id TEXT PRIMARY KEY,
  indicator_code TEXT, text TEXT, status TEXT
);

-- ESD Objective
CREATE TABLE IF NOT EXISTS repo_esd_objectives (
  esd_objective_id TEXT PRIMARY KEY,
  domain TEXT, objective_no TEXT, text TEXT, status TEXT
);

-- ESD Competency
CREATE TABLE IF NOT EXISTS repo_esd_competencies (
  esd_competency_id TEXT PRIMARY KEY,
  name TEXT, definition TEXT, scope TEXT, status TEXT
);

-- CF Knowledge
CREATE TABLE IF NOT EXISTS repo_cf_knowledge (
  cf_knowledge_id TEXT PRIMARY KEY,
  education_level TEXT, sub_heading TEXT, text TEXT, status TEXT
);

-- CF Skill
CREATE TABLE IF NOT EXISTS repo_cf_skills (
  cf_skill_id TEXT PRIMARY KEY,
  education_level TEXT, sub_heading TEXT, text TEXT, status TEXT
);

-- CF Value
CREATE TABLE IF NOT EXISTS repo_cf_values (
  cf_value_id TEXT PRIMARY KEY,
  education_level TEXT, sub_heading TEXT, text TEXT, status TEXT
);

-- CF Competency
CREATE TABLE IF NOT EXISTS repo_cf_competencies (
  cf_competency_id TEXT PRIMARY KEY,
  name TEXT, definition TEXT, scope TEXT, status TEXT
);

-- Relationships
CREATE TABLE IF NOT EXISTS repo_relationships (
  id SERIAL PRIMARY KEY,
  start_id TEXT NOT NULL,
  end_id TEXT NOT NULL,
  type TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_repo_rel_start ON repo_relationships(start_id);
CREATE INDEX IF NOT EXISTS idx_repo_rel_end ON repo_relationships(end_id);
CREATE INDEX IF NOT EXISTS idx_repo_rel_type ON repo_relationships(type);

-- Release metadata
CREATE TABLE IF NOT EXISTS repo_release_meta (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  source_hash TEXT,
  imported_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all repo tables
ALTER TABLE repo_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_kcrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_kprs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_kfrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_scrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_application_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_sdg_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_sdg_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_sdg_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_esd_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_esd_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_cf_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_cf_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_cf_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_cf_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_release_meta ENABLE ROW LEVEL SECURITY;

-- Read-only SELECT for authenticated users on all repo tables
-- (anon can also read — the repository data is reference data, not user-private)
DROP POLICY IF EXISTS "repo_read_all" ON repo_courses;
CREATE POLICY "repo_read_all" ON repo_courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_modules;
CREATE POLICY "repo_read_all" ON repo_modules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_subtopics;
CREATE POLICY "repo_read_all" ON repo_subtopics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_kcrs;
CREATE POLICY "repo_read_all" ON repo_kcrs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_kprs;
CREATE POLICY "repo_read_all" ON repo_kprs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_kfrs;
CREATE POLICY "repo_read_all" ON repo_kfrs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_scrs;
CREATE POLICY "repo_read_all" ON repo_scrs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_guardrails;
CREATE POLICY "repo_read_all" ON repo_guardrails FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_application_contexts;
CREATE POLICY "repo_read_all" ON repo_application_contexts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_sdg_goals;
CREATE POLICY "repo_read_all" ON repo_sdg_goals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_sdg_targets;
CREATE POLICY "repo_read_all" ON repo_sdg_targets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_sdg_indicators;
CREATE POLICY "repo_read_all" ON repo_sdg_indicators FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_esd_objectives;
CREATE POLICY "repo_read_all" ON repo_esd_objectives FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_esd_competencies;
CREATE POLICY "repo_read_all" ON repo_esd_competencies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_cf_knowledge;
CREATE POLICY "repo_read_all" ON repo_cf_knowledge FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_cf_skills;
CREATE POLICY "repo_read_all" ON repo_cf_skills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_cf_values;
CREATE POLICY "repo_read_all" ON repo_cf_values FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_cf_competencies;
CREATE POLICY "repo_read_all" ON repo_cf_competencies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_relationships;
CREATE POLICY "repo_read_all" ON repo_relationships FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "repo_read_all" ON repo_release_meta;
CREATE POLICY "repo_read_all" ON repo_release_meta FOR SELECT TO anon, authenticated USING (true);
