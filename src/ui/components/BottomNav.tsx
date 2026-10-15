import { Crown, Plus, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'
import styles from './BottomNav.module.css'

export function BottomNav() {
  const tab = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)
  return (
    <nav className={styles.nav} aria-label="Navigation principale">
      <NavLink to="/hall-of-fame" className={tab}>
        <Crown size={24} />
        <span>Hall of fame</span>
      </NavLink>
      <NavLink to="/series/new" className={styles.add} aria-label="Nouvelle série">
        <Plus size={30} color="#fff" strokeWidth={2.5} />
      </NavLink>
      <NavLink to="/account" className={tab}>
        <UserRound size={24} />
        <span>Mon compte</span>
      </NavLink>
    </nav>
  )
}
