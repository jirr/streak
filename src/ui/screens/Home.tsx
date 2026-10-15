import { LayoutGrid, List } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppStore } from '../../app/store.ts'
import { useSeriesStats } from '../../app/useSeriesStats.ts'
import { shouldNudgeBackup } from '../../domain/backup.ts'
import { canUndo, nextCheckTarget, type CheckTarget } from '../../domain/checkins.ts'
import { confirmSubtitle, progressLabel, unitLabel } from '../../domain/labels.ts'
import type { Series } from '../../domain/types.ts'
import { AdSlot } from '../components/AdSlot.tsx'
import { Banner } from '../components/Banner.tsx'
import { Button } from '../components/Button.tsx'
import { Celebration } from '../components/Celebration.tsx'
import { DoubleConfirm } from '../components/DoubleConfirm.tsx'
import { NewSeriesCard, SeriesCard } from '../components/SeriesCard.tsx'
import { Sheet } from '../components/Sheet.tsx'
import styles from './Home.module.css'

interface PendingCheck {
  series: Series
  target: CheckTarget
}

interface CelebrationState {
  message: string
  record: boolean
}

export function Home() {
  const navigate = useNavigate()
  const pseudo = useAppStore((s) => s.profile?.pseudo)
  const settings = useAppStore((s) => s.settings)
  const series = useAppStore((s) => s.series)
  const checkIns = useAppStore((s) => s.checkIns)
  const checkIn = useAppStore((s) => s.checkIn)
  const undoCheckIn = useAppStore((s) => s.undoCheckIn)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const { now, stats } = useSeriesStats()

  const [pending, setPending] = useState<PendingCheck | null>(null)
  const [undoTarget, setUndoTarget] = useState<Series | null>(null)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)

  const showBackupNudge = shouldNudgeBackup(checkIns.length, settings, now)
  const view = settings.viewMode
  const active = series.filter((s) => !s.archivedAt)
  const closeCelebration = useCallback(() => setCelebration(null), [])

  const onAction = (s: Series) => {
    const target = nextCheckTarget(s, checkIns, now, settings.graceHour)
    if (target) {
      setPending({ series: s, target })
      return
    }
    if (stats.get(s.id)?.checkedToday && checkIns.some((c) => c.seriesId === s.id && canUndo(c, now))) {
      setUndoTarget(s)
    }
  }

  const confirmCheck = async () => {
    if (!pending) return
    const { series: s, target } = pending
    try {
      const { stats: after, recordBroken } = await checkIn(s.id, target.dayKey)
      const unit = unitLabel(s.periodicity, after.current)
      const partial = after.status === 'done' ? null : progressLabel(after, s.periodicity)
      setCelebration({
        record: recordBroken,
        message: recordBroken
          ? `Nouveau record : ${after.current} ${unit} !`
          : (partial ?? `+1 ! ${after.current} ${unit}`),
      })
      setPulseId(recordBroken ? s.id : null)
    } catch (e) {
      // Fenêtre dépassée entre l'ouverture et la confirmation : on referme sans bruit.
      console.warn(e)
    }
    setPending(null)
  }

  const toggle = (mode: 'grid' | 'list', Icon: typeof List, label: string) => (
    <button
      type="button"
      className={view === mode ? `${styles.toggle} ${styles.toggleActive}` : styles.toggle}
      aria-label={label}
      aria-pressed={view === mode}
      onClick={() => void updateSettings({ viewMode: mode })}
    >
      <Icon size={20} />
    </button>
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>Salut {pseudo}</p>
          <h1 className={styles.title}>Mes séries</h1>
        </div>
        {active.length > 0 ? (
          <div className={styles.toggles}>
            {toggle('grid', LayoutGrid, 'Vue grille')}
            {toggle('list', List, 'Vue liste')}
          </div>
        ) : null}
      </header>

      {showBackupNudge ? (
        <div className={styles.nudge}>
          <Banner
            action={
              <Link to="/account" className={styles.bannerLink}>
                Sauvegarder
              </Link>
            }
            onDismiss={() => void updateSettings({ backupNudgeDismissedAt: now.toISOString() })}
          >
            Pense à sauvegarder tes données.
          </Banner>
        </div>
      ) : null}

      {active.length === 0 ? <p className={styles.empty}>Lance ta première série.</p> : null}

      <div className={view === 'grid' ? styles.grid : styles.list}>
        {active.map((s) => {
          const st = stats.get(s.id)
          if (!st) return null
          return (
            <SeriesCard
              key={s.id}
              series={s}
              stats={st}
              graceHour={settings.graceHour}
              target={nextCheckTarget(s, checkIns, now, settings.graceHour)}
              view={view}
              pulse={pulseId === s.id}
              onOpen={() => navigate(`/series/${s.id}/edit`)}
              onAction={() => onAction(s)}
            />
          )
        })}
        <NewSeriesCard view={view} onClick={() => navigate('/series/new')} />
      </div>

      <AdSlot placement="home-bottom" />

      <DoubleConfirm
        open={pending !== null}
        subtitle={pending ? confirmSubtitle(pending.series, pending.target.isYesterday) : ''}
        onConfirm={confirmCheck}
        onCancel={() => setPending(null)}
      />

      <Sheet open={undoTarget !== null} onClose={() => setUndoTarget(null)} title="Annuler la coche ?">
        <div className={styles.sheetActions}>
          <Button
            fullWidth
            onClick={async () => {
              if (undoTarget) await undoCheckIn(undoTarget.id)
              setUndoTarget(null)
            }}
          >
            Oups, je me suis trompé
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setUndoTarget(null)}>
            Non, c'est bon
          </Button>
        </div>
      </Sheet>

      {celebration ? <Celebration {...celebration} onDone={closeCelebration} /> : null}
    </main>
  )
}
