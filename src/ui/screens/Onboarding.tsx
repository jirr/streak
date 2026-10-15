import { ArrowRight, Flame } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppStore } from '../../app/store.ts'
import type { Gender } from '../../domain/types.ts'
import { isIos, isStandalone, useInstallPrompt } from '../../pwa/installPrompt.ts'
import { Banner } from '../components/Banner.tsx'
import { Button } from '../components/Button.tsx'
import { Segmented } from '../components/Segmented.tsx'
import styles from './Onboarding.module.css'

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
  { value: 'other', label: 'Autre' },
  { value: 'unspecified', label: 'Ne pas préciser' },
]

function Soon() {
  return <span className={styles.soon}>bientôt</span>
}

export function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState('')
  const [gender, setGender] = useState<Gender | undefined>()
  const [busy, setBusy] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)
  const { canInstall, promptInstall } = useInstallPrompt()
  const iosInstall = isIos() && !isStandalone()
  const showInstall = !installDismissed && (canInstall || iosInstall)
  const valid = pseudo.trim().length >= 1 && pseudo.trim().length <= 30

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    await completeOnboarding(pseudo, gender)
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.logo}>
          <Flame size={32} color="#fff" strokeWidth={2.2} />
        </div>
        <h1 className={styles.title}>Chaque jour compte.</h1>
        <p className={styles.subtitle}>Crée tes séries, tiens-les, bats ton record.</p>
      </section>

      <form className={styles.sheet} onSubmit={submit}>
        {showInstall ? (
          <Banner
            tone="accent"
            action={
              canInstall ? (
                <button type="button" className={styles.installLink} onClick={() => void promptInstall()}>
                  Installer l'app
                </button>
              ) : (
                <Link to="/install" className={styles.installLink}>
                  Installer sur iPhone
                </Link>
              )
            }
            onDismiss={() => setInstallDismissed(true)}
          >
            Garde Séries sous la main.
          </Banner>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>Pseudo</span>
          <input
            className={styles.input}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Ton pseudo"
            maxLength={30}
            autoComplete="nickname"
            required
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Sexe (facultatif)</span>
          <Segmented label="Sexe" options={GENDERS} value={gender} onChange={setGender} allowDeselect />
        </div>

        <Button type="submit" fullWidth disabled={!valid || busy}>
          Continuer
        </Button>

        <div className={styles.separator}>
          <span>bientôt</span>
        </div>

        <div className={styles.soonGroup}>
          <button type="button" aria-disabled="true" className={`${styles.provider} ${styles.apple}`} tabIndex={-1}>
            Continuer avec Apple <Soon />
          </button>
          <button type="button" aria-disabled="true" className={`${styles.provider} ${styles.google}`} tabIndex={-1}>
            Continuer avec Google <Soon />
          </button>
          <div className={styles.emailRow} aria-disabled="true">
            <input className={styles.input} placeholder="Ton e-mail" disabled aria-label="E-mail" />
            <button type="button" className={styles.emailGo} aria-disabled="true" tabIndex={-1} aria-label="Continuer avec l'e-mail">
              <ArrowRight size={20} />
            </button>
            <Soon />
          </div>
        </div>

        <p className={styles.footer}>Tes données restent sur ton appareil.</p>
      </form>
    </div>
  )
}
