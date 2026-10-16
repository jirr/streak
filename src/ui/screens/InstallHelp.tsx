import { Check, Share, SquarePlus } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n.ts'
import { PageHeader } from '../components/PageHeader.tsx'
import styles from './InstallHelp.module.css'

const STEP_ICONS = [Share, SquarePlus, Check]

export function InstallHelp() {
  const { t } = useI18n()
  return (
    <main className={styles.page}>
      <PageHeader title={t.installHelp.title} back="/account" />
      <ol className={styles.steps}>
        {t.installHelp.steps.map((text, i) => {
          const Icon = STEP_ICONS[i]
          return (
            <li key={text} className={styles.step}>
              <span className={styles.icon}>
                <Icon size={24} />
              </span>
              <span>
                <strong>{i + 1}.</strong> {text}
              </span>
            </li>
          )
        })}
      </ol>
      <p className={styles.callout}>{t.installHelp.callout}</p>
      <p className={styles.note}>{t.installHelp.note}</p>
    </main>
  )
}
