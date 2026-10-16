import { useState } from 'react'
import { EMOJI_GRID, isSingleEmoji } from '../../domain/emoji.ts'
import { Sheet } from './Sheet.tsx'
import { useI18n } from '../../i18n/useI18n.ts'
import styles from './EmojiPicker.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onPick: (emoji: string) => void
}

export function EmojiPicker({ open, onClose, onPick }: Props) {
  const { t } = useI18n()
  const [custom, setCustom] = useState('')
  const trimmed = custom.trim()
  const invalid = trimmed.length > 0 && !isSingleEmoji(trimmed)

  const pick = (emoji: string) => {
    setCustom('')
    onPick(emoji)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t.emoji.title}>
      <div className={styles.grid}>
        {EMOJI_GRID.map((e) => (
          <button key={e} type="button" className={styles.cell} onClick={() => pick(e)} aria-label={e}>
            {e}
          </button>
        ))}
      </div>
      <label className={styles.custom}>
        <span>{t.emoji.paste}</span>
        <input
          className={styles.input}
          value={custom}
          onChange={(e) => {
            const v = e.target.value
            setCustom(v)
            if (isSingleEmoji(v.trim())) pick(v.trim())
          }}
          aria-invalid={invalid}
          placeholder="🙂"
        />
        {invalid ? <span className={styles.error}>{t.emoji.invalid}</span> : null}
      </label>
    </Sheet>
  )
}
