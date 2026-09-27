import type { RepositoryData } from '../engine/repository'
import { buildRepository } from '../engine/repository'
import { supabase } from './supabase'

let cachedRepo: RepositoryData | null = null

export async function loadRepositoryData(): Promise<RepositoryData> {
  if (cachedRepo) return cachedRepo
  try {
    const { data, error } = await supabase.from('repo_courses').select('course_id').limit(1)
    if (!error && data && data.length > 0) { cachedRepo = await loadFromSupabase(); return cachedRepo }
  } catch { /* fall through */ }
  cachedRepo = await loadFromLocalCSVs()
  return cachedRepo
}

async function loadFromSupabase(): Promise<RepositoryData> {
  const tableMap: Record<string, string> = {
    repo_courses: 'course', repo_modules: 'module', repo_subtopics: 'subtopic',
    repo_kcrs: 'kcr', repo_kprs: 'kpr', repo_kfrs: 'kfr', repo_scrs: 'scr',
    repo_guardrails: 'guardrail', repo_application_contexts: 'context',
    repo_sdg_goals: 'sdgGoal', repo_sdg_targets: 'sdgTarget', repo_sdg_indicators: 'sdgIndicator',
    repo_esd_objectives: 'esdObjective', repo_esd_competencies: 'esdCompetency',
    repo_cf_knowledge: 'cfKnowledge', repo_cf_skills: 'cfSkill', repo_cf_values: 'cfValue', repo_cf_competencies: 'cfCompetency',
    repo_relationships: 'relationships',
  }
  const files: Record<string, string> = {}
  for (const [tableName, fileKey] of Object.entries(tableMap)) {
    const { data, error } = await supabase.from(tableName).select('*')
    if (error) throw new Error(`Failed to load ${tableName}: ${error.message}`)
    files[fileKey] = rowsToCSV(data || [])
  }
  return buildRepository(files)
}

async function loadFromLocalCSVs(): Promise<RepositoryData> {
  const imports = await Promise.all([
    import('../data/01_course.csv?raw'), import('../data/02_module.csv?raw'),
    import('../data/03_subtopic.csv?raw'), import('../data/04_kcr.csv?raw'),
    import('../data/05_kpr.csv?raw'), import('../data/06_kfr.csv?raw'),
    import('../data/07_scr.csv?raw'), import('../data/08_guardrail.csv?raw'),
    import('../data/09_application_context.csv?raw'), import('../data/10_sdg_goal.csv?raw'),
    import('../data/11_sdg_target.csv?raw'), import('../data/12_sdg_indicator.csv?raw'),
    import('../data/13_esd_objective.csv?raw'), import('../data/14_esd_competency.csv?raw'),
    import('../data/15_cf_knowledge.csv?raw'), import('../data/16_cf_skill.csv?raw'),
    import('../data/17_cf_value.csv?raw'), import('../data/18_cf_competency.csv?raw'),
    import('../data/relationships.csv?raw'),
  ])
  return buildRepository({
    course: imports[0].default, module: imports[1].default, subtopic: imports[2].default,
    kcr: imports[3].default, kpr: imports[4].default, kfr: imports[5].default, scr: imports[6].default,
    guardrail: imports[7].default, context: imports[8].default, sdgGoal: imports[9].default,
    sdgTarget: imports[10].default, sdgIndicator: imports[11].default, esdObjective: imports[12].default,
    esdCompetency: imports[13].default, cfKnowledge: imports[14].default, cfSkill: imports[15].default,
    cfValue: imports[16].default, cfCompetency: imports[17].default, relationships: imports[18].default,
  })
}

function rowsToCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]).filter((h) => h !== 'id')
  const lines = [headers.join(',')]
  for (const row of rows) {
    const values = headers.map((h) => { const val = row[h] ?? ''; const str = String(val).replace(/"/g, '""'); return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str })
    lines.push(values.join(','))
  }
  return lines.join('\n')
}

export function clearRepoCache() { cachedRepo = null }
