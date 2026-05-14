export const DEFAULT_TIME_ZONE = 'Asia/Kolkata'

export function resolveTimeZone(timeZone?: string): string {
  const candidate = timeZone?.trim()
  if (!candidate) return DEFAULT_TIME_ZONE

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate })
    return candidate
  } catch {
    return DEFAULT_TIME_ZONE
  }
}
