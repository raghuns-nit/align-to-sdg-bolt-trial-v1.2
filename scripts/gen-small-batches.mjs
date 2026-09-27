import { readFileSync, writeFileSync } from 'fs'
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

function esc(s) { return String(s || '').replace(/'/g, "''") }
function cleanHeader(h) { return h.replace(/:ID$|:LABEL$/, '') }

const TABLE_MAP = [
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

const BATCH_SIZE = 50 // small batches to stay under execute_sql limits
let batchNum = 0
let allBatches = []

for (const [filename, table, isRel] of TABLE_MAP) {
  const text = readFileSync(join(REPO_DIR, filename), 'utf-8')
  const { headers, rows } = parseCSV(text)
  const headerPairs = headers.map(h => ({ original: h, clean: cleanHeader(h) })).filter(h => h.clean && h.clean !== 'id')
  const cleanHeaders = headerPairs.map(h => h.clean)

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const colNames = isRel ? ['start_id', 'end_id', 'type'] : cleanHeaders
    const valParts = batch.map(row => {
      const vals = isRel
        ? [row[':START_ID'], row[':END_ID'], row[':TYPE']]
        : headerPairs.map(h => row[h.original] ?? '')
      return `(${vals.map(v => `'${esc(v)}'`).join(', ')})`
    })
    const sql = `INSERT INTO ${table} (${colNames.join(', ')}) VALUES ${valParts.join(', ')} ON CONFLICT DO NOTHING;`
    allBatches.push({ table, batchNum: batchNum++, sql, rowCount: batch.length })
  }
  console.log(`${table}: ${rows.length} rows, ${Math.ceil(rows.length / BATCH_SIZE)} batches`)
}

// Write all batches to individual files
for (const b of allBatches) {
  writeFileSync(`scripts/batch_${String(b.batchNum).padStart(3, '0')}.sql`, b.sql)
}
console.log(`\nTotal batches: ${allBatches.length}`)
// Output the batch list as JSON for reference
writeFileSync('scripts/batches.json', JSON.stringify(allBatches.map(b => ({ num: b.batchNum, table: b.table, rows: b.rowCount, size: b.sql.length })), null, 2))
