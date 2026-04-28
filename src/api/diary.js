import client from './client'

export const getDiarySummary = async (date) => {
  const params = date ? { target_date: date } : {}
  const response = await client.get('/logs/food/summary', { params })
  return response.data
}

export const logFood = async (data) => {
  const response = await client.post('/logs/food/', data)
  return response.data
}

export const deleteLog = async (logId) => {
  const response = await client.delete(`/logs/food/${logId}`)
  return response.data
}

export const searchFoods = async (query, limit = 20, offset = 0) => {
  const response = await client.get('/foods/search', { params: { q: query, limit, offset } })
  return response.data
}

export const getProgress = async () => {
  const response = await client.get('/progress/overview')
  return response.data
}

export const getStreak = async () => {
  const response = await client.get('/progress/streak')
  return response.data
}