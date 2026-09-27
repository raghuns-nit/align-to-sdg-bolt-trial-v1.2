import { describe, it, expect } from 'vitest'
import { LSAEmbeddingBackend } from '../engine/semantic'

describe('LSA Embedding Backend', () => {
  it('produces 384-dimensional or lower output', () => {
    const corpus = new Map([
      ['doc1', 'sustainable water management practices'],
      ['doc2', 'renewable energy systems design'],
      ['doc3', 'circular economy waste reduction'],
      ['doc4', 'carbon footprint assessment methodology'],
      ['doc5', 'biodiversity conservation strategies'],
    ])
    const backend = new LSAEmbeddingBackend(corpus)
    expect(backend.dimension).toBeGreaterThan(0)
    expect(backend.dimension).toBeLessThanOrEqual(256)
  })

  it('returns similarity scores', () => {
    const corpus = new Map([
      ['doc1', 'sustainable water management'],
      ['doc2', 'renewable energy systems'],
      ['doc3', 'waste reduction recycling'],
    ])
    const backend = new LSAEmbeddingBackend(corpus)
    const scores = backend.similarity('water sustainability', ['doc1', 'doc2', 'doc3'])
    expect(scores.size).toBe(3)
    expect(typeof scores.get('doc1')).toBe('number')
  })

  it('returns zero scores for empty query', () => {
    const corpus = new Map([['doc1', 'test document']])
    const backend = new LSAEmbeddingBackend(corpus)
    const scores = backend.similarity('', ['doc1'])
    expect(scores.get('doc1')).toBe(0)
  })

  it('returns zero for unknown id', () => {
    const corpus = new Map([['doc1', 'test document']])
    const backend = new LSAEmbeddingBackend(corpus)
    const scores = backend.similarity('test', ['unknown'])
    expect(scores.get('unknown')).toBe(0)
  })
})
