import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../api/auth'
import { getProgressRange, getStreak } from '../api/diary'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Progress() {
  const [data, setData] = useState(null)
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(7)

  useEffect(() => {
    const end = new Date().toISOString().split('T')[0]
    const start = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    Promise.all([getProgressRange(start, end), getStreak()])
      .then(([rangeData, streakData]) => {
        setData(rangeData)
        setStreak(streakData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calorimatic</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link to="/diary" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Diary</Link>
          <Link to="/progress" style={{ color: '#22c55e', textDecoration: 'none', fontSize: 14 }}>Progress</Link>
          <Link to="/profile" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Profile</Link>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Log out</button>
        </div>
      </div>

      <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Progress</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                style={{ background: period === d ? '#22c55e' : '#1e293b', border: period === d ? '1px solid #22c55e' : '1px solid #334155', color: period === d ? '#fff' : '#94a3b8', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>🔥 Current Streak</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#f59e0b' }}>{streak?.current_streak || 0} days</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Longest: {streak?.longest_streak || 0} days</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>Days Logged</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#22c55e' }}>{data?.days?.length || 0}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Last {period} days</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>Avg Calories</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#3b82f6' }}>{data?.averages?.calories?.toFixed(0) || 0}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Per day average</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading charts...</p>
        ) : data?.days?.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 40, border: '1px solid #334155', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 16 }}>No data yet for this period.</p>
            <p style={{ color: '#64748b', fontSize: 14 }}>Start logging food in your diary to see progress charts here.</p>
            <Link to="/diary" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>Go to Diary →</Link>
          </div>
        ) : (
          <>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Calorie Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Calories" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Macro Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="protein" fill="#3b82f6" name="Protein (g)" />
                  <Bar dataKey="carbs" fill="#f59e0b" name="Carbs (g)" />
                  <Bar dataKey="fat" fill="#ef4444" name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}