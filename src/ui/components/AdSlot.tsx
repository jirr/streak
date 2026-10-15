import styles from './AdSlot.module.css'

interface Props {
  placement: 'home-bottom'
}

/** Emplacement publicitaire réservé (aucune régie branchée en V0). */
export function AdSlot({ placement }: Props) {
  return (
    <div className={styles.slot} data-placement={placement} aria-hidden>
      ESPACE PUBLICITAIRE
    </div>
  )
}
