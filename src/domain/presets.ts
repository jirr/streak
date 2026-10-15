import type { Periodicity, SeriesKind, TintKey } from './types.ts'

export type PresetCategory = 'screens' | 'body' | 'relationships' | 'money' | 'discipline' | 'mind'

export interface Preset {
  id: string
  category: PresetCategory
  title: string
  icon: string
  kind: SeriesKind
  periodicity: Periodicity
  target?: number
  tagline: string
  /** présent = suggestion mise en avant */
  chip?: string
}

export const CATEGORY_ORDER: PresetCategory[] = [
  'screens',
  'body',
  'relationships',
  'money',
  'discipline',
  'mind',
]

export const CATEGORY_LABELS: Record<PresetCategory, string> = {
  screens: 'Écrans et réseaux',
  body: 'Corps et consommation',
  relationships: 'Sexualité et relations',
  money: 'Argent',
  discipline: 'Discipline et bonnes habitudes',
  mind: 'Esprit et bien-être',
}

export const CATEGORY_TINT: Record<PresetCategory, TintKey> = {
  screens: 'blue',
  body: 'orange',
  relationships: 'purple',
  money: 'yellow',
  discipline: 'green',
  mind: 'beige',
}

type Row = [
  id: string,
  category: PresetCategory,
  title: string,
  icon: string,
  kind: SeriesKind,
  tagline: string,
  extra?: { chip?: string; periodicity?: Periodicity; target?: number },
]

