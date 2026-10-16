import { differenceInCalendarDays } from 'date-fns'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { exportBackupFile } from '../../app/backupFile.ts'
import { useAppStore } from '../../app/store.ts'
import { useNow } from '../../app/useNow.ts'
import { scheduler } from '../../notifications/index.ts'
import type { PermissionState } from '../../notifications/NotificationScheduler.ts'
import { syncReminders } from '../../notifications/syncReminders.ts'
import { isIos, isStandalone, useInstallPrompt } from '../../pwa/installPrompt.ts'
import { parseBackup, type ParseBackupResult } from '../../domain/backup.ts'
import type { BackupV1, Gender, LanguagePref } from '../../domain/types.ts'
import type { Messages } from '../../i18n/messages.ts'
import { useI18n } from '../../i18n/useI18n.ts'
import { Button } from '../components/Button.tsx'
import { DoubleConfirm } from '../components/DoubleConfirm.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { Segmented } from '../components/Segmented.tsx'
import { Toggle } from '../components/Toggle.tsx'
import styles from './Account.module.css'

const GENDER_VALUES: Gender[] = ['female', 'male', 'other', 'unspecified']

const GRACE_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

function lastBackupLabel(iso: string | undefined, now: Date, t: Messages): string {
  if (!iso) return t.account.never
  const days = differenceInCalendarDays(now, new Date(iso))
  if (days <= 0) return t.account.today
  return t.account.daysAgo(days)
}

function importErrorMessage(result: Extract<ParseBackupResult, { ok: false }>, t: Messages): string {
  switch (result.error) {
    case 'not-series':
      return t.account.importErrors.notSeries
    case 'unsupported-version':
      return t.account.importErrors.unsupportedVersion
    case 'corrupt':
      return t.account.importErrors.corrupt(result.field ?? '?')
  }
}

