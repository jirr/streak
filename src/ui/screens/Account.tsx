import { differenceInCalendarDays } from 'date-fns'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { exportBackupFile, openMailClient, prepareEmailBackup } from '../../app/backupFile.ts'
import { useAppStore } from '../../app/store.ts'
import { useNow } from '../../app/useNow.ts'
import { scheduler } from '../../notifications/index.ts'
import type { PermissionState } from '../../notifications/NotificationScheduler.ts'
import { syncReminders } from '../../notifications/syncReminders.ts'
import { isIos, isStandalone, useInstallPrompt } from '../../pwa/installPrompt.ts'
import { parseBackup } from '../../domain/backup.ts'
import { isValidEmail } from '../../domain/email.ts'
import type { BackupV1, Gender } from '../../domain/types.ts'
import { Button } from '../components/Button.tsx'
import { DoubleConfirm } from '../components/DoubleConfirm.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { Segmented } from '../components/Segmented.tsx'
import { Toggle } from '../components/Toggle.tsx'
import styles from './Account.module.css'

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
  { value: 'other', label: 'Autre' },
  { value: 'unspecified', label: 'Ne pas préciser' },
]

const PERMISSION_LABELS: Record<PermissionState, string> = {
  granted: 'Activées',
  denied: 'Bloquées dans le navigateur',
  default: 'Pas encore autorisées',
  unsupported: 'Non supportées ici',
}

const GRACE_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

function lastBackupLabel(iso: string | undefined, now: Date): string {
  if (!iso) return 'jamais'
  const days = differenceInCalendarDays(now, new Date(iso))
  if (days <= 0) return "aujourd'hui"
  return `il y a ${days} jour${days >= 2 ? 's' : ''}`
}

