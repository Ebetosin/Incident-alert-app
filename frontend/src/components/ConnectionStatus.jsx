import React from 'react'

const ConnectionStatus = ({ connected }) => (
  <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
    <span className="status-dot" />
    {connected ? 'Live' : 'Disconnected'}
  </div>
)

export default ConnectionStatus
