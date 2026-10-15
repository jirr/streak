/** Exactement un graphème, et c'est un emoji. */
export function isSingleEmoji(s: string): boolean {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const graphemes = [...segmenter.segment(s)]
  return graphemes.length === 1 && /\p{Extended_Pictographic}/u.test(s)
}

export const QUICK_EMOJIS = ['🍸', '🏋️', '📖', '🌿', '🔥']

export const EMOJI_GRID = [
  '🏃', '🏋️', '🚴', '🏊', '🧘', '⚽', '🏀', '🎾',
  '🍎', '🥗', '🍔', '🍕', '🍬', '🍫', '🍩', '🥤',
  '🍸', '🍺', '🍷', '☕', '🍵', '💧', '🚭', '💨',
  '📱', '💻', '📺', '🎮', '🎬', '📵', '🕹️', '📰',
  '💰', '💸', '🛍️', '🎲', '💳', '📉', '📈', '💎',
  '🌿', '🌳', '🌞', '🌙', '⭐', '🔥', '⚡', '🌊',
  '❤️', '💘', '🧠', '😴', '🛏️', '⏰', '🙏', '😌',
  '📖', '📚', '✍️', '🎯', '🎨', '🎸', '🧹', '🚿',
]
