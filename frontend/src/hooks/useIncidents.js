import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import SockJS from 'sockjs-client'
import StompJs from 'stompjs/lib/stomp'

const { Stomp } = StompJs

const API_BASE = '/api/incidents'

export function useIncidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(API_BASE, { params: { page: 0, size: 50 } })
      setIncidents(res.data.content || res.data)
      setError(null)
    } catch (err) {
      setError('Unable to load incidents. Ensure backend is running on port 8090.')
    } finally {
      setLoading(false)
    }
  }, [])

  const createIncident = useCallback(async (data) => {
    const res = await axios.post(API_BASE, data)
    return res.data
  }, [])

  const updateStatus = useCallback(async (id, status) => {
    const res = await axios.patch(`${API_BASE}/${id}/status`, { status })
    setIncidents(prev =>
      prev.map(inc => (inc.id === res.data.id ? res.data : inc))
    )
    return res.data
  }, [])

  useEffect(() => {
    fetchIncidents()

    let client
    try {
      const socket = new SockJS('/ws')
      client = Stomp.over(socket)
      client.debug = () => {}
      client.connect(
        {},
        () => {
          setConnected(true)
          setError(null)
          client.subscribe('/topic/incidents', (msg) => {
            const incoming = JSON.parse(msg.body)
            setIncidents(prev => {
              const exists = prev.find(i => i.id === incoming.id)
              if (exists) {
                return prev.map(i => (i.id === incoming.id ? incoming : i))
              }
              return [incoming, ...prev]
            })
          })
        },
        () => {
          setConnected(false)
          setError('Live feed disconnected. Attempting reconnection...')
        }
      )
      clientRef.current = client
    } catch (err) {
      setError('Unable to initialize live feed.')
    }

    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.disconnect()
      }
    }
  }, [fetchIncidents])

  return { incidents, loading, error, connected, createIncident, updateStatus, refetch: fetchIncidents }
}
