import { readFileSync } from 'fs'
import { join } from 'path'

const REPO_DIR = './05_RUNTIME_REPOSITORIES'

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

function esc(s) { return String(s || '').replace(/'/g, "''") }

function generateInserts(filename, tableName, isRelationship = false) {
  const text = readFileSync(join(REPO_DIR, filename), 'utf-8')
  const { headers, rows } = parseCSV(text)
  const cleanHeaders = headers.map(cleanHeader).filter(h => h && h !== 'id')
  // Map clean header to original header for value lookup
  const headerPairs = headers.map(h => ({ original: h, clean: cleanHeader(h) })).filter(h => h.clean && h.clean !== 'id')

  const sqlParts = []
  for (const row of rows) {
    const cols = isRelationship ? ['start_id', 'end_id', 'type'] : cleanHeaders
    const vals = isRelationship
      ? [row[':START_ID'], row[':END_ID'], row[':TYPE']]
      : headerPairs.map(h => row[h.original] ?? '')

    const valStr = vals.map(v => `'${esc(v)}'`).join(', ')
    sqlParts.push(`(${valStr})`)
  }

  const colNames = isRelationship ? ['start_id', 'end_id', 'type'] : cleanHeaders
  const colStr = colNames.join(', ')
  // Split into batches of 500
  const batches = []
  for (let i = 0; i < sqlParts.length; i += 500) {
    const batch = sqlParts.slice(i, i + 500).join(', ')
    batches.push(`INSERT INTO ${tableName} (${colStr}) VALUES ${batch} ON CONFLICT DO NOTHING;`)
  }
  return batches
}

// Generate SQL for each table
const tables = [
  ['01_course.csv', 'repo_courses', false],
  ['02_module.csv', 'repo_modules', false],
  ['03_subtopic.csv', 'repo_subtopics', false],
  ['04_kcr.csv', 'repo_kcrs', false],
  ['05_kpr.csv', 'repo_kprs', false],
  ['06_kfr.csv', 'repo_kfrs', false],
  ['07_scr.csv', 'repo_scrs', false],
  ['08_guardrail.csv', 'repo_guardrails', false],
  ['09_application_context.csv', 'repo_application_contexts', false],
  ['10_sdg_goal.csv', 'repo_sdg_goals', false],
  ['11_sdg_target.csv', 'repo_sdg_targets', false],
  ['12_sdg_indicator.csv', 'repo_sdg_indicators', false],
  ['13_esd_objective.csv', 'repo_esd_objectives', false],
  ['14_esd_competency.csv', 'repo_esd_competencies', false],
  ['15_cf_knowledge.csv', 'repo_cf_knowledge', false],
  ['16_cf_skill.csv', 'repo_cf_skills', false],
  ['17_cf_value.csv', 'repo_cf_values', false],
  ['18_cf_competency.csv', 'repo_cf_competencies', false],
  ['relationships.csv', 'repo_relationships', true],
]

let allSql = ''
for (const [filename, table, isRel] of tables) {
  const batches = generateInserts(filename, table, isRel)
  for (const batch of batches) {
    allSql += batch + '\n'
  }
  console.log(`${table}: ${batches.length} batches`)
}

// Write to file
import { writeFileSync } from 'fs'
writeFileSync('./scripts/import.sql', allSql)
console.log(`\nTotal SQL size: ${(allSql.length / 1024).toFixed(0)} KB`)
