import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'signin') await signIn(email, password)
      else await signUp(email, password, displayName || email.split('@')[0])
      navigate('/')
    } catch (err: any) { setError(err.message || 'Authentication failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 400, margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '0.5rem' }}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
        <p style={{ color: 'var(--color-neutral-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{mode === 'signin' ? 'Sign in to create recommendations and view your history.' : 'Create an educator account to get started.'}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Display Name</label><input className="input" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" /></div>}
          <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.edu" /></div>
          <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Password</label><input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
          {error && <div className="badge badge-error" style={{ padding: '0.5rem 0.75rem', display: 'block' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>{loading ? <span className="loading-spinner" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          {mode === 'signin' ? <>Don't have an account? <button onClick={() => setMode('signup')} style={{ color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Sign up</button></>
          : <>Already have an account? <button onClick={() => setMode('signin')} style={{ color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Sign in</button></>}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}><Link to="/" style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)' }}>Back to home</Link></div>
    </div>
  )
}
