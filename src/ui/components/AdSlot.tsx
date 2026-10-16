import { useI18n } from '../../i18n/useI18n.ts'
import styles from './AdSlot.module.css'

interface Props {
  placement: 'home-bottom'
}

/** Emplacement publicitaire réservé (aucune régie branchée en V0). */
export function AdSlot({ placement }: Props) {
  const { t } = useI18n()
  return (
    <div className={styles.slot} data-placement={placement} aria-hidden>
      {t.common.adSpace}
    </div>
  )
}
