import { useSyncExternalStore } from 'react'

/** Événement non standard `beforeinstallprompt` (Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

// Enregistré au chargement du module (importé en tête de main.tsx) pour ne pas rater l'événement.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as BeforeInstallPromptEvent
  emit()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  emit()
})

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export async function promptInstall(): Promise<void> {
  const event = deferred
  if (!event) return
  await event.prompt()
  await event.userChoice
  deferred = null
  emit()
}

export function useInstallPrompt(): { canInstall: boolean; promptInstall: () => Promise<void> } {
  const canInstall = useSyncExternalStore(subscribe, () => deferred !== null)
  return { canInstall, promptInstall }
}

export function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
