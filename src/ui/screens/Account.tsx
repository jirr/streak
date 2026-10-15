import { differenceInCalendarDays } from 'date-fns'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { exportBackupFile } from '../../app/backupFile.ts'
import { useAppStore } from '../../app/store.ts'
import { parseBackup } from '../../domain/backup.ts'
import type { BackupV1, Gender } from '../../domain/types.ts'
import { Button } from '../components/Button.tsx'
import { DoubleConfirm } from '../components/DoubleConfirm.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { Segmented } from '../components/Segmented.tsx'
import styles from './Account.module.css'

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
  { value: 'other', label: 'Autre' },
  { value: 'unspecified', label: 'Ne pas préciser' },
]

const GRACE_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

function lastBackupLabel(iso: string | undefined, now: Date): string {
  if (!iso) return 'jamais'
  const days = differenceInCalendarDays(now, new Date(iso))
  if (days <= 0) return "aujourd'hui"
  return `il y a ${days} jour${days >= 2 ? 's' : ''}`
}

export function Account() {
  const navigate = useNavigate()
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
        <p className={styles.strong}>Dernière sauvegarde : {lastBackupLabel(settings.lastBackupAt, new Date())}</p>
        <p className={styles.muted}>
          Tes données vivent uniquement sur cet appareil. Si l'adresse de l'app change ou si tu vides ton navigateur,
          elles disparaissent.
        </p>
        <Button fullWidth onClick={() => void doExport()}>
          Exporter mes données
        </Button>
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
        <p className={styles.muted}>Version {__APP_VERSION__}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Zone dangereuse</h2>
        <Button variant="danger" fullWidth onClick={() => setConfirmReset(true)}>
          Tout effacer
        </Button>
      </section>

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
