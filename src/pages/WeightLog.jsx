import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../api/auth'
import client from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function WeightLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [period, setPeriod] = useState('month')

  const fetchLogs = async () => {
    try {
      const response = await client.get('/progress/weight', { params: { period } })
      setLogs(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [period])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!weight) return
    setSaving(true)
    setSuccess(false)
    try {
      await client.post('/progress/weight/', {
        weight_kg: parseFloat(weight),
        note: note || null,
      })
      setWeight('')
      setNote('')
      setSuccess(true)
      await fetchLogs()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const chartData = logs.map(log => ({
    date: log.logged_at.split('T')[0],
    weight: log.weight_kg,
  }))

  const latest = logs.length > 0 ? logs[logs.length - 1].weight_kg : null
  const first = logs.length > 0 ? logs[0].weight_kg : null
  const change = latest && first ? (latest - first).toFixed(1) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calorimatic</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link to="/diary" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Diary</Link>
          <Link to="/progress" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Progress</Link>
          <Link to="/weight" style={{ color: '#22c55e', textDecoration: 'none', fontSize: 14 }}>Weight</Link>
          <Link to="/profile" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Profile</Link>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Log out</button>
        </div>
      </div>

      <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Weight Tracker</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>Current Weight</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#22c55e' }}>{latest ? latest + ' kg' : '—'}</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>Change</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: change > 0 ? '#ef4444' : '#22c55e' }}>
              {change ? (change > 0 ? '+' : '') + change + ' kg' : '—'}
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>Entries</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#3b82f6' }}>{logs.length}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Log Weight</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70.5"
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Morning weight"
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              {success && <p style={{ color: '#22c55e', fontSize: 13, margin: 0 }}>Weight logged!</p>}
              <button
                type="submit"
                disabled={saving}
                style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : 'Log Weight'}
              </button>
            </form>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#94a3b8' }}>Recent Entries</h4>
              {logs.slice(-5).reverse().map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{log.logged_at.split('T')[0]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{log.weight_kg} kg</span>
                </div>
              ))}
              {logs.length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>No entries yet</p>}
            </div>
          </div>

          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Weight Trend</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {['week', 'month', 'year'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{ background: period === p ? '#22c55e' : '#0f172a', border: period === p ? '1px solid #22c55e' : '1px solid #334155', color: period === p ? '#fff' : '#94a3b8', padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Loading...</p>
            ) : chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: '#94a3b8' }}>No weight data yet.</p>
                <p style={{ color: '#64748b', fontSize: 13 }}>Log your first weight entry to see your trend.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}