import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      const user = await getMe()
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>🥗 Calorimatic</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>Track your nutrition, reach your goals</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 14 }}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 14 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
          <button style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: '#22c55e' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}