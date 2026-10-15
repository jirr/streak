import { format } from 'date-fns'

export function toDayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}
