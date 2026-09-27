import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { Compass, Network, Clock, HelpCircle, Shield } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '3rem 0 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Align To SDG</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-neutral-500)', maxWidth: 600, margin: '0 auto' }}>
          An Ontology-Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <Link to={user ? '/create' : '/auth'} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%' }}><Compass size={28} style={{ color: 'var(--color-primary-600)', marginBottom: 8 }} /><h3>Create a Recommendation</h3><p style={{ color: 'var(--color-neutral-500)', fontSize: '0.9375rem', marginTop: 4 }}>Select a course, module, and subtopic, then describe your teaching context to receive a sustainability curriculum recommendation.</p></div>
        </Link>
        <Link to={user ? '/graph' : '/auth'} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%' }}><Network size={28} style={{ color: 'var(--color-primary-600)', marginBottom: 8 }} /><h3>Knowledge Graph Explorer</h3><p style={{ color: 'var(--color-neutral-500)', fontSize: '0.9375rem', marginTop: 4 }}>Browse the governed ontology graph, inspect entities and relationships, and trace directed paths between concepts.</p></div>
        </Link>
        {user && <Link to="/history" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%' }}><Clock size={28} style={{ color: 'var(--color-primary-600)', marginBottom: 8 }} /><h3>My History</h3><p style={{ color: 'var(--color-neutral-500)', fontSize: '0.9375rem', marginTop: 4 }}>View your past recommendation results and saved items without rerunning the recommendation engine.</p></div>
        </Link>}
        <Link to="/help" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%' }}><HelpCircle size={28} style={{ color: 'var(--color-primary-600)', marginBottom: 8 }} /><h3>Help Center</h3><p style={{ color: 'var(--color-neutral-500)', fontSize: '0.9375rem', marginTop: 4 }}>Learn how to navigate the application, create recommendations, understand results, and use the Knowledge Graph Explorer.</p></div>
        </Link>
        {user?.role === 'ADMIN' && <Link to="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ height: '100%' }}><Shield size={28} style={{ color: 'var(--color-primary-600)', marginBottom: 8 }} /><h3>Administration</h3><p style={{ color: 'var(--color-neutral-500)', fontSize: '0.9375rem', marginTop: 4 }}>Manage users, roles, and inspect repository status.</p></div>
        </Link>}
      </div>
      {!user && <div style={{ textAlign: 'center', marginTop: '2rem' }}><Link to="/auth" className="btn btn-primary">Sign in to get started</Link></div>}
    </div>
  )
}
