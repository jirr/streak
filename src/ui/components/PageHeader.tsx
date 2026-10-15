import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import styles from './PageHeader.module.css'

interface Props {
  title: string
  /** Affiche un bouton retour (par défaut : page précédente, sinon accueil). */
  back?: boolean | string
  icon?: ReactNode
}

export function PageHeader({ title, back, icon }: Props) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof back === 'string') navigate(back)
    else if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return (
    <header className={styles.header}>
      {back ? (
        <button type="button" className={styles.back} onClick={goBack} aria-label="Retour">
          <ChevronLeft size={24} />
        </button>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {icon}
    </header>
  )
}
