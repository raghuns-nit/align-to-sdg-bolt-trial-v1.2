import { describe, it, expect } from 'vitest'
import { parseCSV, joinText, getIdField, getRelationshipFields } from '../engine/csv-parser'

describe('CSV Parser', () => {
  it('parses simple CSV', () => {
    const csv = 'id,name,status\n1,Alice,Active\n2,Bob,Inactive'
    const result = parseCSV(csv)
    expect(result.headers).toEqual(['id', 'name', 'status'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ id: '1', name: 'Alice', status: 'Active' })
  })

  it('handles quoted fields with commas', () => {
    const csv = 'id,description\n1,"Hello, World"\n2,"Quote ""inside"""'
    const result = parseCSV(csv)
    expect(result.rows[0].description).toBe('Hello, World')
    expect(result.rows[1].description).toBe('Quote "inside"')
  })

  it('handles empty lines', () => {
    const csv = 'id,name\n1,Alice\n\n2,Bob'
    const result = parseCSV(csv)
    expect(result.rows).toHaveLength(2)
  })

  it('detects ID field', () => {
    const headers = ['course_id:ID', 'title', 'status', ':LABEL']
    expect(getIdField(headers)).toBe('course_id:ID')
  })

  it('detects relationship fields', () => {
    const headers = [':START_ID', ':END_ID', ':TYPE']
    const result = getRelationshipFields(headers)
    expect(result).toEqual({ startField: ':START_ID', endField: ':END_ID', typeField: ':TYPE' })
  })

  it('joinText joins non-empty fields', () => {
    const row = { a: 'Hello', b: '', c: 'World' }
    expect(joinText(row, ['a', 'b', 'c'])).toBe('Hello World')
  })
})
