import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const REPO_DIR = './05_RUNTIME_REPOSITORIES'
const TABLE_MAP = {
  '01_course.csv': { table: 'repo_courses', idField: 'course_id' },
  '02_module.csv': { table: 'repo_modules', idField: 'module_id' },
  '03_subtopic.csv': { table: 'repo_subtopics', idField: 'subtopic_id' },
  '04_kcr.csv': { table: 'repo_kcrs', idField: 'kcr_id' },
  '05_kpr.csv': { table: 'repo_kprs', idField: 'kpr_id' },
  '06_kfr.csv': { table: 'repo_kfrs', idField: 'kfr_id' },
  '07_scr.csv': { table: 'repo_scrs', idField: 'scr_id' },
  '08_guardrail.csv': { table: 'repo_guardrails', idField: 'guardrail_id' },
  '09_application_context.csv': { table: 'repo_application_contexts', idField: 'application_context_id' },
  '10_sdg_goal.csv': { table: 'repo_sdg_goals', idField: 'sdg_goal_id' },
  '11_sdg_target.csv': { table: 'repo_sdg_targets', idField: 'sdg_target_id' },
  '12_sdg_indicator.csv': { table: 'repo_sdg_indicators', idField: 'sdg_indicator_id' },
  '13_esd_objective.csv': { table: 'repo_esd_objectives', idField: 'esd_objective_id' },
  '14_esd_competency.csv': { table: 'repo_esd_competencies', idField: 'esd_competency_id' },
  '15_cf_knowledge.csv': { table: 'repo_cf_knowledge', idField: 'cf_knowledge_id' },
  '16_cf_skill.csv': { table: 'repo_cf_skills', idField: 'cf_skill_id' },
  '17_cf_value.csv': { table: 'repo_cf_values', idField: 'cf_value_id' },
  '18_cf_competency.csv': { table: 'repo_cf_competencies', idField: 'cf_competency_id' },
  'relationships.csv': { table: 'repo_relationships', idField: '' },
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const row = {}
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j] ?? ''
    rows.push(row)
  }
  return { headers, rows }
}

function parseLine(line) {
  const result = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (inQuotes && line[i+1] === '"') { current += '"'; i++ } else { inQuotes = !inQuotes } }
    else if (c === ',' && !inQuotes) { result.push(current); current = '' }
    else current += c
  }
  result.push(current)
  return result
}

function cleanHeader(h) { return h.replace(/:ID$|:LABEL$/, '') }

function escapeSql(s) { return String(s || '').replace(/'/g, "''") }

let totalRows = 0
const stats = {}

for (const [filename, config] of Object.entries(TABLE_MAP)) {
  const text = readFileSync(join(REPO_DIR, filename), 'utf-8')
  const { headers, rows } = parseCSV(text)
  const cleanHeaders = headers.map(cleanHeader)
  stats[config.table] = rows.length
  totalRows += rows.length
  console.log(`${config.table}: ${rows.length} rows`)
}

console.log(`\nTotal rows: ${totalRows}`)
console.log('\nStats JSON:')
console.log(JSON.stringify(stats))
