import { z } from 'zod'

export const createEventSchema = z.object({
  djName: z.string().min(1, 'DJ name is required').max(100),
  djPhone: z.string().min(10, 'Phone number must be at least 10 characters'),
  venmoUsername: z.string().optional(),
  spotifyPlaylistId: z.string().optional(),
  tipAmounts: z.string().optional(),
})

export const createRequestSchema = z.object({
  songTitle: z.string().min(1, 'Song title is required').max(200),
  artistName: z.string().min(1, 'Artist name is required').max(200),
  spotifyTrackId: z.string().optional(),
  note: z.string().max(500).optional(),
  honeypot: z.string().optional().refine((val) => !val, { message: 'Bot detected' }),
})

export const createCheckoutSchema = z.object({
  eventId: z.string().min(1),
  amount: z.number().min(100, 'Minimum tip is $1.00').max(100000),
  requestId: z.string().optional(),
})
