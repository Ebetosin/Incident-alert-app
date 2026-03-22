import React from 'react'

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#16a34a',
}

const STATUS_OPTIONS = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']

const formatTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const IncidentCard = ({ incident, onStatusChange }) => {
  const severityColor = SEVERITY_COLORS[incident.severity] || '#6b7280'
  const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED'
  const severityClass = `incident-severity-${incident.severity?.toLowerCase()}`

  return (
    <article className={`incident-card ${severityClass} ${isResolved ? 'resolved' : ''}`}>
      <div className="incident-header">
        <div className="incident-meta">
          <span className="incident-id">INC-{incident.id}</span>
          <span className="severity-badge" style={{ background: severityColor }}>
            {incident.severity}
          </span>
          <span className={`status-badge status-${incident.status?.toLowerCase()}`}>
            {incident.status}
          </span>
        </div>
        <span className="incident-time">{formatTime(incident.createdAt)}</span>
      </div>
      <div className="incident-body">
        <h3 className="incident-service">{incident.serviceName}</h3>
        <p className="incident-message">{incident.message}</p>
      </div>
      <div className="incident-footer">
        <label className="status-select-label" htmlFor={`status-${incident.id}`}>Workflow Status</label>
        <select
          id={`status-${incident.id}`}
          className="status-select"
          value={incident.status}
          onChange={(e) => onStatusChange(incident.id, e.target.value)}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </article>
  )
}

export default IncidentCard
