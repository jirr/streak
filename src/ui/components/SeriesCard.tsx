import { Check, Plus } from 'lucide-react'
import type { CheckTarget } from '../../domain/checkins.ts'
import { bestLabel, doneLabel, progressLabel, unitLabel, validatedPeriodLabel } from '../../domain/labels.ts'
import type { Locale, Series, SeriesStats } from '../../domain/types.ts'
import { useI18n } from '../../i18n/useI18n.ts'
import type { Messages } from '../../i18n/messages.ts'
import styles from './SeriesCard.module.css'

type ActionState = 'todo' | 'done' | 'validated'

interface Props {
  series: Series
  stats: SeriesStats
  graceHour: number
  /** Prochain jour à cocher (null si rien à cocher). */
  target: CheckTarget | null
  view: 'grid' | 'list'
  pulse?: boolean
  onOpen: () => void
  onAction: () => void
}

function actionState(stats: SeriesStats, target: CheckTarget | null): ActionState {
  if (target) return 'todo'
  return stats.checkedToday ? 'done' : 'validated'
}

function actionLabel(series: Series, state: ActionState, locale: Locale, t: Messages): string {
  if (state === 'todo') return t.card.check
  if (state === 'done') return `${doneLabel(series.kind, locale)} ✓`
  return validatedPeriodLabel(series.periodicity, locale)
}

export function SeriesCard({ series, stats, graceHour, target, view, pulse, onOpen, onAction }: Props) {
  const { locale, t } = useI18n()
  const state = actionState(stats, target)
  const label = actionLabel(series, state, locale, t)
  const unit = unitLabel(series.periodicity, stats.current, locale)
  const bestUnit = unitLabel(series.periodicity, stats.best, locale)
  const status =
    stats.status === 'atRisk' ? t.card.atRisk(graceHour) : progressLabel(stats, series.periodicity, locale)
  const tint = `var(--tint-${series.color ?? 'orange'})`
  const checkedClass = state === 'done' ? styles.checked : ''
  const pulseClass = pulse ? styles.pulse : ''

  if (view === 'list') {
    return (
      <article className={`${styles.listCard} ${checkedClass} ${pulseClass}`}>
        <button type="button" className={styles.listBody} onClick={onOpen} aria-label={t.card.edit(series.title)}>
          <span className={styles.listCount}>
            <span className={styles.countNum}>{stats.current}</span>
            <span className={styles.countUnit}>{unit}</span>
          </span>
          <span className={styles.listText}>
            <span className={styles.title}>{series.title}</span>
            <span className={styles.best}>
              {bestLabel(stats.best, locale)} {bestUnit}
            </span>
            {status ? <span className={`${styles.status} ${stats.status === 'atRisk' ? styles.risk : ''}`}>{status}</span> : null}
          </span>
          <span className={styles.tile} style={{ background: tint }} aria-hidden>
            {series.icon}
          </span>
        </button>
        <button
          type="button"
          className={`${styles.round} ${styles[`round_${state}`]}`}
          aria-label={`${label} — ${series.title}`}
          disabled={state === 'validated'}
          onClick={onAction}
        >
          <Check size={22} strokeWidth={3} />
        </button>
      </article>
    )
  }

  return (
    <article className={`${styles.card} ${checkedClass} ${pulseClass}`}>
      <button type="button" className={styles.body} onClick={onOpen} aria-label={t.card.edit(series.title)}>
        <span className={styles.top}>
          <span className={styles.tile} style={{ background: tint }} aria-hidden>
            {series.icon}
          </span>
          <span className={styles.best}>{bestLabel(stats.best, locale)}</span>
        </span>
        <span className={styles.count}>
          <span className={styles.countNum}>{stats.current}</span>
          <span className={styles.countUnit}>{unit}</span>
        </span>
        <span className={styles.title}>{series.title}</span>
        <span className={`${styles.status} ${stats.status === 'atRisk' ? styles.risk : ''}`}>{status}</span>
      </button>
      <button
        type="button"
        className={`${styles.action} ${styles[`action_${state}`]}`}
        aria-label={`${label} — ${series.title}`}
        disabled={state === 'validated'}
        onClick={onAction}
      >
        {label}
      </button>
    </article>
  )
}

export function NewSeriesCard({ view, onClick }: { view: 'grid' | 'list'; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <button type="button" className={view === 'grid' ? styles.newGrid : styles.newList} onClick={onClick}>
      <Plus size={22} />
      <span>{view === 'grid' ? t.card.newGrid : t.card.newList}</span>
    </button>
  )
}
