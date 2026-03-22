import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token, fullName, email: userEmail, role } = res.data
    localStorage.setItem('token', token)
    const userData = { fullName, email: userEmail, role }
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (fullName, email, password) => {
    const res = await axios.post('/api/auth/register', { fullName, email, password })
    const { token, fullName: name, email: userEmail, role } = res.data
    localStorage.setItem('token', token)
    const userData = { fullName: name, email: userEmail, role }
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
