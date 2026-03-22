import React, { useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useIncidents } from './hooks/useIncidents'
import ConnectionStatus from './components/ConnectionStatus'
import IncidentForm from './components/IncidentForm'
import IncidentFeed from './components/IncidentFeed'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

const App = () => {
  const { user, loading: authLoading, logout } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [view, setView] = useState('incidents')

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-state"><div className="spinner" /><p>Loading...</p></div>
      </div>
    )
  }

  if (!user) {
    return authMode === 'login'
      ? <LoginPage onToggle={() => setAuthMode('register')} />
      : <RegisterPage onToggle={() => setAuthMode('login')} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-eyebrow">Incident Operations</span>
            <h1>Incident Alert Hub</h1>
            <p className="subtitle">Real-time monitoring, triage, and service reliability coordination</p>
          </div>
          <div className="header-actions">
            <nav className="header-nav">
              <button
                className={`nav-btn ${view === 'incidents' ? 'active' : ''}`}
                onClick={() => setView('incidents')}
              >
                Incidents
              </button>
              <button
                className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
              >
                Dashboard
              </button>
              {user.role === 'ADMIN' && (
                <button
                  className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
                  onClick={() => setView('admin')}
                >
                  Admin
                </button>
              )}
            </nav>
            <div className="user-info">
              <div className="user-meta">
                <span className="user-name">{user.fullName}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <span className="user-role">{user.role}</span>
              <button className="btn btn-sm btn-outline" onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      </header>
      <main className="container">
        {view === 'admin' && user.role === 'ADMIN' ? <AdminPage /> :
         view === 'dashboard' ? <DashboardPage /> : <IncidentsView />}
      </main>
    </div>
  )
}

const IncidentsView = () => {
  const { user } = useAuth()
  const { incidents, loading, error, connected, createIncident, updateStatus } = useIncidents()
  const canWrite = user?.role === 'ADMIN' || user?.role === 'OPERATOR'
  const summary = useMemo(() => {
    const counts = incidents.reduce((acc, item) => {
      acc.total += 1
      if (item.status === 'OPEN') acc.open += 1
      if (item.severity === 'CRITICAL') acc.critical += 1
      if (item.status === 'RESOLVED' || item.status === 'CLOSED') acc.resolved += 1
      return acc
    }, { total: 0, open: 0, critical: 0, resolved: 0 })
    return counts
  }, [incidents])

  return (
    <div className="incidents-shell">
      <section className="incident-hero card">
        <div className="incident-hero-head">
          <div>
            <h2>Live Incident Workspace</h2>
            <p>Track, triage, and resolve incidents with real-time updates from the backend event stream.</p>
          </div>
          <ConnectionStatus connected={connected} />
        </div>
        <div className="incident-kpi-strip">
          <div className="incident-kpi"><span>Total</span><strong>{summary.total}</strong></div>
          <div className="incident-kpi"><span>Open</span><strong>{summary.open}</strong></div>
          <div className="incident-kpi"><span>Critical</span><strong>{summary.critical}</strong></div>
          <div className="incident-kpi"><span>Resolved</span><strong>{summary.resolved}</strong></div>
        </div>
      </section>
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}
      <section className="incidents-layout">
        {canWrite && (
          <aside className="incidents-sidebar">
            <IncidentForm onSubmit={createIncident} />
          </aside>
        )}
        <section className={canWrite ? 'incidents-main' : 'incidents-main incidents-full'}>
          <IncidentFeed
            incidents={incidents}
            loading={loading}
            onStatusChange={canWrite ? updateStatus : null}
          />
        </section>
      </section>
    </div>
  )
}

export default App
