import { format } from 'date-fns'
import type { BackupV1 } from '../domain/types.ts'

export type ExportOutcome = 'shared' | 'downloaded' | 'cancelled'

function makeFile(backup: BackupV1, now: Date): File {
  const name = `series-backup-${format(now, 'yyyy-MM-dd')}.json`
  return new File([JSON.stringify(backup, null, 2)], name, { type: 'application/json' })
}

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

/** Partage natif (écran tactile uniquement). `null` = non disponible ou refusé : l'appelant télécharge. */
async function tryShare(file: File): Promise<'shared' | 'cancelled' | null> {
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (!touch || !navigator.canShare?.({ files: [file] })) return null
  try {
    await navigator.share({ files: [file], title: 'Sauvegarde Séries' })
    return 'shared'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    return null // partage refusé (activation expirée, type non supporté…)
  }
}

/** Partage natif sur mobile ; sinon, ou si le partage échoue, téléchargement du fichier JSON. */
export async function exportBackupFile(backup: BackupV1, now: Date): Promise<ExportOutcome> {
  const file = makeFile(backup, now)
  const shared = await tryShare(file)
  if (shared) return shared
  download(file)
  return 'downloaded'
}

/**
 * Envoi par mail sans serveur : un lien `mailto:` ne peut pas joindre de fichier.
 * Mobile : la feuille de partage permet de choisir l'app Mail avec le fichier en pièce jointe.
 * Ailleurs : le fichier est téléchargé, puis le client mail s'ouvre, adresse et objet préremplis ;
 * il reste à joindre le fichier à la main.
 */
export async function emailBackupFile(backup: BackupV1, now: Date, email: string): Promise<ExportOutcome> {
  const file = makeFile(backup, now)
  const shared = await tryShare(file)
  if (shared) return shared
  download(file)
  const subject = encodeURIComponent(`Sauvegarde Séries ${format(now, 'yyyy-MM-dd')}`)
  const body = encodeURIComponent(`Joins le fichier ${file.name} (téléchargé à l'instant) à ce mail.`)
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`
  return 'downloaded'
}
