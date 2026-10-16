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
  it('chaque catégorie est connue dans les deux langues', () => {
    for (const p of PRESETS) {
      expect(CATEGORY_LABELS[p.category].fr).toBeTruthy()
      expect(CATEGORY_LABELS[p.category].en).toBeTruthy()
      expect(CATEGORY_TINT[p.category]).toBeTruthy()
    }
  })
  it('chaque preset a un titre (≤ 60 car.) et une accroche dans les deux langues', () => {
    for (const p of PRESETS) {
      for (const locale of ['fr', 'en'] as const) {
        const { title, tagline } = p.text[locale]
        expect(title.length, `${p.id} ${locale}`).toBeGreaterThan(0)
        expect(title.length, `${p.id} ${locale}`).toBeLessThanOrEqual(60)
        expect(tagline.length, `${p.id} ${locale}`).toBeGreaterThan(0)
      }
    }
  })
  it('puces mises en avant dans l’ordre', () => {
    expect(FEATURED_PRESETS.map((p) => p.text.fr.chip)).toEqual(['Sans alcool', 'Sans tabac', 'Sport', 'Lecture', 'Méditation', 'Sans sucre'])
    expect(FEATURED_PRESETS.map((p) => p.text.en.chip)).toEqual(['No alcohol', 'No tobacco', 'Exercise', 'Reading', 'Meditation', 'No sugar'])
  })
  it('presets weekly/monthly avec cible', () => {
    expect(PRESETS.find((p) => p.id === 'sport-3-week')).toMatchObject({ periodicity: 'weekly', target: 3 })
    expect(PRESETS.find((p) => p.id === 'call-grandma')).toMatchObject({ periodicity: 'monthly', target: 1 })
  })
})
