import type { Locale, Periodicity, Series, SeriesKind, SeriesStats } from './types.ts'

const UNITS: Record<Locale, Record<Periodicity, [singular: string, plural: string]>> = {
  fr: { daily: ['jour', 'jours'], weekly: ['semaine', 'semaines'], monthly: ['mois', 'mois'] },
  en: { daily: ['day', 'days'], weekly: ['week', 'weeks'], monthly: ['month', 'months'] },
}

/** fr : pluriel à partir de 2 (« 0 jour ») ; en : singulier seulement pour 1 (« 0 days »). */
export function unitLabel(p: Periodicity, n: number, locale: Locale): string {
  const plural = locale === 'fr' ? n >= 2 : n !== 1
  return UNITS[locale][p][plural ? 1 : 0]
}

export function bestLabel(n: number, locale: Locale): string {
  return locale === 'fr' ? `Best : ${n}` : `Best: ${n}`
}

const DONE: Record<Locale, Record<SeriesKind, string>> = {
  fr: { habit: 'Fait', abstinence: 'Tenu' },
  en: { habit: 'Done', abstinence: 'Held' },
}

export function doneLabel(kind: SeriesKind, locale: Locale): string {
  return DONE[locale][kind]
}

export function confirmSubtitle(
  series: Pick<Series, 'kind' | 'title'>,
  isYesterday: boolean,
  locale: Locale,
): string {
  if (locale === 'fr') {
    const verb = series.kind === 'habit' ? 'fait' : 'tenu'
    return `Tu as ${verb} « ${series.title} » ${isYesterday ? 'hier' : "aujourd'hui"}.`
  }
  const verb = series.kind === 'habit' ? 'did' : 'stuck to'
  return `You ${verb} “${series.title}” ${isYesterday ? 'yesterday' : 'today'}.`
}

/** « 2/3 cette semaine » pour weekly/monthly avec cible > 1, sinon null. */
export function progressLabel(stats: Pick<SeriesStats, 'progress'>, p: Periodicity, locale: Locale): string | null {
  const { count, target } = stats.progress
  if (p === 'daily' || target <= 1) return null
  const period =
    locale === 'fr' ? (p === 'weekly' ? 'cette semaine' : 'ce mois') : p === 'weekly' ? 'this week' : 'this month'
  return `${count}/${target} ${period}`
}

const VALIDATED: Record<Locale, Record<Periodicity, string>> = {
  fr: { daily: 'Validé', weekly: 'Semaine validée', monthly: 'Mois validé' },
  en: { daily: 'Done', weekly: 'Week done', monthly: 'Month done' },
}

/** Libellé de la période validée (bouton désactivé). */
export function validatedPeriodLabel(p: Periodicity, locale: Locale): string {
  return VALIDATED[locale][p]
}
