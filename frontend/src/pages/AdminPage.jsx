import React, { useEffect, useState } from 'react'
import axios from 'axios'

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER']

const AdminPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const fetchUsers = async () => {
    try {
      setError('')
      const res = await axios.get('/api/admin/users', { params: { size: 100 } })
      setUsers(res.data.content || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const changeRole = async (userId, newRole) => {
    try {
      setActionMsg('')
      setError('')
      const res = await axios.patch(`/api/admin/users/${userId}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? res.data : u))
      setActionMsg(`Role updated to ${newRole}`)
      setTimeout(() => setActionMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role')
    }
  }

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return
    try {
      setActionMsg('')
      setError('')
      await axios.delete(`/api/admin/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setActionMsg('User deleted')
      setTimeout(() => setActionMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="loading-state"><div className="spinner" /><p>Loading users...</p></div>
      </div>
    )
  }

  const roleCounts = ROLES.reduce((acc, role) => {
    acc[role] = users.filter(u => u.role === role).length
    return acc
  }, {})

  return (
    <div className="admin-shell">
      <section className="admin-hero card">
        <div className="admin-hero-head">
          <div>
            <h2>User & Access Management</h2>
            <p className="admin-subtitle">Manage user roles and access levels across the platform.</p>
          </div>
          <button className="btn btn-sm btn-outline" onClick={fetchUsers}>Refresh</button>
        </div>
        <div className="admin-kpi-strip">
          <div className="admin-kpi"><span>Total Users</span><strong>{users.length}</strong></div>
          {ROLES.map(role => (
            <div className="admin-kpi" key={role}>
              <span>{role}s</span>
              <strong>{roleCounts[role] || 0}</strong>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}
      {actionMsg && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {actionMsg}
        </div>
      )}

      <section className="card admin-panel">
        <div className="admin-panel-head">
          <h3>All Users</h3>
          <span className="badge">{users.length} users</span>
        </div>

        <div className="admin-roles-legend">
          <div className="role-legend-item">
            <span className="role-dot role-dot-admin" />
            <span><strong>ADMIN</strong> — Full access. Manage users, delete resources, and view all data.</span>
          </div>
          <div className="role-legend-item">
            <span className="role-dot role-dot-operator" />
            <span><strong>OPERATOR</strong> — Create and update incidents. Cannot manage users or delete.</span>
          </div>
          <div className="role-legend-item">
            <span className="role-dot role-dot-viewer" />
            <span><strong>VIEWER</strong> — Read-only access to incidents and dashboard.</span>
          </div>
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
          {users.map(user => (
            <div className="admin-table-row" key={user.id}>
              <span className="admin-user-name">{user.fullName}</span>
              <span className="admin-user-email">{user.email}</span>
              <span>
                <select
                  className="role-select"
                  value={user.role}
                  onChange={e => changeRole(user.id, e.target.value)}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </span>
              <span className="admin-user-date">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </span>
              <span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteUser(user.id, user.email)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-muted" style={{ padding: '1.5rem', textAlign: 'center' }}>No users found.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminPage
