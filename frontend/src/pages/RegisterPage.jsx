import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const RegisterPage = ({ onToggle }) => {
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(fullName, email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-intro">
          <h1>Incident Alert Hub</h1>
          <p>Set up your operator account and join a production-grade incident management workflow.</p>
          <ul className="auth-points">
            <li>Rapid incident creation and status transitions</li>
            <li>Operational dashboard with severity and service insights</li>
            <li>Audit trail for accountable on-call actions</li>
          </ul>
        </section>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Provision your secure operator access</p>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                maxLength={100}
                autoComplete="name"
              />
            </div>
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
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="auth-toggle">
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={onToggle}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
