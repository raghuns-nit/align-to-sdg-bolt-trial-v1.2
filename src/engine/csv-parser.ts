export interface ParsedCSV { headers: string[]; rows: Record<string, string>[] }

export function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j] ?? ''
    rows.push(row)
  }
  return { headers, rows }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else { inQuotes = !inQuotes } }
    else if (char === ',' && !inQuotes) { result.push(current); current = '' }
    else current += char
  }
  result.push(current)
  return result
}

export function getRelationshipFields(headers: string[]): { startField: string; endField: string; typeField: string } | null {
  const startField = headers.find((h) => h === ':START_ID')
  const endField = headers.find((h) => h === ':END_ID')
  const typeField = headers.find((h) => h === ':TYPE')
  if (!startField || !endField || !typeField) return null
  return { startField, endField, typeField }
}

export function joinText(row: Record<string, string>, fields: string[]): string {
  return fields.map((f) => (row[f] || '').trim()).filter((s) => s.length > 0).join(' ').trim()
}
