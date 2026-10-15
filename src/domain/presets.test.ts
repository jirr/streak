import { describe, expect, it } from 'vitest'
import { isSingleEmoji } from './emoji.ts'
import { CATEGORY_LABELS, CATEGORY_TINT, FEATURED_PRESETS, PRESETS } from './presets.ts'

describe('presets', () => {
  it('ids uniques', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
  })
  it('chaque emoji est un emoji unique', () => {
    for (const p of PRESETS) expect(isSingleEmoji(p.icon), p.id).toBe(true)
  })
  it('chaque catégorie est connue', () => {
    for (const p of PRESETS) {
      expect(CATEGORY_LABELS[p.category]).toBeTruthy()
      expect(CATEGORY_TINT[p.category]).toBeTruthy()
    }
  })
  it('puces mises en avant dans l’ordre', () => {
    expect(FEATURED_PRESETS.map((p) => p.chip)).toEqual(['Sans alcool', 'Sans tabac', 'Sport', 'Lecture', 'Méditation', 'Sans sucre'])
  })
  it('presets weekly/monthly avec cible', () => {
    const sport = PRESETS.find((p) => p.id === 'sport-3-week')
    expect(sport).toMatchObject({ periodicity: 'weekly', target: 3 })
    expect(PRESETS.find((p) => p.id === 'call-grandma')).toMatchObject({ periodicity: 'monthly', target: 1 })
  })
})
