import { readFileSync } from 'fs'
import { join } from 'path'

const REPO_DIR = './05_RUNTIME_REPOSITORIES'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Read .env for service key
const envText = readFileSync('.env', 'utf-8')
const serviceKeyMatch = envText.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : ''

if (!serviceKey) {
  console.error('No service role key found')
  process.exit(1)
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

async function importTable(filename, tableName, isRel) {
  const text = readFileSync(join(REPO_DIR, filename), 'utf-8')
  const { headers, rows } = parseCSV(text)
  const headerPairs = headers.map(h => ({ original: h, clean: cleanHeader(h) })).filter(h => h.clean && h.clean !== 'id')
  const cleanHeaders = headerPairs.map(h => h.clean)

  const records = rows.map(row => {
    if (isRel) {
      return { start_id: row[':START_ID'], end_id: row[':END_ID'], type: row[':TYPE'] }
    }
    const obj = {}
    for (const h of headerPairs) {
      obj[h.clean] = row[h.original] ?? ''
    }
    return obj
  })

  // Insert in batches of 200
  const batchSize = 200
  let inserted = 0
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const url = `${SUPABASE_URL}/rest/v1/${tableName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates',
      },
      body: JSON.stringify(batch),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(`${tableName} batch ${i}: ${res.status} ${errText.slice(0, 200)}`)
      // Try individual inserts
      for (const rec of batch) {
        const res2 = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal,resolution=ignore-duplicates',
          },
          body: JSON.stringify(rec),
        })
        if (res2.ok) inserted++
      }
    } else {
      inserted += batch.length
    }
  }
  console.log(`${tableName}: ${inserted}/${records.length} inserted`)
  return inserted
}

let total = 0
for (const [filename, table, isRel] of TABLE_MAP) {
  try {
    total += await importTable(filename, table, isRel)
  } catch (err) {
    console.error(`${table}: ${err.message}`)
  }
}
console.log(`\nTotal imported: ${total}`)
