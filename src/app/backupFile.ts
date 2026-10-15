import { format } from 'date-fns'
import type { BackupV1 } from '../domain/types.ts'

export type ExportOutcome = 'shared' | 'downloaded' | 'cancelled'

function download(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Partage natif sur mobile (écran tactile) ; sinon, ou si le partage échoue, téléchargement du fichier JSON. */
export async function exportBackupFile(backup: BackupV1, now: Date): Promise<ExportOutcome> {
  const name = `series-backup-${format(now, 'yyyy-MM-dd')}.json`
  const file = new File([JSON.stringify(backup, null, 2)], name, { type: 'application/json' })

  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Partage refusé (activation expirée, type non supporté…) : on retombe sur le téléchargement.
    }
  }
  download(file)
  return 'downloaded'
}
