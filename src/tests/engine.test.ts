import { describe, it, expect } from 'vitest'
import { parseCSV } from '../engine/csv-parser'
import { FROZEN_CONFIG, REPOSITORY_VERSION } from '../engine/config'

describe('CSV Parser', () => {
  it('parses simple CSV', () => {
    const result = parseCSV('id,name,status\n1,Alice,Active\n2,Bob,Inactive')
    expect(result.headers).toEqual(['id', 'name', 'status'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ id: '1', name: 'Alice', status: 'Active' })
  })
  it('handles quoted fields', () => {
    const result = parseCSV('id,desc\n1,"Hello, World"')
    expect(result.rows[0].desc).toBe('Hello, World')
  })
})

describe('Frozen Config', () => {
  it('has exact threshold values', () => {
    expect(FROZEN_CONFIG.mechanism_weight).toBe(0.55)
    expect(FROZEN_CONFIG.full_profile_weight).toBe(0.35)
    expect(FROZEN_CONFIG.context_evidence_weight).toBe(0.10)
    expect(FROZEN_CONFIG.strong_context_threshold).toBe(0.62)
    expect(FROZEN_CONFIG.promotion_max).toBe(3)
    expect(REPOSITORY_VERSION).toBe('design8a-v5a-frozen-v1')
  })
})
