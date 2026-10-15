import styles from './Segmented.module.css'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  /** Retaper l'option active la désélectionne. */
  allowDeselect?: boolean
  label: string
}

export function Segmented<T extends string>({ options, value, onChange, allowDeselect, label }: Props<T>) {
  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? `${styles.option} ${styles.active}` : styles.option}
            onClick={() => onChange(active && allowDeselect ? undefined : o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
