import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './Banner.module.css'

interface Props {
  children: ReactNode
  /** Ex. pastille du nombre de séries à cocher. */
  badge?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  tone?: 'neutral' | 'accent'
}

export function Banner({ children, badge, action, onDismiss, tone = 'neutral' }: Props) {
  const { t } = useI18n()
  return (
    <div className={tone === 'accent' ? `${styles.banner} ${styles.accent}` : styles.banner}>
      {badge ? <span className={styles.badge}>{badge}</span> : null}
      <span className={styles.text}>{children}</span>
      {action}
      {onDismiss ? (
        <button type="button" className={styles.close} onClick={onDismiss} aria-label={t.common.close}>
          <X size={18} />
        </button>
      ) : null}
    </div>
  )
}
