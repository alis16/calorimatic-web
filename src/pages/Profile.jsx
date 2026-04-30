import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import client from '../api/client'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    display_name: '',
    height_cm: '',
    weight_kg: '',
    age: '',
    activity_level: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || '',
        height_cm: user.height_cm || '',
        weight_kg: user.weight_kg || '',
        age: user.age || '',
        activity_level: user.activity_level || '',
      })
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError('')
    try {
      const response = await client.put('/users/me', {
        display_name: form.display_name || null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        age: form.age ? parseInt(form.age) : null,
        activity_level: form.activity_level || null,
      })
      setUser(response.data)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary — desk job, no exercise' },
    { value: 'light', label: 'Light — exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderate — exercise 3-5 days/week' },
    { value: 'active', label: 'Active — hard exercise 6-7 days/week' },
    { value: 'very_active', label: 'Very Active — physical job + exercise' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calorimatic</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link to="/diary" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Diary</Link>
          <Link to="/profile" style={{ color: '#22c55e', textDecoration: 'none', fontSize: 14 }}>Profile</Link>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Log out</button>
        </div>
      </div>

      <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your Profile</h2>
        <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>Keep your profile updated so we can calculate your calorie targets accurately.</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>Personal Info</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Display Name</label>
                <input
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Height (cm)</label>
                  <input
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                    type="number"
                    value={form.height_cm}
                    onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                    placeholder="175"
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Weight (kg)</label>
                  <input
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                    type="number"
                    value={form.weight_kg}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Age</label>
                  <input
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Activity Level</label>
                <select
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                  value={form.activity_level}
                  onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
                >
                  <option value="">Select activity level</option>
                  {activityLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {success && <p style={{ color: '#22c55e', fontSize: 14, margin: 0 }}>Profile saved successfully!</p>}
          {error && <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div style={{ marginTop: 32, background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>Account</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 16px' }}>{user?.email}</p>
          <Link
            to="/goals"
            style={{ color: '#22c55e', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
          >
            Set or update my calorie goals →
          </Link>
        </div>
      </div>
    </div>
  )
}