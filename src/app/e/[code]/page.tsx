'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

interface EventData {
  id: string
  code: string
  djName: string
  acceptingRequests: boolean
  venmoUsername: string | null
  tipAmounts: string
}

type Step = 'search' | 'confirm' | 'sent' | 'tip'

export default function GuestPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const code = params.code as string
  const justTipped = searchParams.get('tipped') === '1'

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Selected song
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualArtist, setManualArtist] = useState('')
  const [note, setNote] = useState('')
  const [honeypot, setHoneypot] = useState('')

  // Flow
  const [step, setStep] = useState<Step>(justTipped ? 'sent' : 'search')
  const [submitting, setSubmitting] = useState(false)
  const [requestId, setRequestId] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Tip
  const [tipping, setTipping] = useState(false)

  useEffect(() => {
    async function loadEvent() {
      const res = await fetch(`/api/events/${code}`)
      if (res.ok) {
        setEvent(await res.json())
      } else {
        setError('Event not found')
      }
      setLoading(false)
    }
    loadEvent()
  }, [code])

  // Debounced Spotify search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.tracks || [])
      }
      setSearching(false)
    }, 400)
  }, [query])

  function selectTrack(track: SpotifyTrack) {
    setSelectedTrack(track)
    setManualTitle(track.name)
    setManualArtist(track.artists.map((a) => a.name).join(', '))
    setStep('confirm')
  }

  function selectManual() {
    if (!manualTitle.trim() || !manualArtist.trim()) return
    setSelectedTrack(null)
    setStep('confirm')
  }

  async function submitRequest() {
    setSubmitting(true)
    setSubmitError('')
    const res = await fetch(`/api/events/${code}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songTitle: manualTitle.trim(),
        artistName: manualArtist.trim(),
        spotifyTrackId: selectedTrack?.id,
        note: note.trim() || undefined,
        honeypot,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setRequestId(data.id)
      setStep('sent')
    } else {
      const data = await res.json()
      setSubmitError(data.error || 'Failed to submit')
    }
    setSubmitting(false)
  }

  async function handleTip(amount: number) {
    if (!event) return
    setTipping(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        amount: amount * 100, // cents
        requestId: requestId || undefined,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
    }
    setTipping(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">😕</div>
          <p className="text-zinc-400">{error || 'Event not found'}</p>
        </div>
      </div>
    )
  }

  if (!event.acceptingRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">⏸️</div>
          <h1 className="text-xl font-bold">{event.djName}</h1>
          <p className="text-zinc-400">Requests are currently paused. Check back soon!</p>
        </div>
      </div>
    )
  }

  // Success screen
  if (step === 'sent') {
    const tipValues = event.tipAmounts.split(',').map((v) => parseInt(v.trim(), 10)).filter(Boolean)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="space-y-2">
            <div className="text-5xl">🎶</div>
            <h2 className="text-2xl font-bold">{justTipped ? 'Thanks for the tip!' : 'Request Sent!'}</h2>
            <p className="text-zinc-400">
              {event.djName} will see your request.
            </p>
          </div>

          {/* Tip options */}
          {tipValues.length > 0 && !justTipped && (
            <div className="card space-y-4">
              <p className="text-sm text-zinc-300">Want to tip the DJ?</p>
              <div className="grid grid-cols-3 gap-2">
                {tipValues.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleTip(amount)}
                    disabled={tipping}
                    className="btn btn-secondary py-3 text-lg"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              {event.venmoUsername && (
                <a
                  href={`https://venmo.com/${event.venmoUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:text-blue-300 text-sm"
                >
                  Or tip via Venmo →
                </a>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setStep('search')
              setQuery('')
              setResults([])
              setSelectedTrack(null)
              setManualTitle('')
              setManualArtist('')
              setNote('')
              setRequestId('')
            }}
            className="btn btn-primary w-full"
          >
            Request Another Song
          </button>
        </div>
      </div>
    )
  }

  // Confirm screen
  if (step === 'confirm') {
    return (
      <div className="min-h-screen p-6 max-w-md mx-auto space-y-6 pt-12">
        <button onClick={() => setStep('search')} className="text-zinc-400 hover:text-white text-sm">
          ← Change song
        </button>

        <div className="card space-y-4">
          {selectedTrack && selectedTrack.album.images[0] && (
            <img
              src={selectedTrack.album.images[0].url}
              alt=""
              className="w-24 h-24 rounded-lg mx-auto"
            />
          )}
          <div className="text-center">
            <p className="font-bold text-lg">{manualTitle}</p>
            <p className="text-zinc-400">{manualArtist}</p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            className="input resize-none h-20"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
          {/* Honeypot — hidden from users */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="absolute opacity-0 pointer-events-none"
            tabIndex={-1}
            autoComplete="off"
          />
          {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
          <button
            onClick={submitRequest}
            disabled={submitting}
            className="btn btn-primary w-full text-lg py-3"
          >
            {submitting ? 'Sending...' : 'Send Request 🎵'}
          </button>
        </div>
      </div>
    )
  }

  // Search screen (default)
  return (
    <div className="min-h-screen p-6 max-w-md mx-auto space-y-6 pt-12">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">{event.djName}</h1>
        <p className="text-zinc-400 text-sm">Request a song</p>
      </div>

      {/* Spotify search */}
      <input
        className="input text-lg"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {searching && (
        <p className="text-zinc-500 text-sm text-center animate-pulse">Searching...</p>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => selectTrack(track)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left"
            >
              {track.album.images[2] && (
                <img src={track.album.images[2].url} alt="" className="w-10 h-10 rounded" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-zinc-400 text-sm truncate">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Manual entry */}
      {query.length === 0 && results.length === 0 && (
        <div className="card space-y-3">
          <p className="text-zinc-400 text-sm">Or enter manually:</p>
          <input
            className="input"
            placeholder="Song title"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="Artist"
            value={manualArtist}
            onChange={(e) => setManualArtist(e.target.value)}
          />
          <button
            onClick={selectManual}
            disabled={!manualTitle.trim() || !manualArtist.trim()}
            className="btn btn-primary w-full"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
