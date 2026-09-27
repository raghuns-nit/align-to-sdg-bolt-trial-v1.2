import type { RepositoryData } from './repository'

export class GraphEngine {
  constructor(private repo: RepositoryData) {}

  getOutEdges(nodeId: string): [string, string][] { return this.repo.outEdges.get(nodeId) || [] }
  getInEdges(nodeId: string): [string, string][] { return this.repo.inEdges.get(nodeId) || [] }

  scopeKCRs(anchorType: string, anchorId: string): string[] {
    if (anchorType === 'Subtopic') return this.getOutEdges(anchorId).filter(([tp]) => tp === 'MAPS_TO_KCR').map(([, t]) => t)
    if (anchorType === 'Module') {
      const sids = this.getOutEdges(anchorId).filter(([tp]) => tp === 'CONTAINS_SUBTOPIC').map(([, t]) => t)
      const result: string[] = []; const seen = new Set<string>()
      for (const sid of sids) for (const [tp, t] of this.getOutEdges(sid)) if (tp === 'MAPS_TO_KCR' && !seen.has(t)) { result.push(t); seen.add(t) }
      return result
    }
    if (anchorType === 'Course') {
      const mids = this.getOutEdges(anchorId).filter(([tp]) => tp === 'CONTAINS_MODULE').map(([, t]) => t)
      const sids: string[] = []
      for (const mid of mids) for (const [tp, t] of this.getOutEdges(mid)) if (tp === 'CONTAINS_SUBTOPIC') sids.push(t)
      const result: string[] = []; const seen = new Set<string>()
      for (const sid of sids) for (const [tp, t] of this.getOutEdges(sid)) if (tp === 'MAPS_TO_KCR' && !seen.has(t)) { result.push(t); seen.add(t) }
      return result
    }
    return []
  }

  enrichKCRs(kcrIds: string[]): string[] {
    const enriched = new Set(kcrIds)
    for (const kid of kcrIds) {
      for (const [tp, src] of this.getInEdges(kid)) {
        if (tp === 'APPLIES_TO_KCR' && this.repo.kprById.has(src)) enriched.add(src)
        if (tp === 'ACTS_ON_KCR' && this.repo.kfrById.has(src)) enriched.add(src)
      }
    }
    return Array.from(enriched).sort()
  }

  semanticNodesForCourse(courseId: string): string[] {
    const kids = this.scopeKCRs('Course', courseId)
    const nodes = new Set(kids)
    for (const kid of kids) {
      for (const [tp, src] of this.getInEdges(kid)) {
        if (tp === 'APPLIES_TO_KCR' && this.repo.kprById.has(src)) nodes.add(src)
        if (tp === 'ACTS_ON_KCR' && this.repo.kfrById.has(src)) nodes.add(src)
      }
    }
    return Array.from(nodes)
  }

  shortestPath(startId: string, endId: string): string[] | null {
    if (startId === endId) return [startId]
    const queue: string[] = [startId]; const visited = new Set<string>([startId]); const parent = new Map<string, string>()
    while (queue.length > 0) {
      const current = queue.shift()!
      const edges = this.getOutEdges(current).sort((a, b) => a[0] !== b[0] ? a[0].localeCompare(b[0]) : a[1].localeCompare(b[1]))
      for (const [, target] of edges) {
        if (visited.has(target)) continue
        visited.add(target); parent.set(target, current)
        if (target === endId) { const path: string[] = [endId]; let node = endId; while (parent.has(node)) { node = parent.get(node)!; path.unshift(node) } return path }
        queue.push(target)
      }
    }
    return null
  }

  getNodeType(nodeId: string): string { return this.repo.types.get(nodeId) || 'Unknown' }
  getNodeText(nodeId: string): string { return this.repo.texts.get(nodeId) || '' }
}
