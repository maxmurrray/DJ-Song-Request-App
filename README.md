# QR Song Requests

A mobile-first web app for DJs to accept song requests via QR code. Guests scan, search, request, and optionally tip — the DJ gets an SMS instantly.

## Features

- **QR Code Events** — Each event gets a unique link + downloadable QR code
- **Spotify Search** — Guests search Spotify's catalog (or enter songs manually)
- **SMS Notifications** — DJ receives a text for every request via Twilio
- **Tips** — Apple Pay / card via Stripe Checkout, Venmo deep link fallback
- **Anti-spam** — Rate limiting + honeypot bot protection
- **Admin Dashboard** — Create events, view requests, toggle accepting on/off

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables) below).

### 3. Initialize the database

```bash
npx prisma migrate dev
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create your first event

1. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
2. Enter the admin password (default: `changeme`)
3. Fill in DJ name, phone number, etc.
4. Download the QR code and share it

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string (`file:./dev.db` for SQLite) |
| `ADMIN_PASSWORD` | Yes | Password to access the admin dashboard |
| `BASE_URL` | Yes | Public URL of the app (e.g., `http://localhost:3000`) |
| `TWILIO_ACCOUNT_SID` | For SMS | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | For SMS | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | For SMS | Twilio phone number (E.164 format) |
| `STRIPE_SECRET_KEY` | For tips | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For tips | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook signing secret |
| `SPOTIFY_CLIENT_ID` | Optional | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Optional | Spotify app client secret |

## Service Setup

### Twilio (SMS)

1. Create an account at [twilio.com](https://www.twilio.com/)
2. Get a phone number from the console
3. Copy Account SID, Auth Token, and the phone number to `.env`

### Stripe (Tips / Apple Pay)

1. Create an account at [stripe.com](https://stripe.com/)
2. Get your API keys from the Dashboard > Developers > API keys
3. Copy the secret key and publishable key to `.env`
4. Apple Pay works automatically when guests use Safari on iPhone — Stripe handles it

### Spotify (Search)

1. Go to [developer.spotify.com](https://developer.spotify.com/)
2. Create an app in the Dashboard
3. Copy Client ID and Client Secret to `.env`
4. If not configured, the app falls back to manual song entry

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

Set all environment variables in the Vercel dashboard.

### Database (Production)

For production, switch from SQLite to PostgreSQL:

1. **Neon** (neon.tech) — Free tier available
2. **Supabase** (supabase.com) — Free tier available

Update `prisma/schema.prisma` datasource provider to `"postgresql"`, then run `npx prisma migrate dev` with your new `DATABASE_URL`.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma** (SQLite dev / PostgreSQL prod)
- **Twilio** (SMS)
- **Stripe** (payments + Apple Pay)
- **Spotify Web API** (song search)
- **qrcode** (QR generation)
- **Zod** (validation)

## Future Improvements

- Moderation queue — DJ approves/rejects requests before they show
- Prioritize by tip — higher tips surface to the top
- Live DJ dashboard — real-time updates via WebSocket/SSE
- Guest names — optional name field for personalized requests
- Profanity filter — auto-flag inappropriate song names or notes
- Song blacklist — DJ pre-blocks specific songs
- Multi-DJ teams — multiple DJs per event with shared queue
- Apple Pay as default — prominent Apple Pay button when on iOS Safari
- Request voting — guests upvote existing requests instead of duplicating
- Playlist mode — DJ marks songs as "played" and guests see the set list
- Analytics — request counts, tip totals, popular songs per event
