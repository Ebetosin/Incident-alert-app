import React, { useState } from 'react'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const IncidentForm = ({ onSubmit }) => {
  const [serviceName, setServiceName] = useState('payments-api')
  const [severity, setSeverity] = useState('HIGH')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!serviceName.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ serviceName: serviceName.trim(), severity, message: message.trim() })
      setMessage('')
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card">
      <div className="card-header card-header-tight">
        <div>
          <h2>Raise Incident</h2>
          <p className="card-subtitle">Create a new event for all on-call operators and dashboards.</p>
        </div>
        <span className="badge">Manual Trigger</span>
      </div>
      <form className="incident-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="service">Service</label>
          <input
            id="service"
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. payments-api"
            required
            maxLength={100}
          />
        </div>
        <div className="form-group">
          <label htmlFor="severity">Severity</label>
          <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group full-width">
          <label htmlFor="message">Description</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the incident..."
            rows={3}
            required
            maxLength={1000}
          />
          <small className="input-helper">{message.length}/1000 characters</small>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-danger" disabled={submitting}>
            {submitting ? 'Raising...' : 'Raise Incident'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default IncidentForm
