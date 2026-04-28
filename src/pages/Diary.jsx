import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import { getDiarySummary, searchFoods, logFood, deleteLog } from '../api/diary'

export default function Diary() {
  const { user } = useAuth()
  const [diary, setDiary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState('breakfast')
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [logging, setLogging] = useState(false)

  const fetchDiary = async () => {
    try {
      const data = await getDiarySummary()
      setDiary(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDiary() }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const data = await searchFoods(searchQuery)
      setSearchResults(data.results)
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const handleLog = async () => {
    if (!selectedFood) return
    setLogging(true)
    try {
      await logFood({ food_id: selectedFood.id, quantity, meal_type: selectedMeal })
      setSelectedFood(null)
      setSearchQuery('')
      setSearchResults([])
      setQuantity(1)
      await fetchDiary()
    } catch (err) {
      console.error(err)
    } finally {
      setLogging(false)
    }
  }

  const handleDelete = async (logId) => {
    try {
      await deleteLog(logId)
      await fetchDiary()
    } catch (err) {
      console.error(err)
    }
  }

  const meals = ['breakfast', 'lunch', 'dinner', 'snack']
  const emojis = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Calorimatic</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link to="/diary" style={{ color: '#22c55e', textDecoration: 'none', fontSize: 14 }}>Diary</Link>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Log out</button>
        </div>
      </div>

      <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Food Diary</h2>

        {diary && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Calories', value: diary.totals.calories + ' / ' + (diary.goal.calories || '—'), color: '#22c55e' },
              { label: 'Protein', value: diary.totals.protein.toFixed(0) + 'g', color: '#3b82f6' },
              { label: 'Carbs', value: diary.totals.carbs.toFixed(0) + 'g', color: '#f59e0b' },
              { label: 'Fat', value: diary.totals.fat.toFixed(0) + 'g', color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ background: '#1e293b', borderRadius: 10, padding: '12px 20px', border: '1px solid #334155' }}>
                <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>{item.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Add Food</h3>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {meals.map(meal => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  style={{ background: selectedMeal === meal ? '#22c55e' : '#0f172a', border: selectedMeal === meal ? '1px solid #22c55e' : '1px solid #334155', color: selectedMeal === meal ? '#fff' : '#94a3b8', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  {emojis[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14 }}
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button style={{ background: '#22c55e', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: 16 }} type="submit">
                {searching ? '...' : '🔍'}
              </button>
            </form>

            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {searchResults.map(food => (
                <div
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: selectedFood?.id === food.id ? '1px solid #22c55e' : '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0' }}>{food.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{food.calories_per100} kcal per 100g</p>
                  </div>
                  {selectedFood?.id === food.id && <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>

            {selectedFood && (
              <div style={{ marginTop: 16, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                <p style={{ fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>{selectedFood.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <label style={{ color: '#94a3b8', fontSize: 13 }}>Quantity (x100g)</label>
                  <input
                    style={{ width: 80, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14 }}
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  />
                </div>
                <p style={{ color: '#22c55e', fontSize: 13, marginBottom: 12 }}>
                  {(selectedFood.calories_per100 * quantity).toFixed(0)} kcal · {(selectedFood.protein_per100 * quantity).toFixed(1)}g protein
                </p>
                <button
                  onClick={handleLog}
                  disabled={logging}
                  style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                >
                  {logging ? 'Logging...' : 'Add to ' + selectedMeal}
                </button>
              </div>
            )}
          </div>

          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Today's Log</h3>
            {loading ? <p style={{ color: '#475569' }}>Loading...</p> : meals.map(meal => {
              const mealData = diary?.meals?.[meal]
              const entries = mealData?.entries || []
              const cal = mealData?.calories || 0
              return (
                <div key={meal} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #334155' }}>
                    <span style={{ fontWeight: 600 }}>{emojis[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                    <span style={{ color: '#22c55e', fontSize: 14 }}>{cal} kcal</span>
                  </div>
                  {entries.length === 0
                    ? <p style={{ color: '#475569', fontSize: 13 }}>Nothing logged</p>
                    : entries.map(entry => (
                      <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0' }}>{entry.meal_type}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{entry.calories} kcal · {entry.protein.toFixed(1)}g P</p>
                        </div>
                        <button onClick={() => handleDelete(entry.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>✕</button>
                      </div>
                    ))
                  }
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}