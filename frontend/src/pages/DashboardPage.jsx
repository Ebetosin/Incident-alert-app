import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const STATUS_ORDER = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']
const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const sumMapValues = (valueMap = {}) =>
  Object.values(valueMap).reduce((sum, value) => sum + Number(value || 0), 0)

const toPercent = (value, total) => {
  if (!total) return 0
  return Math.round((Number(value || 0) / total) * 100)
}

const buildTimeline = (entries, bucketCount = 12, bucketMinutes = 30) => {
  const bucketMs = bucketMinutes * 60 * 1000
  const end = Date.now()
  const start = end - bucketMs * (bucketCount - 1)

  const points = Array.from({ length: bucketCount }, (_, index) => ({
    timestamp: start + index * bucketMs,
    count: 0
  }))

  entries.forEach((entry) => {
    if (!entry?.createdAt) return
    const entryTime = new Date(entry.createdAt).getTime()
    if (Number.isNaN(entryTime) || entryTime < start || entryTime > end) return
    const index = Math.floor((entryTime - start) / bucketMs)
    if (index >= 0 && index < points.length) {
      points[index].count += 1
    }
  })

  return points
}

const buildLinePath = (points, width = 100, height = 46) => {
  if (!points.length) return ''
  const max = Math.max(...points.map((point) => point.count), 1)
  return points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * width
      const y = height - (point.count / max) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

const buildAreaPath = (points, width = 100, height = 46) => {
  if (!points.length) return ''
  const linePath = buildLinePath(points, width, height)
  return `${linePath} L ${width} ${height} L 0 ${height} Z`
}

const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const DashboardPage = () => {
  const [stats, setStats] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshedAt, setRefreshedAt] = useState(null)

  const fetchData = async () => {
    try {
      setError('')
      const [statsRes, auditRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/audit-log', { params: { size: 100 } })
      ])
      setStats(statsRes.data)
      setAuditLog(auditRes.data.content || [])
      setRefreshedAt(new Date())
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const timeline = useMemo(() => buildTimeline(auditLog), [auditLog])
  const timelineMax = useMemo(() => Math.max(...timeline.map((point) => point.count), 1), [timeline])
  const trendLine = useMemo(() => buildLinePath(timeline), [timeline])
  const trendArea = useMemo(() => buildAreaPath(timeline), [timeline])

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="loading-state"><div className="spinner" /><p>Loading dashboard...</p></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="dashboard-shell">
        {error ? (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            {error}
            <button className="btn btn-sm btn-accent" style={{ marginLeft: '1rem' }} onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <p className="text-muted dashboard-empty">No dashboard data yet.</p>
        )}
      </div>
    )
  }

  const statusMap = stats.byStatus || {}
  const severityMap = stats.bySeverity || {}
  const serviceRows = Object.entries(stats.byService || {}).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const totalFromSeverity = sumMapValues(severityMap)
  const totalIncidents = Number(stats.totalIncidents || totalFromSeverity || 0)
  const openIncidents = Number(stats.openIncidents || statusMap.OPEN || 0)
  const resolvedToday = Number(stats.resolvedToday || 0)
  const criticalIncidents = Number(stats.criticalIncidents || severityMap.CRITICAL || 0)

  const resolutionRate = toPercent(resolvedToday, Math.max(totalIncidents, 1))
  const criticalShare = toPercent(criticalIncidents, Math.max(totalIncidents, 1))
  const activeShare = toPercent(openIncidents, Math.max(totalIncidents, 1))

  const kpiCards = [
    {
      title: 'Total Incidents',
      value: totalIncidents,
      context: `${activeShare}% currently open`
    },
    {
      title: 'Open Queue',
      value: openIncidents,
      context: `${criticalIncidents} critical incidents`
    },
    {
      title: 'Resolved Today',
      value: resolvedToday,
      context: `${resolutionRate}% of total volume`
    },
    {
      title: 'Critical Share',
      value: `${criticalShare}%`,
      context: 'Current risk concentration'
    }
  ]

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero card">
        <div className="dashboard-hero-head">
          <div>
            <h2>Incident Operations Dashboard</h2>
            <p className="dashboard-subtitle">Real-time incident health, severity spread, and service pressure.</p>
          </div>
          <div className="dashboard-hero-actions">
            {refreshedAt && <span className="dashboard-timestamp">Last refresh {formatTime(refreshedAt)}</span>}
            <button className="btn btn-sm btn-outline" onClick={fetchData}>Refresh</button>
          </div>
        </div>

        <div className="dashboard-kpi-grid">
          {kpiCards.map((card) => (
            <article className="dashboard-kpi-card" key={card.title}>
              <h3>{card.title}</h3>
              <strong>{card.value}</strong>
              <p>{card.context}</p>
            </article>
          ))}
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      <section className="dashboard-grid">
        <article className="card dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-head">
            <h3>Activity Trend (Last 6 Hours)</h3>
            <span className="badge">30-min intervals</span>
          </div>
          <div className="trend-chart">
            <svg viewBox="0 0 100 46" preserveAspectRatio="none" aria-label="Incident activity trend">
              <line x1="0" y1="11.5" x2="100" y2="11.5" className="trend-grid" />
              <line x1="0" y1="23" x2="100" y2="23" className="trend-grid" />
              <line x1="0" y1="34.5" x2="100" y2="34.5" className="trend-grid" />
              <path d={trendArea} className="trend-area" />
              <path d={trendLine} className="trend-line" />
            </svg>
          </div>
          <div className="trend-footer">
            <span>{timeline.length ? formatTime(timeline[0].timestamp) : 'N/A'}</span>
            <span>Peak {timelineMax} events / bucket</span>
            <span>{timeline.length ? formatTime(timeline[timeline.length - 1].timestamp) : 'N/A'}</span>
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Severity Distribution</h3>
            <span className="badge">{totalIncidents} total</span>
          </div>
          <div className="metric-list">
            {SEVERITY_ORDER.map((severity) => {
              const value = Number(severityMap[severity] || 0)
              const width = toPercent(value, Math.max(totalFromSeverity, 1))
              return (
                <div className="metric-row" key={severity}>
                  <div className="metric-label">
                    <span className={`severity-pill severity-${severity.toLowerCase()}`}>{severity}</span>
                    <span className="metric-count">{value}</span>
                  </div>
                  <div className="metric-bar">
                    <div className={`metric-fill metric-severity-${severity.toLowerCase()}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Status Pipeline</h3>
            <span className="badge">{openIncidents} active</span>
          </div>
          <div className="metric-list">
            {STATUS_ORDER.map((status) => {
              const value = Number(statusMap[status] || 0)
              const width = toPercent(value, Math.max(totalIncidents, 1))
              return (
                <div className="metric-row" key={status}>
                  <div className="metric-label">
                    <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                    <span className="metric-count">{value}</span>
                  </div>
                  <div className="metric-bar">
                    <div className={`metric-fill metric-status-${status.toLowerCase()}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Top Impacted Services</h3>
            <span className="badge">Top 6</span>
          </div>
          <div className="service-list">
            {serviceRows.length > 0 ? serviceRows.map(([serviceName, count]) => {
              const width = toPercent(count, Math.max(serviceRows[0]?.[1] || 1, 1))
              return (
                <div className="service-row" key={serviceName}>
                  <div className="service-meta">
                    <span className="service-name">{serviceName}</span>
                    <span className="service-count">{count}</span>
                  </div>
                  <div className="service-bar">
                    <div className="service-fill" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-muted">No service impact data available.</p>
            )}
          </div>
        </article>
      </section>

      <section className="card dashboard-panel">
        <div className="dashboard-panel-head">
          <h3>Recent Audit Activity</h3>
          <span className="badge">{auditLog.length} rows</span>
        </div>
        {auditLog.length > 0 ? (
          <div className="audit-table">
            <div className="audit-head">
              <span>Action</span>
              <span>Actor</span>
              <span>Details</span>
              <span>Time</span>
            </div>
            {auditLog.slice(0, 12).map((entry) => (
              <div className="audit-item" key={entry.id}>
                <span className="audit-action-tag">{entry.action || 'UNKNOWN'}</span>
                <span>{entry.performedBy || 'system'}</span>
                <span className="audit-details">{entry.details || `${entry.entityType} #${entry.entityId}`}</span>
                <span className="audit-time">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No audit activity available.</p>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
