import { Crown } from 'lucide-react'
import { format } from 'date-fns'
import { useMemo, type ReactNode } from 'react'
import { useAppStore } from '../../app/store.ts'
import { useSeriesStats } from '../../app/useSeriesStats.ts'
import { buildHallOfFame, type HallRun } from '../../domain/hallOfFame.ts'
import { unitLabel } from '../../domain/labels.ts'
import { parseDayKey } from '../../domain/periods.ts'
import type { Locale, Series } from '../../domain/types.ts'
import { DATE_LOCALES, useI18n } from '../../i18n/useI18n.ts'
import type { Messages } from '../../i18n/messages.ts'
import { Button } from '../components/Button.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import styles from './HallOfFame.module.css'

function formatRange(startDayKey: string, endDayKey: string, locale: Locale, t: Messages): string {
  const fmt = (k: string) => format(parseDayKey(k), t.hall.dateFormat, { locale: DATE_LOCALES[locale] })
  return startDayKey === endDayKey ? t.hall.single(fmt(startDayKey)) : t.hall.range(fmt(startDayKey), fmt(endDayKey))
}

function Tile({ series }: { series: Series }) {
  return (
    <span className={styles.tile} style={{ background: `var(--tint-${series.color ?? 'orange'})` }} aria-hidden>
      {series.icon}
    </span>
  )
}

function Section({ title, empty, children, isEmpty }: { title: string; empty: string; children: ReactNode; isEmpty: boolean }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {isEmpty ? <p className={styles.empty}>{empty}</p> : <ol className={styles.rows}>{children}</ol>}
    </section>
  )
}

function RunRow({ entry, rank }: { entry: HallRun; rank?: number }) {
  const { series, run } = entry
  const { locale, t } = useI18n()
  return (
    <li className={styles.row} data-testid="hall-run">
      {rank !== undefined ? (
        <span className={styles.rank} aria-label={t.hall.rank(rank)}>
          {rank === 1 ? <Crown size={20} color="var(--accent)" /> : rank}
        </span>
      ) : null}
      <Tile series={series} />
      <span className={styles.rowText}>
        <strong>{series.title}</strong>
        <small>{formatRange(run.startDayKey, run.endDayKey, locale, t)}</small>
      </span>
      <span className={styles.rowRight}>
        <span className={styles.length}>
          {run.length} {unitLabel(series.periodicity, run.length, locale)}
        </span>
        {run.active ? <span className={`${styles.pill} ${styles.pillActive}`}>{t.hall.active}</span> : null}
        {series.archivedAt ? <span className={styles.pill}>{t.hall.archived}</span> : null}
      </span>
    </li>
  )
}

export function HallOfFame() {
  const series = useAppStore((s) => s.series)
  const unarchiveSeries = useAppStore((s) => s.unarchiveSeries)
  const { stats } = useSeriesStats()
  const { locale, t } = useI18n()
  const hall = useMemo(() => buildHallOfFame(series, stats), [series, stats])

  return (
    <main className={styles.page}>
      <PageHeader title="Hall of fame" icon={<Crown size={28} color="var(--accent)" />} />

      <Section title={t.hall.top} empty={t.hall.topEmpty} isEmpty={hall.top.length === 0}>
        {hall.top.map((e, i) => (
          <RunRow key={`${e.series.id}-${e.run.startDayKey}`} entry={e} rank={i + 1} />
        ))}
      </Section>

      <Section title={t.hall.current} empty={t.hall.currentEmpty} isEmpty={hall.current.length === 0}>
        {hall.current.map(({ series: s, current }) => (
          <li key={s.id} className={styles.row} data-testid="hall-current">
            <Tile series={s} />
            <span className={styles.rowText}>
              <strong>{s.title}</strong>
            </span>
            <span className={styles.length}>
              {current} {unitLabel(s.periodicity, current, locale)}
            </span>
          </li>
        ))}
      </Section>

      <Section
        title={t.hall.past}
        empty={t.hall.pastEmpty}
        isEmpty={hall.past.length === 0 && hall.archived.length === 0}
      >
        {hall.archived.map((s) => (
          <li key={s.id} className={styles.row} data-testid="hall-archived">
            <Tile series={s} />
            <span className={styles.rowText}>
              <strong>{s.title}</strong>
              <small>{t.hall.archived}</small>
            </span>
            <Button variant="secondary" onClick={() => void unarchiveSeries(s.id)} aria-label={t.hall.relaunchAria(s.title)}>
              {t.hall.relaunch}
            </Button>
          </li>
        ))}
        {hall.past.map((e) => (
          <RunRow key={`${e.series.id}-${e.run.startDayKey}`} entry={e} />
        ))}
      </Section>
    </main>
  )
}
