import { useAppStore } from '../app/store.ts'
import type { LanguagePref } from '../domain/types.ts'

/** Force la langue de l'UI pour un test de composant (jsdom expose navigator.language = 'en-US'). */
export function setLanguage(language: LanguagePref): void {
  useAppStore.setState((s) => ({ settings: { ...s.settings, language } }))
}
