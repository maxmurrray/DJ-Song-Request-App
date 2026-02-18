'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-3">
          <div className="text-6xl">🎵</div>
          <h1 className="text-4xl font-bold tracking-tight">QR Song Requests</h1>
          <p className="text-zinc-400 text-lg">
            Scan. Search. Request. The easiest way to get your song played.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link
            href="/admin"
            className="btn btn-primary w-full block text-center text-lg py-3"
          >
            DJ Dashboard
          </Link>
          <p className="text-zinc-600 text-sm">
            Create events, generate QR codes, and manage requests.
          </p>
        </div>
      </div>
    </div>
  )
}
