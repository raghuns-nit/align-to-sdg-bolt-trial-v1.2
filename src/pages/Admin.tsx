import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { loadRepositoryData } from '../lib/repo-loader'
import { validateRepository } from '../engine/validator'
import { Shield, Users, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { RepositoryData } from '../engine/repository'

interface UserRow { id: string; email: string; display_name: string; role: string; status: string; created_at: string }

export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'users' | 'repository' | 'overview'>('overview')
  const [users, setUsers] = useState<UserRow[]>([])
  const [repo, setRepo] = useState<RepositoryData | null>(null)
  const [validationReport, setValidationReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: userData } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
      setUsers(userData || [])
      const r = await loadRepositoryData(); setRepo(r); setValidationReport(validateRepository(r))
    } catch (err) { console.error('Admin load error:', err) }
    setLoading(false)
  }

  async function updateRole(userId: string, role: string) { await supabase.from('user_profiles').update({ role }).eq('id', userId); loadData() }
  async function updateStatus(userId: string, status: string) { await supabase.from('user_profiles').update({ status }).eq('id', userId); loadData() }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}><Shield size={20} style={{ display: 'inline', marginRight: 8 }} />Administration</h1>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>Repository data is read-only. User management is the only active administrative function.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('users')}><Users size={14} /> Users</button>
        <button className={`btn ${tab === 'repository' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('repository')}><Database size={14} /> Repository</button>
      </div>
      {tab === 'overview' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card"><h4>Total Users</h4><div style={{ fontSize: '2rem', fontWeight: 600, marginTop: 4 }}>{users.length}</div></div>
        <div className="card"><h4>Admins</h4><div style={{ fontSize: '2rem', fontWeight: 600, marginTop: 4 }}>{users.filter((u) => u.role === 'ADMIN').length}</div></div>
        <div className="card"><h4>Educators</h4><div style={{ fontSize: '2rem', fontWeight: 600, marginTop: 4 }}>{users.filter((u) => u.role === 'EDUCATOR').length}</div></div>
        {repo && <><div className="card"><h4>SCRs</h4><div style={{ fontSize: '2rem', fontWeight: 600, marginTop: 4 }}>{repo.scrs.length}</div></div><div className="card"><h4>Relationships</h4><div style={{ fontSize: '2rem', fontWeight: 600, marginTop: 4 }}>{repo.relationships.length}</div></div></>}
      </div>}
      {tab === 'users' && <div className="card" style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}><thead><tr style={{ borderBottom: '1px solid var(--color-neutral-200)' }}><th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Created</th></tr></thead><tbody>{users.map((u) => <tr key={u.id} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}><td style={{ padding: '0.5rem' }}>{u.display_name}</td><td style={{ padding: '0.5rem', color: 'var(--color-neutral-500)' }}>{u.email}</td><td style={{ padding: '0.5rem' }}><select className="select" style={{ padding: '0.25rem', fontSize: '0.8125rem' }} value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}><option value="EDUCATOR">EDUCATOR</option><option value="ADMIN">ADMIN</option></select></td><td style={{ padding: '0.5rem' }}><select className="select" style={{ padding: '0.25rem', fontSize: '0.8125rem' }} value={u.status} onChange={(e) => updateStatus(u.id, e.target.value)}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></td><td style={{ padding: '0.5rem', color: 'var(--color-neutral-500)' }}>{new Date(u.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
      {tab === 'repository' && validationReport && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="card"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{validationReport.passed ? <><CheckCircle size={20} style={{ color: 'var(--color-success-600)' }} /><span style={{ fontWeight: 500, color: 'var(--color-success-700)' }}>Repository validation passed</span></> : <><XCircle size={20} style={{ color: 'var(--color-error-600)' }} /><span style={{ fontWeight: 500, color: 'var(--color-error-700)' }}>Repository validation failed</span></>}</div></div>
        {validationReport.checks.map((check: any, i: number) => <div key={i} className="card" style={{ padding: '0.75rem 1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{check.status === 'PASS' ? <CheckCircle size={16} style={{ color: 'var(--color-success-600)' }} /> : check.status === 'WARN' ? <AlertCircle size={16} style={{ color: 'var(--color-warning-600)' }} /> : <XCircle size={16} style={{ color: 'var(--color-error-600)' }} />}<span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{check.name}</span><span className={`badge badge-${check.status === 'PASS' ? 'success' : check.status === 'WARN' ? 'warning' : 'error'}`} style={{ marginLeft: 'auto' }}>{check.status}</span></div><p style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginTop: 4 }}>{check.message}</p></div>)}
      </div>}
    </div>
  )
}
