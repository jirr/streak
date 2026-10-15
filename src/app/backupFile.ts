import { format } from 'date-fns'
import type { BackupV1 } from '../domain/types.ts'

export type ExportOutcome = 'shared' | 'downloaded' | 'cancelled'

/** Partage natif si possible (mobile), sinon téléchargement du fichier JSON. */
export async function exportBackupFile(backup: BackupV1, now: Date): Promise<ExportOutcome> {
  const name = `series-backup-${format(now, 'yyyy-MM-dd')}.json`
  const json = JSON.stringify(backup, null, 2)
  const file = new File([json], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      throw e
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
