import { describe, expect, it } from 'vitest'
import { toDayKey } from './periods.ts'

describe('periods', () => {
  it('toDayKey formate en date locale', () => {
    expect(toDayKey(new Date(2026, 9, 15))).toBe('2026-10-15')
  })
  it('TZ Europe/Paris honoré', () => {
    // 29 mars 2026 : DST => offset -120 (été) ; 1er janvier => -60
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-60)
    expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(-120)
  })
})
