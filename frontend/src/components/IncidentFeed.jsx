import React, { useMemo, useState } from 'react'
import IncidentCard from './IncidentCard'

const STATUS_FILTERS = ['ALL', 'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']
const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const IncidentFeed = ({ incidents, loading, onStatusChange }) => {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [severity, setSeverity] = useState('ALL')

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return incidents.filter((item) => {
      const matchesQuery = !normalizedQuery
        || item.serviceName?.toLowerCase().includes(normalizedQuery)
        || item.message?.toLowerCase().includes(normalizedQuery)
        || String(item.id).includes(normalizedQuery)
      const matchesStatus = status === 'ALL' || item.status === status
      const matchesSeverity = severity === 'ALL' || item.severity === severity
      return matchesQuery && matchesStatus && matchesSeverity
    })
  }, [incidents, query, severity, status])

  if (loading) {
    return (
      <section className="card">
        <div className="card-header card-header-tight">
          <h2>Live Incident Feed</h2>
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading incidents...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Live Incident Feed</h2>
          <p className="card-subtitle">Filter and triage live incidents as they arrive.</p>
        </div>
        <span className="badge">{filteredIncidents.length} visible</span>
      </div>

      <div className="feed-toolbar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="feed-search"
          placeholder="Search by service, message, or ID..."
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="feed-filter">
          {STATUS_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="feed-filter">
          {SEVERITY_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => {
            setQuery('')
            setStatus('ALL')
            setSeverity('ALL')
          }}
        >
          Reset
        </button>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="empty-state">
          <p>
            {incidents.length === 0
              ? 'No incidents reported yet. The board is clear.'
              : 'No incidents match the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="incident-list">
          {filteredIncidents.map(item => (
            <IncidentCard
              key={item.id}
              incident={item}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default IncidentFeed
