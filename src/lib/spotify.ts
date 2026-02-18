export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  albumArt: string
  previewUrl: string | null
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

export async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!res.ok) return null

    const data = await res.json()
    cachedToken = data.access_token
    tokenExpiresAt = Date.now() + data.expires_in * 1000
    return cachedToken
  } catch {
    return null
  }
}

export async function searchSpotify(query: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const params = new URLSearchParams({ q: query, type: 'track', limit: '10' })
    const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) return []

    const data = await res.json()
    return (data.tracks?.items ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => ({
        id: t.id,
        name: t.name,
        artist: t.artists.map((a: { name: string }) => a.name).join(', '),
        albumArt: t.album.images[0]?.url ?? '',
        previewUrl: t.preview_url,
      })
    )
  } catch {
    return []
  }
}
