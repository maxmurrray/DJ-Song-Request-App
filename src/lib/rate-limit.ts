interface Entry { count: number; resetTime: number }

const map = new Map<string, Entry>()

// Clean up every 5 minutes
let timer: ReturnType<typeof setInterval> | null = null
function startCleanup() {
  if (timer) return
  timer = setInterval(() => {
    const now = Date.now()
    map.forEach((entry, ip) => {
      if (now >= entry.resetTime) map.delete(ip)
    })
  }, 300_000)
  if (timer && typeof timer === 'object' && 'unref' in timer) timer.unref()
}

export function checkRateLimit(
  ip: string,
  maxRequests = 5,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  startCleanup()
  const now = Date.now()
  const entry = map.get(ip)

  if (!entry || now >= entry.resetTime) {
    map.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count < maxRequests) {
    entry.count++
    return { allowed: true, remaining: maxRequests - entry.count }
  }

  return { allowed: false, remaining: 0 }
}
