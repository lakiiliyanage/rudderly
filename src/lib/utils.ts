import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function relativeTime(dateStr: string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffMs = new Date(dateStr).getTime() - Date.now()
  const abs = Math.abs(diffMs)

  if (abs < 60_000)         return rtf.format(Math.round(diffMs / 1_000),         'second')
  if (abs < 3_600_000)      return rtf.format(Math.round(diffMs / 60_000),         'minute')
  if (abs < 86_400_000)     return rtf.format(Math.round(diffMs / 3_600_000),      'hour')
  if (abs < 604_800_000)    return rtf.format(Math.round(diffMs / 86_400_000),     'day')
  if (abs < 2_592_000_000)  return rtf.format(Math.round(diffMs / 604_800_000),    'week')
  if (abs < 31_536_000_000) return rtf.format(Math.round(diffMs / 2_592_000_000), 'month')
  return rtf.format(Math.round(diffMs / 31_536_000_000), 'year')
}
