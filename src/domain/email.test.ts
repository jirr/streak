import { describe, expect, it } from 'vitest'
import { isValidEmail } from './email.ts'

describe('isValidEmail', () => {
  it('accepte une adresse usuelle', () => {
    expect(isValidEmail('baptiste@example.com')).toBe(true)
    expect(isValidEmail('a.b+tag@mail.example.fr')).toBe(true)
  })
  it('refuse les formes invalides', () => {
    for (const s of ['', 'baptiste', 'a@b', '@example.com', 'a b@example.com', 'a@@example.com']) {
      expect(isValidEmail(s), s).toBe(false)
    }
  })
})
