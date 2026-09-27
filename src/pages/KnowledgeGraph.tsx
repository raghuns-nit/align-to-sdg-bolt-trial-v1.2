import { useEffect, useState } from 'react'
import { loadRepositoryData } from '../lib/repo-loader'
import { GraphEngine } from '../engine/graph'
import type { RepositoryData } from '../engine/repository'
import { Search, Network, Route } from 'lucide-react'

export default function KnowledgeGraph() {
  const [repo, setRepo] = useState<RepositoryData | null>(null)
  const [graph, setGraph] = useState<GraphEngine | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''); const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [pathStart, setPathStart] = useState(''); const [pathEnd, setPathEnd] = useState(''); const [pathResult, setPathResult] = useState<string[] | null | undefined>(undefined)

  useEffect(() => { loadRepositoryData().then((r) => { setRepo(r); setGraph(new GraphEngine(r)); setLoading(false) }).catch(() => setLoading(false)) }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>
  if (!repo || !graph) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-error-600)' }}>Failed to load.</div>

  const allNodes = Array.from(repo.texts.keys()).sort()
  const filteredNodes = search ? allNodes.filter((n) => { const text = repo.texts.get(n) || ''; return n.toLowerCase().includes(search.toLowerCase()) || text.toLowerCase().includes(search.toLowerCase()) }).slice(0, 50) : allNodes.slice(0, 50)
  const nodeType = selectedNode ? graph.getNodeType(selectedNode) : ''; const nodeText = selectedNode ? graph.getNodeText(selectedNode) : ''
  const outEdges = selectedNode ? graph.getOutEdges(selectedNode) : []; const inEdges = selectedNode ? graph.getInEdges(selectedNode) : []

  function findPath() { if (!graph || !pathStart || !pathEnd) return; setPathResult(graph.shortestPath(pathStart, pathEnd)) }

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Knowledge Graph Explorer</h1>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>Browse the governed ontology graph. This is read-only and independent from recommendation logic.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card"><h4 style={{ marginBottom: '0.5rem' }}><Search size={15} style={{ display: 'inline', marginRight: 4 }} /> Search Nodes</h4><input className="input" placeholder="Search by ID or text..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: '0.75rem' }} /><div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)' }}>{filteredNodes.map((nodeId) => <div key={nodeId} onClick={() => setSelectedNode(nodeId)} style={{ padding: '0.375rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--color-neutral-100)', background: selectedNode === nodeId ? 'var(--color-primary-50)' : 'white' }}><span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{nodeId}</span><span className="badge badge-neutral" style={{ marginLeft: 6, fontSize: '0.6875rem' }}>{graph.getNodeType(nodeId)}</span></div>)}</div></div>
        <div className="card"><h4 style={{ marginBottom: '0.5rem' }}><Network size={15} style={{ display: 'inline', marginRight: 4 }} /> Node Detail</h4>{!selectedNode ? <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.875rem' }}>Select a node to inspect.</p> : <div><div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{selectedNode}</div><span className="badge badge-primary" style={{ marginTop: 4 }}>{nodeType}</span>{nodeText && <p style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginTop: 8 }}>{nodeText.slice(0, 200)}{nodeText.length > 200 ? '...' : ''}</p>}{outEdges.length > 0 && <div style={{ marginTop: '0.75rem' }}><div style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: 4 }}>Outgoing edges:</div>{outEdges.slice(0, 10).map(([tp, t], i) => <div key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0' }}><span style={{ color: 'var(--color-primary-600)' }}>{`-[${tp}]->`}</span> {t}</div>)}{outEdges.length > 10 && <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>...{outEdges.length - 10} more</div>}</div>}{inEdges.length > 0 && <div style={{ marginTop: '0.75rem' }}><div style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: 4 }}>Incoming edges:</div>{inEdges.slice(0, 10).map(([tp, s], i) => <div key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0' }}><span style={{ color: 'var(--color-neutral-500)' }}>{s} {`-[${tp}]->`}</span></div>)}{inEdges.length > 10 && <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>...{inEdges.length - 10} more</div>}</div>}</div>}</div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}><Route size={15} style={{ display: 'inline', marginRight: 4 }} /> Path Inspection</h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginBottom: '0.75rem' }}>Find the shortest directed path between two nodes by hop count.</p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="select" style={{ maxWidth: 250 }} value={pathStart} onChange={(e) => setPathStart(e.target.value)}><option value="">Start node...</option>{allNodes.slice(0, 200).map((n) => <option key={n} value={n}>{n}</option>)}</select>
          <span style={{ color: 'var(--color-neutral-400)' }}>{'->'}</span>
          <select className="select" style={{ maxWidth: 250 }} value={pathEnd} onChange={(e) => setPathEnd(e.target.value)}><option value="">End node...</option>{allNodes.slice(0, 200).map((n) => <option key={n} value={n}>{n}</option>)}</select>
          <button className="btn btn-primary" onClick={findPath} disabled={!pathStart || !pathEnd}>Find Path</button>
        </div>
        {pathResult !== undefined && <div style={{ marginTop: '0.75rem' }}>{pathResult === null ? <div className="badge badge-warning">NO_GOVERNED_PATH</div> : <div><span className="badge badge-success">Path found ({pathResult.length - 1} hops)</span><div style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>{pathResult.map((node, i) => <span key={i}>{i > 0 && <span style={{ color: 'var(--color-neutral-400)' }}> {'->'} </span>}{node}</span>)}</div></div>}</div>}
      </div>
    </div>
  )
}
