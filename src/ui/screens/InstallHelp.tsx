import { Check, Share, SquarePlus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import styles from './InstallHelp.module.css'

const STEPS = [
  { Icon: Share, text: 'Touche Partager en bas de Safari' },
  { Icon: SquarePlus, text: 'Choisis “Sur l\'écran d\'accueil”' },
  { Icon: Check, text: 'Touche Ajouter' },
]

export function InstallHelp() {
  return (
    <main className={styles.page}>
      <PageHeader title="Installer sur iPhone" back="/account" />
      <ol className={styles.steps}>
        {STEPS.map(({ Icon, text }, i) => (
          <li key={text} className={styles.step}>
            <span className={styles.icon}>
              <Icon size={24} />
            </span>
            <span>
              <strong>{i + 1}.</strong> {text}
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.callout}>
        Indispensable pour recevoir des notifications sur iPhone (iOS 16.4 ou plus). Même installée, une PWA sans serveur
        ne peut pas garantir un rappel chaque jour.
      </p>
      <p className={styles.note}>
        Tes données de Safari et celles de l'app installée sont séparées : exporte-les puis importe-les si tu as déjà
        commencé dans Safari.
      </p>
    </main>
  )
}