const ROWS: Row[] = [
  ['screen-limits', 'screens', "Jours en respectant mes limites d'écran sur les réseaux", '📱', 'habit', "Tu fixes la limite, pas l'algorithme."],
  ['no-short-videos', 'screens', 'Jours sans TikTok, Reels ni Shorts', '🎬', 'abstinence', 'Ton cerveau mérite mieux que 8 secondes.'],
  ['no-phone-in-bed', 'screens', 'Jours sans téléphone au lit', '🛏️', 'abstinence', 'Le lit, c\'est pour dormir. Le reste peut attendre.'],
  ['no-phone-morning', 'screens', 'Jours sans téléphone la 1re heure du réveil', '⏰', 'abstinence', 'Commence ta journée avant celle des autres.'],
  ['gaming-limit', 'screens', 'Jours sans jeux vidéo (ou sous 1 h)', '🎮', 'abstinence', 'Le boss final, c\'est toi.'],
  ['no-binge', 'screens', 'Jours sans binge-watching', '📺', 'abstinence', '« Épisode suivant dans 5 s » : non merci.'],
  ['no-doomscroll', 'screens', "Jours sans doomscrolling d'actu", '📰', 'abstinence', 'Le monde tourne aussi sans ton pouce.'],
  ['no-mobile-games', 'screens', 'Jours sans jeux mobiles ni gacha', '🕹️', 'abstinence', 'Les récompenses quotidiennes, c\'est ici maintenant.'],
  ['no-alcohol', 'body', 'Jours sans alcool', '🍸', 'abstinence', 'Tête claire, réveil facile.', { chip: 'Sans alcool' }],
  ['no-tobacco', 'body', 'Jours sans tabac', '🚭', 'abstinence', 'Chaque jour sans, tes poumons disent merci.', { chip: 'Sans tabac' }],
  ['no-vape', 'body', 'Jours sans vape', '💨', 'abstinence', 'Même parfum mangue, c\'est non.'],
  ['no-nicotine-pouches', 'body', 'Jours sans snus ni sachets de nicotine', '🚫', 'abstinence', 'La nicotine discrète reste de la nicotine.'],
  ['no-drugs', 'body', 'Jours sans drogue', '💊', 'abstinence', 'Ton cerveau, version originale.'],
  ['no-cannabis', 'body', 'Jours sans cannabis', '🌿', 'abstinence', 'Redescendre, pour de bon.'],
  ['no-fast-food', 'body', 'Jours sans fast food', '🍔', 'abstinence', 'Rapide à manger, long à éliminer.'],
  ['no-sugar', 'body', 'Jours sans sucre ajouté ni soda', '🍬', 'abstinence', 'Ton pancréas t\'envoie des bisous.', { chip: 'Sans sucre' }],
  ['no-energy-drink', 'body', 'Jours sans energy drink', '⚡', 'abstinence', 'L\'énergie, la vraie : dormir.'],
  ['no-late-snacking', 'body', 'Jours sans grignotage le soir', '🌙', 'abstinence', 'Le frigo ferme à 21 h.'],
  ['no-late-coffee', 'body', 'Jours sans café après 14 h', '☕', 'abstinence', 'Dors mieux, sois moins zombie.'],
  ['no-porn', 'relationships', 'Jours sans porno', '🔞', 'abstinence', 'Reprends la main. Façon de parler.'],
  ['no-masturbation', 'relationships', 'Jours sans masturbation', '✋', 'abstinence', 'Défi accepté ?'],
  ['no-ex-contact', 'relationships', 'Jours sans contacter mon ex', '📵', 'abstinence', 'Il y a une raison pour laquelle c\'est ton ex.'],
  ['no-ex-stalking', 'relationships', 'Jours sans stalker mon ex sur les réseaux', '👀', 'abstinence', 'Sa story ne te concerne plus.'],
  ['no-dating-apps', 'relationships', 'Jours sans app de dating', '💘', 'abstinence', 'Moins swiper, plus vivre.'],
  ['no-gambling', 'money', "Jours sans paris sportifs ni jeux d'argent", '🎲', 'abstinence', 'La banque gagne toujours. Pas aujourd\'hui.'],
  ['no-impulse-buying', 'money', 'Jours sans achat impulsif ni shopping en ligne', '🛍️', 'abstinence', 'Le panier peut dormir 24 h.'],
  ['no-food-delivery', 'money', 'Jours sans livraison de repas', '🛵', 'abstinence', 'Ta cuisine existe, on l\'a vue.'],
  ['no-trading', 'money', 'Jours sans trading ni crypto compulsifs', '📉', 'abstinence', 'Le graphique bougera sans toi.'],
  ['no-loot-boxes', 'money', 'Jours sans achats in-game ni loot boxes', '💎', 'abstinence', 'Le skin ne te rendra pas heureux.'],
  ['training-program', 'discipline', "Jours en respectant mon programme d'entraînement", '🏋️', 'habit', 'Le plan, c\'est le plan.'],
  ['sport-20', 'discipline', '20 min de sport par jour', '🏃', 'habit', '20 minutes. Même pas un épisode.', { chip: 'Sport' }],
  ['sport-3-week', 'discipline', 'Sport 3×/semaine', '💪', 'habit', 'Trois fois. Pas de débat.', { periodicity: 'weekly', target: 3 }],
  ['daily-goals', 'discipline', 'Jours en fixant mes objectifs le matin', '🎯', 'habit', 'Une journée sans cap, c\'est une journée subie.'],
  ['reading', 'discipline', '30 min de lecture par jour', '📖', 'habit', 'Un chapitre de plus que ton fil d\'actu.', { chip: 'Lecture' }],
  ['read-20-pages', 'discipline', 'Lire 20 pages par jour', '📚', 'habit', '20 pages par jour, 30 livres par an.'],
  ['bed-before-23', 'discipline', 'Jours couché avant 23 h', '😴', 'habit', 'Le toi de demain te remercie déjà.'],
  ['water', 'discipline', "Boire 1,5 L d'eau par jour", '💧', 'habit', 'Ta peau, tes reins et ta tête approuvent.'],
  ['steps', 'discipline', '10 000 pas par jour', '👟', 'habit', 'Un pas après l\'autre, littéralement.'],
  ['call-grandma', 'discipline', "Mois en ayant appelé ma grand-mère", '👵', 'habit', 'Elle attend ton appel. Vraiment.', { periodicity: 'monthly', target: 1 }],
  ['meditation', 'mind', '10 min de méditation', '🧘', 'habit', 'Ne rien faire, mais bien.', { chip: 'Méditation' }],
  ['journal', 'mind', 'Journal du soir (5 min)', '✍️', 'habit', 'Vide ta tête avant de dormir.'],
  ['gratitude', 'mind', '3 gratitudes par jour', '🙏', 'habit', 'Trois trucs bien. Il y en a toujours.'],
  ['no-complaining', 'mind', 'Jours sans me plaindre', '🤐', 'abstinence', 'Essaie. Juste pour voir.'],
]

export const PRESETS: Preset[] = ROWS.map(([id, category, title, icon, kind, tagline, extra]) => ({
  id,
  category,
  title,
  icon,
  kind,
  periodicity: extra?.periodicity ?? 'daily',
  ...(extra?.target !== undefined ? { target: extra.target } : {}),
  tagline,
  ...(extra?.chip !== undefined ? { chip: extra.chip } : {}),
}))

const FEATURED_ORDER = ['Sans alcool', 'Sans tabac', 'Sport', 'Lecture', 'Méditation', 'Sans sucre']

export const FEATURED_PRESETS: Preset[] = FEATURED_ORDER.map((chip) => {
  const preset = PRESETS.find((p) => p.chip === chip)
  if (!preset) throw new Error(`Preset manquant pour la puce « ${chip} »`)
  return preset
})

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
