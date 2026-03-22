import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const LoginPage = ({ onToggle }) => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-intro">
          <h1>Incident Alert Hub</h1>
          <p>Senior-grade incident response workspace for real-time monitoring and coordinated triage.</p>
          <ul className="auth-points">
            <li>Live incident feed with WebSocket updates</li>
            <li>Role-based access and secure API workflows</li>
            <li>Dashboard insights for service reliability</li>
          </ul>
        </section>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Sign In</h2>
            <p>Access your operations workspace</p>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-toggle">
            Don't have an account?{' '}
            <button type="button" className="link-btn" onClick={onToggle}>Create one</button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
