import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './DoubleConfirm.module.css'

const DEFAULT_TITLES: [string, string] = ["C'est vrai ?", "T'es pas en train de te mentir à toi-même ?"]
const DEFAULT_FINAL_SUBTITLE = 'Personne ne vérifie. À part toi.'
const DEFAULT_DECLINE = "Pas grave. L'honnêteté, ça compte aussi."
const DECLINE_MS = 1200

interface Props {
  open: boolean
  /** Sous-titre de la 1re étape. */
  subtitle: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  titles?: [string, string]
  /** Sous-titre de la 2e étape ; `null` pour le masquer. */
  finalSubtitle?: string | null
  declineMessage?: string
}

/** Deux « Oui » successifs pour valider ; n'importe quel « Non » annule. */
export function DoubleConfirm(props: Props) {
  // Monté uniquement ouvert : l'état interne repart de zéro à chaque ouverture.
  return props.open ? <Dialog {...props} /> : null
}

function Dialog({
  subtitle,
  onConfirm,
  onCancel,
  titles = DEFAULT_TITLES,
  finalSubtitle = DEFAULT_FINAL_SUBTITLE,
  declineMessage = DEFAULT_DECLINE,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [declined, setDeclined] = useState(false)
  const [busy, setBusy] = useState(false)
  const confirming = useRef(false)
  const declineTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const yesRef = useRef<HTMLButtonElement>(null)

  useEffect(() => () => clearTimeout(declineTimer.current), [])

  useEffect(() => {
    if (!declined) yesRef.current?.focus()
  }, [step, declined])

  const decline = () => {
    if (declined || confirming.current) return
    setDeclined(true)
    declineTimer.current = setTimeout(onCancel, DECLINE_MS)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') decline()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const yes = async () => {
    if (step === 1) {
      setStep(2)
      return
    }
    if (confirming.current) return
    confirming.current = true
    setBusy(true)
    try {
      await onConfirm()
    } catch (e) {
      confirming.current = false
      setBusy(false)
      console.error(e)
    }
  }

  const sub = step === 1 ? subtitle : finalSubtitle
  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={titles[step - 1]}>
        {declined ? (
          <p className={styles.decline} role="status">
            {declineMessage}
          </p>
        ) : (
          <>
            <div className={styles.text}>
              <h2 className={styles.title}>{titles[step - 1]}</h2>
              {sub ? <p className={styles.subtitle}>{sub}</p> : null}
            </div>
            <div className={styles.actions}>
              <button ref={yesRef} type="button" className={styles.yes} onClick={yes} disabled={busy}>
                Oui
              </button>
              <button type="button" className={styles.no} onClick={decline} disabled={busy}>
                Non
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
