'use client'

import { useState, useEffect, useCallback } from 'react'

interface Event {
  id: string
  code: string
  djName: string
  djPhone: string
  venmoUsername: string | null
  acceptingRequests: boolean
  tipAmounts: string
  createdAt: string
}

interface SongRequest {
  id: string
  songTitle: string
  artistName: string
  note: string | null
  createdAt: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')

  // Event creation
  const [djName, setDjName] = useState('')
  const [djPhone, setDjPhone] = useState('')
  const [venmo, setVenmo] = useState('')
  const [tipAmounts, setTipAmounts] = useState('2,5,10')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Events list
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [requests, setRequests] = useState<SongRequest[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/events', {
      headers: { Authorization: `Bearer ${password}` },
    })
    if (res.ok) {
      const data = await res.json()
      setEvents(data)
    }
  }, [password])

  const fetchRequests = useCallback(async (code: string) => {
    const res = await fetch(`/api/events/${code}/requests`, {
      headers: { Authorization: `Bearer ${password}` },
    })
    if (res.ok) {
      const data = await res.json()
      setRequests(data)
    }
  }, [password])

  // Auto-refresh requests every 10 seconds
  useEffect(() => {
    if (!selectedEvent) return
    const interval = setInterval(() => fetchRequests(selectedEvent.code), 10000)
    return () => clearInterval(interval)
  }, [selectedEvent, fetchRequests])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthenticated(true)
      // Fetch events after auth
      setTimeout(fetchEvents, 100)
    } else {
      setAuthError('Wrong password')
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ djName, djPhone, venmoUsername: venmo || undefined, tipAmounts }),
      })
      if (res.ok) {
        setDjName('')
        setDjPhone('')
        setVenmo('')
        setTipAmounts('2,5,10')
        fetchEvents()
      } else {
        const data = await res.json()
        setCreateError(data.error ? JSON.stringify(data.error) : 'Failed to create event')
      }
    } catch {
      setCreateError('Network error — check your connection')
    }
    setCreating(false)
  }

  async function handleSelectEvent(event: Event) {
    setSelectedEvent(event)
    setQrDataUrl('')
    fetchRequests(event.code)

    // Generate QR code client-side
    const baseUrl = window.location.origin
    const eventUrl = `${baseUrl}/e/${event.code}`
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(eventUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#ffffff', light: '#00000000' },
      })
      setQrDataUrl(dataUrl)
    } catch {
      console.error('QR generation failed')
    }
  }

  async function toggleAccepting(event: Event) {
    await fetch(`/api/events/${event.code}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ acceptingRequests: !event.acceptingRequests }),
    })
    fetchEvents()
    if (selectedEvent?.id === event.id) {
      setSelectedEvent({ ...event, acceptingRequests: !event.acceptingRequests })
    }
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-sm w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">DJ Dashboard</h1>
            <p className="text-zinc-400 text-sm">Enter admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit" className="btn btn-primary w-full">
              Log In
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Selected event detail view
  if (selectedEvent) {
    const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${selectedEvent.code}`
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
        <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-white text-sm">
          ← Back to events
        </button>

        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{selectedEvent.djName}</h2>
              <p className="text-zinc-400 text-sm font-mono">{selectedEvent.code}</p>
            </div>
            <button
              onClick={() => toggleAccepting(selectedEvent)}
              className={`btn text-sm ${selectedEvent.acceptingRequests ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'} text-white`}
            >
              {selectedEvent.acceptingRequests ? '● Live' : '○ Paused'}
            </button>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="text-center space-y-3">
              <div className="bg-zinc-800 rounded-xl p-6 inline-block">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs font-mono break-all">{eventUrl}</p>
                <a href={qrDataUrl} download={`qr-${selectedEvent.code}.png`} className="btn btn-secondary text-sm inline-block">
                  Download QR
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Requests */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Requests <span className="text-zinc-500">({requests.length})</span>
          </h3>
          {requests.length === 0 ? (
            <p className="text-zinc-500 text-sm">No requests yet. Share the QR code to get started.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="card !p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.songTitle}</p>
                    <p className="text-zinc-400 text-sm">{r.artistName}</p>
                    {r.note && <p className="text-zinc-500 text-xs mt-1">&ldquo;{r.note}&rdquo;</p>}
                  </div>
                  <span className="text-zinc-600 text-xs whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Events list + create form
  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">DJ Dashboard</h1>

      {/* Create Event */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">New Event</h2>
        <form onSubmit={handleCreateEvent} className="space-y-3">
          <input
            className="input"
            placeholder="DJ Name"
            value={djName}
            onChange={(e) => setDjName(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Phone (e.g. +15551234567)"
            value={djPhone}
            onChange={(e) => setDjPhone(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Venmo username (optional)"
            value={venmo}
            onChange={(e) => setVenmo(e.target.value)}
          />
          <input
            className="input"
            placeholder="Tip amounts (e.g. 2,5,10)"
            value={tipAmounts}
            onChange={(e) => setTipAmounts(e.target.value)}
          />
          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={creating}>
            {creating ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Events</h2>
        {events.length === 0 ? (
          <p className="text-zinc-500 text-sm">No events yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className="card !p-4 w-full text-left hover:border-zinc-600 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{event.djName}</p>
                  <p className="text-zinc-500 text-xs font-mono">{event.code}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${event.acceptingRequests ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
                  {event.acceptingRequests ? 'Live' : 'Paused'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
