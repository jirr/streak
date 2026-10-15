import { Crown } from 'lucide-react'
import { useEffect, type CSSProperties } from 'react'
import styles from './Celebration.module.css'

const COLORS = ['var(--accent)', 'var(--success)', 'var(--tint-yellow)', 'var(--tint-blue)', 'var(--tint-purple)', 'var(--tint-green)']
const COUNT = 24
const DURATION_MS = 2200

interface Props {
  message: string
  record: boolean
  onDone: () => void
}

/** Burst de confettis CSS + message ; les confettis sont masqués si prefers-reduced-motion. */
export function Celebration({ message, record, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, DURATION_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.confetti} aria-hidden>
        {Array.from({ length: COUNT }, (_, i) => {
          const angle = (i / COUNT) * 2 * Math.PI
          const dist = 110 + (i % 4) * 40
          const style = {
            '--dx': `${Math.round(Math.cos(angle) * dist)}px`,
            '--dy': `${Math.round(Math.sin(angle) * dist - 60)}px`,
            '--rot': `${(i * 67) % 360}deg`,
            '--delay': `${(i % 6) * 20}ms`,
            background: COLORS[i % COLORS.length],
          } as CSSProperties
          return <span key={i} className={styles.piece} style={style} />
        })}
      </div>
      <div className={record ? `${styles.message} ${styles.record}` : styles.message}>
        {record ? <Crown size={28} /> : null}
        <span>{message}</span>
      </div>
    </div>
  )
}
