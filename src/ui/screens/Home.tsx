import { useAppStore } from '../../app/store.ts'
import styles from './Home.module.css'

export function Home() {
  const pseudo = useAppStore((s) => s.profile?.pseudo)
  return (
    <main className={styles.page}>
      <p className={styles.greeting}>Salut {pseudo}</p>
      <h1 className={styles.title}>Mes séries</h1>
    </main>
  )
}
