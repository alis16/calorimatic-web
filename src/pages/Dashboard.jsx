import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import { getProgress, getStreak, getDiarySummary } from '../api/diary'

export default function Dashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(null)
  const [streak, setStreak] = useState(null)
  const [diary, setDiary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProgress(), getStreak(), getDiarySummary()])
      .then(([p, s, d]) => {
        setProgress(p)
        setStreak(s)
        setDiary(d)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Loading...</div>
  }

  const calories = progress?.today?.calories_consumed || 0
  const calorieGoal = progress?.today?.calories_goal || 2000
  const pct = Math.min((calories / calorieGoal) * 100, 100).toFixed(0)

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calorimatic</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" style={{ color: '#22c55e', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link to="/diary" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Diary</Link>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          Welcome back, {user?.display_name || user?.email}!
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard label="Calories Today" value={calories + ' / ' + calorieGoal} sub={pct + '% of goal'} color="#22c55e" />
          <StatCard label="Streak" value={(streak?.current_streak || 0) + ' days'} sub={'Longest: ' + (streak?.longest_streak || 0)} color="#f59e0b" />
          <StatCard label="Protein" value={(diary?.totals?.protein || 0).toFixed(0) + 'g'} sub={'Goal: ' + (diary?.goal?.protein_g || '—') + 'g'} color="#3b82f6" />
          <StatCard label="Water" value="0.0L" sub="Today" color="#06b6d4" />
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Today's Calories</h3>
          <div style={{ background: '#1e293b', borderRadius: 999, height: 12, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ background: '#22c55e', height: '100%', borderRadius: 999, width: pct + '%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13 }}>
            <span>{calories} consumed</span>
            <span>{Math.max(calorieGoal - calories, 0)} remaining</span>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Today's Meals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => {
              const mealData = diary?.meals?.[meal]
              const entries = mealData?.entries || []
              const cal = mealData?.calories || 0
              const emojis = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
              return (
                <div key={meal} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>{emojis[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                    <span style={{ color: '#22c55e' }}>{cal} kcal</span>
                  </div>
                  {entries.length === 0
                    ? <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Nothing logged yet</p>
                    : entries.map(e => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', padding: '4px 0', borderTop: '1px solid #334155' }}>
                        <span>{e.meal_type}</span>
                        <span>{e.calories} kcal</span>
                      </div>
                    ))
                  }
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/diary" style={{ color: '#22c55e', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>
            + Log Food in Diary
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
      <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color }}>{value}</p>
      <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{sub}</p>
    </div>
  )
}