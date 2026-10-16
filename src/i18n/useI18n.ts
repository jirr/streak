import { enUS, fr } from 'date-fns/locale'
import type { Locale as DateLocale } from 'date-fns'
import { useAppStore } from '../app/store.ts'
import { resolveLocale } from '../domain/locale.ts'
import type { Locale } from '../domain/types.ts'
import { MESSAGES, type Messages } from './messages.ts'

export const DATE_LOCALES: Record<Locale, DateLocale> = { fr, en: enUS }

export function systemLanguages(): readonly string[] {
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

/** Langue effective (réglage « Langue » de Mon compte, ou celle du système) et textes associés. */
export function useI18n(): { locale: Locale; t: Messages } {
  const pref = useAppStore((s) => s.settings.language)
  const locale = resolveLocale(pref, systemLanguages())
  return { locale, t: MESSAGES[locale] }
}
