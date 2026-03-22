const MAX_DURATION_MINUTES: Record<string, number> = {
  bo1: 90,    // 1.5 hours
  bo3: 210,   // 3.5 hours
  bo5: 330,   // 5.5 hours
}
const BUFFER_MINUTES = 30

export function calculateSafeRevealTime(
  format: 'bo1' | 'bo3' | 'bo5',
  scheduledStart: Date,
  actualStart?: Date | null
): Date {
  const effectiveStart = actualStart ?? scheduledStart
  const minutes = MAX_DURATION_MINUTES[format] + BUFFER_MINUTES
  return new Date(effectiveStart.getTime() + minutes * 60 * 1000)
}

export function fallbackRevealTime(uploadTime: Date, hoursDelay: number = 6): Date {
  return new Date(uploadTime.getTime() + hoursDelay * 60 * 60 * 1000)
}

export function isRevealSafe(safeRevealTime: Date, now: Date = new Date()): boolean {
  return now >= safeRevealTime
}
