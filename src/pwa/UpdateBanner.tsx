import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../i18n/useI18n.ts'
import styles from './UpdateBanner.module.css'

const HOUR_MS = 60 * 60 * 1000

export function UpdateBanner() {
  const { t } = useI18n()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), HOUR_MS)
    },
  })

  if (!needRefresh) return null
  return (
    <div className={styles.banner} role="status">
      <span>{t.update.available}</span>
      <button type="button" className={styles.button} onClick={() => void updateServiceWorker(true)}>
        {t.update.reload}
      </button>
    </div>
  )
}
