import client from './client'

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password })
  localStorage.setItem('access_token', response.data.access_token)
  localStorage.setItem('refresh_token', response.data.refresh_token)
  return response.data
}

export const register = async (email, password, display_name) => {
  const response = await client.post('/auth/register', { email, password, display_name })
  return response.data
}

export const getMe = async () => {
  const response = await client.get('/auth/me')
  return response.data
}

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}