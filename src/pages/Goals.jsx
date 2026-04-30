import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import client from '../api/client'

export default function Goals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goalType, setGoalType] = useState('maintain')
  const [calculating, setCalculating] = useState(false)
  const [calculated, setCalculated] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const canCalculate = user?.height_cm && user?.weight_kg && user?.age && user?.activity_level

  const handleCalculate = async () => {
    setCalculating(true)
    setError('')
    try {
      const response = await client.post(`/users/me/goals/calculate?goal_type=${goalType}`)
      setCalculated(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Calculation failed')
    } finally {
      setCalculating(false)
    }
  }

  const handleManualSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const form = e.target
    try {
      await client.post('/users/me/goals', {
        goal_type: goalType,
        calories_target: parseInt(form.calories.value),
        protein_g: parseInt(form.protein.value),
        carbs_g: parseInt(form.carbs.value),
        fat_g: parseInt(form.fat.value),
        water_ml: form.water.value ? parseInt(form.water.value) : null,
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save goals')
    } finally {
      setSaving(false)
    }
  }

  const goalTypes = [
    { value: 'lose', label: 'Lose Weight', emoji: '📉', desc: '500 cal deficit per day' },
    { value: 'maintain', label: 'Maintain Weight', emoji: '⚖️', desc: 'Stay at current weight' },
    { value: 'gain', label: 'Gain Weight', emoji: '📈', desc: '300 cal surplus per day' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calorimatic</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link to="/diary" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Diary</Link>
          <Link to="/profile" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Profile</Link>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Log out</button>
        </div>
      </div>

      <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Set Your Goals</h2>
        <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>Choose your goal and we'll calculate your daily targets automatically.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {goalTypes.map(g => (
            <div
              key={g.value}
              onClick={() => setGoalType(g.value)}
              style={{ background: goalType === g.value ? '#1e3a2f' : '#1e293b', border: goalType === g.value ? '1px solid #22c55e' : '1px solid #334155', borderRadius: 12, padding: 16, cursor: 'pointer', textAlign: 'center' }}
            >
              <p style={{ fontSize: 24, margin: '0 0 8px' }}>{g.emoji}</p>
              <p style={{ fontWeight: 600, margin: '0 0 4px', fontSize: 14 }}>{g.label}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{g.desc}</p>
            </div>
          ))}
        </div>

        {canCalculate ? (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Auto Calculate</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>Based on your profile — {user.height_cm}cm, {user.weight_kg}kg, age {user.age}, {user.activity_level}</p>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              {calculating ? 'Calculating...' : 'Calculate My Targets'}
            </button>

            {calculated && (
              <div style={{ marginTop: 16, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #22c55e' }}>
                <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: 12 }}>Calculated targets:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Calories', value: calculated.calories_target },
                    { label: 'Protein', value: calculated.protein_g + 'g' },
                    { label: 'Carbs', value: calculated.carbs_g + 'g' },
                    { label: 'Fat', value: calculated.fat_g + 'g' },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 4px' }}>{item.label}</p>
                      <p style={{ fontWeight: 700, fontSize: 18, margin: 0, color: '#22c55e' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setSuccess(true); setTimeout(() => navigate('/dashboard'), 1500) }}
                  style={{ marginTop: 16, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14, width: '100%' }}
                >
                  Use These Targets
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #f59e0b', marginBottom: 24 }}>
            <p style={{ color: '#f59e0b', fontSize: 14, margin: 0 }}>
              ⚠️ Complete your <Link to="/profile" style={{ color: '#22c55e' }}>profile</Link> with height, weight, age and activity level to use auto-calculate.
            </p>
          </div>
        )}

        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Set Manually</h3>
          <form onSubmit={handleManualSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { name: 'calories', label: 'Daily Calories', placeholder: '2000' },
                { name: 'protein', label: 'Protein (g)', placeholder: '150' },
                { name: 'carbs', label: 'Carbs (g)', placeholder: '200' },
                { name: 'fat', label: 'Fat (g)', placeholder: '70' },
                { name: 'water', label: 'Water (ml)', placeholder: '2500' },
              ].map(field => (
                <div key={field.name}>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>{field.label}</label>
                  <input
                    name={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    defaultValue={calculated ? calculated[field.name === 'calories' ? 'calories_target' : field.name + '_g'] : ''}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>{error}</p>}
            {success && <p style={{ color: '#22c55e', fontSize: 14, margin: 0 }}>Goals saved! Redirecting...</p>}

            <button
              type="submit"
              disabled={saving}
              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
            >
              {saving ? 'Saving...' : 'Save Goals'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}