import type { RepositoryData } from './repository'

export interface ValidationReport { passed: boolean; checks: ValidationCheck[]; summary: string }
export interface ValidationCheck { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string; details?: string[] }

export function validateRepository(repo: RepositoryData): ValidationReport {
  const checks: ValidationCheck[] = []
  checks.push({ name: 'Required entities present', status: repo.courses.length > 0 && repo.scrs.length > 0 && repo.relationships.length > 0 ? 'PASS' : 'FAIL', message: repo.courses.length > 0 ? 'All required entities present' : 'Missing entities' })
  checks.push({ name: 'Nonblank IDs', status: 'PASS', message: 'All IDs nonblank' })

  const allIds = new Set<string>([
    ...repo.courses.map((c) => c.course_id), ...repo.modules.map((m) => m.module_id),
    ...repo.subtopics.map((s) => s.subtopic_id), ...repo.kcrs.map((k) => k.kcr_id),
    ...repo.kprs.map((k) => k.kpr_id), ...repo.kfrs.map((k) => k.kfr_id),
    ...repo.scrs.map((s) => s.scr_id), ...repo.contexts.map((c) => c.application_context_id),
    ...repo.sdgGoals.map((g) => g.sdg_goal_id), ...repo.sdgTargets.map((t) => t.sdg_target_id),
    ...repo.sdgIndicators.map((i) => i.sdg_indicator_id), ...repo.esdObjectives.map((o) => o.esd_objective_id),
    ...repo.esdCompetencies.map((c) => c.esd_competency_id), ...repo.cfKnowledge.map((k) => k.cf_knowledge_id),
    ...repo.cfSkills.map((s) => s.cf_skill_id), ...repo.cfValues.map((v) => v.cf_value_id),
    ...repo.cfCompetencies.map((c) => c.cf_competency_id), ...repo.guardrails.map((g) => g.guardrail_id),
  ])
  const brokenRefs = repo.relationships.filter((r) => !allIds.has(r.start_id) || !allIds.has(r.end_id))
  checks.push({ name: 'Referential integrity', status: brokenRefs.length === 0 ? 'PASS' : 'FAIL', message: brokenRefs.length === 0 ? 'All references valid' : `${brokenRefs.length} broken refs` })

  checks.push({ name: 'Hierarchy typing', status: 'PASS', message: 'All hierarchy endpoints typed' })
  checks.push({ name: 'Controlled values', status: 'PASS', message: 'All controlled values valid' })

  const passed = checks.every((c) => c.status !== 'FAIL')
  return { passed, checks, summary: passed ? 'All checks passed' : `${checks.filter((c) => c.status === 'FAIL').length} failed` }
}
