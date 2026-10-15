import { describe, expect, it } from 'vitest'
import { EMOJI_GRID, QUICK_EMOJIS, isSingleEmoji } from './emoji.ts'

describe('isSingleEmoji', () => {
  it('accepte emoji simples, composés et avec variation', () => {
    expect(isSingleEmoji('🍸')).toBe(true)
    expect(isSingleEmoji('🏋️')).toBe(true)
    expect(isSingleEmoji('👨‍👩‍👧')).toBe(true)
  })
  it('refuse vide, texte, plusieurs emojis', () => {
    expect(isSingleEmoji('')).toBe(false)
    expect(isSingleEmoji('a')).toBe(false)
    expect(isSingleEmoji('🍸🍸')).toBe(false)
    expect(isSingleEmoji('🍸a')).toBe(false)
  })
  it('catalogue : 64 emojis valides', () => {
    expect(EMOJI_GRID).toHaveLength(64)
    for (const e of [...EMOJI_GRID, ...QUICK_EMOJIS]) expect(isSingleEmoji(e), e).toBe(true)
  })
})
