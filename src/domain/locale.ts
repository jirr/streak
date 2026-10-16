import type { LanguagePref, Locale } from './types.ts'

/** Langue effective : choix explicite, sinon la première langue système supportée, sinon l'anglais. */
export function resolveLocale(pref: LanguagePref, systemLanguages: readonly string[]): Locale {
  if (pref !== 'system') return pref
  for (const tag of systemLanguages) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'fr' || base === 'en') return base
  }
  return 'en'
}
