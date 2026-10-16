import { describe, expect, it } from 'vitest'
import { resolveLocale } from './locale.ts'

describe('resolveLocale', () => {
  it('un choix explicite l’emporte sur le système', () => {
    expect(resolveLocale('en', ['fr-FR'])).toBe('en')
    expect(resolveLocale('fr', ['en-US'])).toBe('fr')
  })
  it('système : première langue supportée dans l’ordre de préférence', () => {
    expect(resolveLocale('system', ['fr-CA', 'en'])).toBe('fr')
    expect(resolveLocale('system', ['de-DE', 'en-GB', 'fr'])).toBe('en')
    expect(resolveLocale('system', ['es', 'FR'])).toBe('fr')
  })
  it('système sans langue supportée : anglais', () => {
    expect(resolveLocale('system', ['de-DE', 'ja'])).toBe('en')
    expect(resolveLocale('system', [])).toBe('en')
  })
})
