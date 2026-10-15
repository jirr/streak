import type { Periodicity, Series, SeriesKind, SeriesStats } from './types.ts'

/** « 0 jour », « 1 jour », « 2 jours » ; pluriel à partir de 2. */
export function unitLabel(p: Periodicity, n: number): string {
  const plural = n >= 2
  switch (p) {
    case 'daily':
      return plural ? 'jours' : 'jour'
    case 'weekly':
      return plural ? 'semaines' : 'semaine'
    case 'monthly':
      return 'mois'
  }
}

export function bestLabel(n: number): string {
  return `Best : ${n}`
}

export function doneLabel(kind: SeriesKind): string {
  return kind === 'habit' ? 'Fait' : 'Tenu'
}

export function confirmSubtitle(series: Pick<Series, 'kind' | 'title'>, isYesterday: boolean): string {
  const verb = series.kind === 'habit' ? 'fait' : 'tenu'
  return `Tu as ${verb} « ${series.title} » ${isYesterday ? 'hier' : "aujourd'hui"}.`
}

/** « 2/3 cette semaine » pour weekly/monthly avec cible > 1, sinon null. */
export function progressLabel(stats: Pick<SeriesStats, 'progress'>, p: Periodicity): string | null {
  const { count, target } = stats.progress
  if (p === 'daily' || target <= 1) return null
  return `${count}/${target} ${p === 'weekly' ? 'cette semaine' : 'ce mois'}`
}

/** Libellé de la période validée (bouton désactivé). */
export function validatedPeriodLabel(p: Periodicity): string {
  return p === 'weekly' ? 'Semaine validée' : p === 'monthly' ? 'Mois validé' : 'Validé'
}
