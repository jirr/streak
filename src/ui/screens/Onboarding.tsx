import { ArrowRight, Flame } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppStore } from '../../app/store.ts'
import type { Gender } from '../../domain/types.ts'
import { useI18n } from '../../i18n/useI18n.ts'
import { isIos, isStandalone, useInstallPrompt } from '../../pwa/installPrompt.ts'
import { Banner } from '../components/Banner.tsx'
import { Button } from '../components/Button.tsx'
import { Segmented } from '../components/Segmented.tsx'
import styles from './Onboarding.module.css'

const GENDER_VALUES: Gender[] = ['female', 'male', 'other', 'unspecified']

function Soon() {
  const { t } = useI18n()
  return <span className={styles.soon}>{t.onboarding.soon}</span>
}

export function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const navigate = useNavigate()
  const { t } = useI18n()
  const genders = GENDER_VALUES.map((value) => ({ value, label: t.common.genders[value] }))
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
        <h1 className={styles.title}>{t.onboarding.title}</h1>
        <p className={styles.subtitle}>{t.onboarding.subtitle}</p>
      </section>

      <form className={styles.sheet} onSubmit={submit}>
        {showInstall ? (
          <Banner
            tone="accent"
            action={
              canInstall ? (
                <button type="button" className={styles.installLink} onClick={() => void promptInstall()}>
                  {t.install.installApp}
                </button>
              ) : (
                <Link to="/install" className={styles.installLink}>
                  {t.install.installIphone}
                </Link>
              )
            }
            onDismiss={() => setInstallDismissed(true)}
          >
            {t.install.nudge}
          </Banner>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>{t.onboarding.pseudo}</span>
          <input
            className={styles.input}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder={t.onboarding.pseudoPlaceholder}
            maxLength={30}
            autoComplete="nickname"
            required
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>{t.onboarding.genderOptional}</span>
          <Segmented label={t.onboarding.gender} options={genders} value={gender} onChange={setGender} allowDeselect />
        </div>

        <Button type="submit" fullWidth disabled={!valid || busy}>
          {t.onboarding.continue}
        </Button>

        <div className={styles.separator}>
          <span>{t.onboarding.soon}</span>
        </div>

        <div className={styles.soonGroup}>
          <button type="button" aria-disabled="true" className={`${styles.provider} ${styles.apple}`} tabIndex={-1}>
            {t.onboarding.apple} <Soon />
          </button>
          <button type="button" aria-disabled="true" className={`${styles.provider} ${styles.google}`} tabIndex={-1}>
            {t.onboarding.google} <Soon />
          </button>
          <div className={styles.emailRow} aria-disabled="true">
            <input className={styles.input} placeholder={t.onboarding.emailPlaceholder} disabled aria-label={t.onboarding.emailPlaceholder} />
            <button type="button" className={styles.emailGo} aria-disabled="true" tabIndex={-1} aria-label={t.onboarding.emailContinue}>
              <ArrowRight size={20} />
            </button>
            <Soon />
          </div>
        </div>

        <p className={styles.footer}>{t.onboarding.footer}</p>
      </form>
    </div>
  )
}