export function Account() {
  const navigate = useNavigate()
  const now = useNow()
  const { t } = useI18n()
  const genders = GENDER_VALUES.map((value) => ({ value, label: t.common.genders[value] }))
  const languages: { value: LanguagePref; label: string }[] = [
    { value: 'system', label: t.account.languageSystem },
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ]
  const { canInstall, promptInstall } = useInstallPrompt()
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)
  const resetAll = useAppStore((s) => s.resetAll)

  const [pseudo, setPseudo] = useState(profile?.pseudo ?? '')
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<BackupV1 | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [permission, setPermission] = useState<PermissionState>(() => scheduler.getPermission())
  const [testResult, setTestResult] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const savePseudo = () => {
    const trimmed = pseudo.trim()
    if (trimmed.length < 1 || trimmed.length > 30) {
      setPseudo(profile?.pseudo ?? '')
      return
    }
    if (trimmed !== profile?.pseudo) void updateProfile({ pseudo: trimmed })
    setPseudo(trimmed)
  }

  const doExport = async () => {
    setExportError(null)
    const now = new Date()
    try {
      const outcome = await exportBackupFile(await exportData(), now)
      if (outcome !== 'cancelled') await updateSettings({ lastBackupAt: now.toISOString() })
    } catch (e) {
      console.error(e)
      setExportError(t.account.exportFailed)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setImportError(null)
    const result = parseBackup(await file.text())
    if (result.ok) setPendingImport(result.backup)
    else setImportError(importErrorMessage(result, t))
  }

  return (
    <main className={styles.page}>
      <PageHeader title={t.account.title} />

      <section className={styles.card}>
        <h2 className={styles.h2}>{t.account.profile}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t.onboarding.pseudo}</span>
          <input
            className={styles.input}
            value={pseudo}
            maxLength={30}
            onChange={(e) => setPseudo(e.target.value)}
            onBlur={savePseudo}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </label>
        <div className={styles.field}>
          <span className={styles.label}>{t.onboarding.gender}</span>
          <Segmented
            label={t.onboarding.gender}
            options={genders}
            value={profile?.gender}
            allowDeselect
            onChange={(g) => void updateProfile({ gender: g })}
          />
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>{t.account.language}</h2>
        <Segmented
          label={t.account.language}
          options={languages}
          value={settings.language}
          onChange={(language) => language && void updateSettings({ language })}
        />
      </section>

      <section className={`${styles.card} ${styles.highlight}`}>
        <h2 className={styles.h2}>{t.account.backup}</h2>
        <p className={styles.strong}>{t.account.lastBackup(lastBackupLabel(settings.lastBackupAt, now, t))}</p>
        <p className={styles.muted}>{t.account.backupHelp}</p>
        <Button fullWidth onClick={() => void doExport()}>
          {t.account.export}
        </Button>
        {exportError ? (
          <p className={styles.error} role="alert">
            {exportError}
          </p>
        ) : null}
        <Button variant="secondary" fullWidth onClick={() => fileInput.current?.click()}>
          {t.account.import}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label={t.account.importFile}
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {importError ? (
          <p className={styles.error} role="alert">
            {importError}
          </p>
        ) : null}
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>{t.account.notifications}</h2>
        <p className={styles.strong}>{t.account.permission[permission]}</p>
        {permission === 'default' ? (
          <Button
            fullWidth
            onClick={async () => {
              setPermission(await scheduler.requestPermission())
              await syncReminders()
            }}
          >
            {t.account.enableNotifications}
          </Button>
        ) : null}
        {permission === 'granted' ? (
          <>
            <Button
              variant="secondary"
              fullWidth
              onClick={async () => {
                try {
                  await scheduler.sendTest({ title: 'Séries', body: t.account.testBody })
                  setTestResult(t.account.testSent)
                } catch (e) {
                  console.error(e)
                  setTestResult(t.account.testFailed)
                }
              }}
            >
              {t.account.testNotification}
            </Button>
            {testResult ? <p className={styles.muted}>{testResult}</p> : null}
          </>
        ) : null}
        <div className={styles.switchRow}>
          <span className={styles.label}>{t.account.reminders}</span>
          <Toggle
            label={t.account.reminders}
            checked={settings.remindersEnabled}
            onChange={(v) => void updateSettings({ remindersEnabled: v })}
          />
        </div>
        {isIos() && !isStandalone() ? (
          <Link to="/install" className={styles.link}>
            {t.account.iosInstallFirst}
          </Link>
        ) : null}
        <p className={styles.muted}>{t.account.bestEffort}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>{t.account.grace}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t.account.graceQuestion}</span>
          <select
            className={styles.input}
            value={settings.graceHour}
            onChange={(e) => void updateSettings({ graceHour: Number(e.target.value) })}
          >
            {GRACE_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h === 0 ? t.account.graceNone : t.account.graceOption(h)}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.muted}>{t.account.graceHelp}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>{t.account.app}</h2>
        {canInstall ? (
          <Button variant="secondary" fullWidth onClick={() => void promptInstall()}>
            {t.install.installApp}
          </Button>
        ) : null}
        {isIos() && !isStandalone() ? (
          <Link to="/install" className={styles.link}>
            {t.install.installIphone}
          </Link>
        ) : null}
        <p className={styles.muted}>{t.account.version(__APP_VERSION__)}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>{t.account.danger}</h2>
        <Button variant="danger" fullWidth onClick={() => setConfirmReset(true)}>
          {t.account.reset}
        </Button>
      </section>

      <DoubleConfirm
        open={pendingImport !== null}
        titles={t.account.importTitles}
        subtitle=""
        finalSubtitle={null}
        declineMessage={t.common.nothingTouched}
        onCancel={() => setPendingImport(null)}
        onConfirm={async () => {
          if (pendingImport) await importData(pendingImport)
          setPendingImport(null)
        }}
      />

      <DoubleConfirm
        open={confirmReset}
        titles={t.account.resetTitles}
        subtitle=""
        finalSubtitle={null}
        declineMessage={t.common.nothingTouched}
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetAll()
          setConfirmReset(false)
          navigate('/onboarding', { replace: true })
        }}
      />
    </main>
  )
}
