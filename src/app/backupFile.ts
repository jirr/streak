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

export interface PreparedMail {
  outcome: ExportOutcome
  fileName: string
}

/**
 * Étape 1 de l'envoi par mail (sans serveur, un lien `mailto:` ne joint pas de fichier).
 * Mobile : la feuille de partage permet de choisir l'app Mail, fichier en pièce jointe (terminé).
 * Ailleurs : le fichier est téléchargé ; l'appelant propose ensuite `openMailClient` (étape 2).
 */
export async function prepareEmailBackup(backup: BackupV1, now: Date): Promise<PreparedMail> {
  const file = makeFile(backup, now)
  const shared = await tryShare(file)
  if (shared) return { outcome: shared, fileName: file.name }
  download(file)
  return { outcome: 'downloaded', fileName: file.name }
}

/** Étape 2 : ouvre le client mail, adresse et objet préremplis (appelé depuis un clic). */
export function openMailClient(email: string, fileName: string, now: Date): void {
  const subject = encodeURIComponent(`Sauvegarde Séries ${format(now, 'yyyy-MM-dd')}`)
  const body = encodeURIComponent(`Joins le fichier ${fileName} à ce mail.`)
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
}