export function Account() {
  const navigate = useNavigate()
  const now = useNow()
  const { canInstall, promptInstall } = useInstallPrompt()
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)
  const resetAll = useAppStore((s) => s.resetAll)

  const [pseudo, setPseudo] = useState(profile?.pseudo ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [mailSheet, setMailSheet] = useState<{ fileName: string; at: Date } | null>(null)
  const [copied, setCopied] = useState(false)
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

  const saveEmail = () => {
    const trimmed = email.trim()
    if (trimmed !== '' && !isValidEmail(trimmed)) {
      setEmailError('Cette adresse a l\'air bancale.')
      return
    }
    setEmailError(null)
    setEmail(trimmed)
    if (trimmed !== (profile?.email ?? '')) void updateProfile({ email: trimmed || undefined })
  }

  const doExport = async (byMail: boolean) => {
    setExportError(null)
    const now = new Date()
    try {
      const backup = await exportData()
      let outcome
      if (byMail) {
        const prepared = await prepareEmailBackup(backup, now)
        outcome = prepared.outcome
        if (outcome === 'downloaded') {
          setCopied(false)
          setMailSheet({ fileName: prepared.fileName, at: now })
        }
      } else {
        outcome = await exportBackupFile(backup, now)
      }
      if (outcome !== 'cancelled') await updateSettings({ lastBackupAt: now.toISOString() })
    } catch (e) {
      console.error(e)
      setExportError("L'export a échoué. Réessaie.")
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setImportError(null)
    const result = parseBackup(await file.text())
    if (result.ok) setPendingImport(result.backup)
    else setImportError(result.error)
  }

  return (
    <main className={styles.page}>
      <PageHeader title="Mon compte" />

      <section className={styles.card}>
        <h2 className={styles.h2}>Profil</h2>
        <label className={styles.field}>
          <span className={styles.label}>Pseudo</span>
          <input
            className={styles.input}
            value={pseudo}
            maxLength={30}
            onChange={(e) => setPseudo(e.target.value)}
            onBlur={savePseudo}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>E-mail (facultatif)</span>
          <input
            className={styles.input}
            type="email"
            value={email}
            placeholder="Pour t'envoyer tes sauvegardes"
            onChange={(e) => setEmail(e.target.value)}
            onBlur={saveEmail}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-invalid={emailError !== null}
          />
          {emailError ? <span className={styles.error}>{emailError}</span> : null}
        </label>
        <div className={styles.field}>
          <span className={styles.label}>Sexe</span>
          <Segmented
            label="Sexe"
            options={GENDERS}
            value={profile?.gender}
            allowDeselect
            onChange={(g) => void updateProfile({ gender: g })}
          />
        </div>
      </section>

      <section className={`${styles.card} ${styles.highlight}`}>
        <h2 className={styles.h2}>Sauvegarde</h2>
        <p className={styles.strong}>Dernière sauvegarde : {lastBackupLabel(settings.lastBackupAt, now)}</p>
        <p className={styles.muted}>
          Tes données vivent uniquement sur cet appareil. Si l'adresse de l'app change ou si tu vides ton navigateur,
          elles disparaissent.
        </p>
        <Button fullWidth onClick={() => void doExport(false)}>
          Exporter mes données
        </Button>
        {profile?.email ? (
          <Button variant="secondary" fullWidth onClick={() => void doExport(true)}>
            M'envoyer par mail
          </Button>
        ) : null}
        {exportError ? (
          <p className={styles.error} role="alert">
            {exportError}
          </p>
        ) : null}
        <Button variant="secondary" fullWidth onClick={() => fileInput.current?.click()}>
          Importer
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Fichier de sauvegarde"
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
        <h2 className={styles.h2}>Notifications</h2>
        <p className={styles.strong}>{PERMISSION_LABELS[permission]}</p>
        {permission === 'default' ? (
          <Button
            fullWidth
            onClick={async () => {
              setPermission(await scheduler.requestPermission())
              await syncReminders()
            }}
          >
            Activer les notifications
          </Button>
        ) : null}
        {permission === 'granted' ? (
          <>
            <Button
              variant="secondary"
              fullWidth
              onClick={async () => {
                try {
                  await scheduler.sendTest()
                  setTestResult('Notification envoyée. Rien reçu ? Vérifie les réglages du système et du navigateur.')
                } catch (e) {
                  setTestResult(`Impossible d'afficher la notification : ${e instanceof Error ? e.message : e}`)
                }
              }}
            >
              Tester une notification
            </Button>
            {testResult ? <p className={styles.muted}>{testResult}</p> : null}
          </>
        ) : null}
        <div className={styles.switchRow}>
          <span className={styles.label}>Rappels</span>
          <Toggle
            label="Rappels"
            checked={settings.remindersEnabled}
            onChange={(v) => void updateSettings({ remindersEnabled: v })}
          />
        </div>
        {isIos() && !isStandalone() ? (
          <Link to="/install" className={styles.link}>
            Sur iPhone, installe l'app d'abord
          </Link>
        ) : null}
        <p className={styles.muted}>
          Les rappels sont best effort : ils arrivent surtout quand l'app est ouverte ou récemment utilisée.
        </p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Heure de grâce</h2>
        <label className={styles.field}>
          <span className={styles.label}>Jusqu'à quelle heure ?</span>
          <select
            className={styles.input}
            value={settings.graceHour}
            onChange={(e) => void updateSettings({ graceHour: Number(e.target.value) })}
          >
            {GRACE_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h === 0 ? 'Aucune' : `${h} h`}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.muted}>Jusqu'à cette heure, tu peux encore cocher la veille.</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Application</h2>
        {canInstall ? (
          <Button variant="secondary" fullWidth onClick={() => void promptInstall()}>
            Installer l'app
          </Button>
        ) : null}
        {isIos() && !isStandalone() ? (
          <Link to="/install" className={styles.link}>
            Installer sur iPhone
          </Link>
        ) : null}
        <p className={styles.muted}>Version {__APP_VERSION__}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Zone dangereuse</h2>
        <Button variant="danger" fullWidth onClick={() => setConfirmReset(true)}>
          Tout effacer
        </Button>
      </section>

      <Sheet open={mailSheet !== null} onClose={() => setMailSheet(null)} title="Envoyer par mail">
        {mailSheet && profile?.email ? (
          <div className={styles.mailSteps}>
            <p>
              <strong>1.</strong> Le fichier <code>{mailSheet.fileName}</code> vient d'être téléchargé.
            </p>
            <p>
              <strong>2.</strong> Ouvre ton mail, puis joins ce fichier au message pour {profile.email}.
            </p>
            <Button fullWidth onClick={() => openMailClient(profile.email!, mailSheet.fileName, mailSheet.at)}>
              Ouvrir mon client mail
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={async () => {
                await navigator.clipboard?.writeText(profile.email!)
                setCopied(true)
              }}
            >
              {copied ? 'Adresse copiée' : "Copier l'adresse (webmail)"}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setMailSheet(null)}>
              Fermer
            </Button>
          </div>
        ) : null}
      </Sheet>

      <DoubleConfirm
        open={pendingImport !== null}
        titles={['Remplacer toutes tes données ?', "Ce qui est sur l'appareil sera écrasé. Sûr ?"]}
        subtitle=""
        finalSubtitle={null}
        declineMessage="Ok, on ne touche à rien."
        onCancel={() => setPendingImport(null)}
        onConfirm={async () => {
          if (pendingImport) await importData(pendingImport)
          setPendingImport(null)
        }}
      />

      <DoubleConfirm
        open={confirmReset}
        titles={['Tout effacer ?', 'Séries, records, tout. Vraiment ?']}
        subtitle=""
        finalSubtitle={null}
        declineMessage="Ok, on ne touche à rien."
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
