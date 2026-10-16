import type { Locale, Periodicity, SeriesKind, TintKey } from './types.ts'

export type PresetCategory = 'screens' | 'body' | 'relationships' | 'money' | 'discipline' | 'mind'

export interface PresetText {
  title: string
  tagline: string
  /** présent = suggestion mise en avant (libellé de la puce) */
  chip?: string
}

export interface Preset {
  id: string
  category: PresetCategory
  icon: string
  kind: SeriesKind
  periodicity: Periodicity
  target?: number
  text: Record<Locale, PresetText>
}

export const CATEGORY_ORDER: PresetCategory[] = ['screens', 'body', 'relationships', 'money', 'discipline', 'mind']

export const CATEGORY_LABELS: Record<PresetCategory, Record<Locale, string>> = {
  screens: { fr: 'Écrans et réseaux', en: 'Screens & social media' },
  body: { fr: 'Corps et consommation', en: 'Body & consumption' },
  relationships: { fr: 'Sexualité et relations', en: 'Sex & relationships' },
  money: { fr: 'Argent', en: 'Money' },
  discipline: { fr: 'Discipline et bonnes habitudes', en: 'Discipline & good habits' },
  mind: { fr: 'Esprit et bien-être', en: 'Mind & wellbeing' },
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
  icon: string,
  kind: SeriesKind,
  fr: PresetText,
  en: PresetText,
  period?: { periodicity: Periodicity; target: number },
]

const ROWS: Row[] = [
  ['screen-limits', 'screens', '📱', 'habit',
    { title: "Jours en respectant mes limites d'écran sur les réseaux", tagline: "Tu fixes la limite, pas l'algorithme." },
    { title: 'Days within my social media screen limits', tagline: 'You set the limit, not the algorithm.' }],
  ['no-short-videos', 'screens', '🎬', 'abstinence',
    { title: 'Jours sans TikTok, Reels ni Shorts', tagline: 'Ton cerveau mérite mieux que 8 secondes.' },
    { title: 'Days without TikTok, Reels or Shorts', tagline: 'Your brain deserves more than 8 seconds.' }],
  ['no-phone-in-bed', 'screens', '🛏️', 'abstinence',
    { title: 'Jours sans téléphone au lit', tagline: "Le lit, c'est pour dormir. Le reste peut attendre." },
    { title: 'Days without my phone in bed', tagline: 'Bed is for sleeping. The rest can wait.' }],
  ['no-phone-morning', 'screens', '⏰', 'abstinence',
    { title: 'Jours sans téléphone la 1re heure du réveil', tagline: 'Commence ta journée avant celle des autres.' },
    { title: 'Days without my phone the first hour after waking', tagline: "Start your day before everyone else's." }],
  ['gaming-limit', 'screens', '🎮', 'abstinence',
    { title: 'Jours sans jeux vidéo (ou sous 1 h)', tagline: "Le boss final, c'est toi." },
    { title: 'Days without video games (or under 1 h)', tagline: "You're the final boss." }],
  ['no-binge', 'screens', '📺', 'abstinence',
    { title: 'Jours sans binge-watching', tagline: '« Épisode suivant dans 5 s » : non merci.' },
    { title: 'Days without binge-watching', tagline: '“Next episode in 5 s”: no thanks.' }],
  ['no-doomscroll', 'screens', '📰', 'abstinence',
    { title: "Jours sans doomscrolling d'actu", tagline: 'Le monde tourne aussi sans ton pouce.' },
    { title: 'Days without doomscrolling the news', tagline: 'The world keeps turning without your thumb.' }],
  ['no-mobile-games', 'screens', '🕹️', 'abstinence',
    { title: 'Jours sans jeux mobiles ni gacha', tagline: "Les récompenses quotidiennes, c'est ici maintenant." },
    { title: 'Days without mobile or gacha games', tagline: 'Daily rewards live here now.' }],
  ['no-alcohol', 'body', '🍸', 'abstinence',
    { title: 'Jours sans alcool', tagline: 'Tête claire, réveil facile.', chip: 'Sans alcool' },
    { title: 'Days without alcohol', tagline: 'Clear head, easy mornings.', chip: 'No alcohol' }],
  ['no-tobacco', 'body', '🚭', 'abstinence',
    { title: 'Jours sans tabac', tagline: 'Chaque jour sans, tes poumons disent merci.', chip: 'Sans tabac' },
    { title: 'Days without tobacco', tagline: 'Every day without, your lungs say thanks.', chip: 'No tobacco' }],
  ['no-vape', 'body', '💨', 'abstinence',
    { title: 'Jours sans vape', tagline: "Même parfum mangue, c'est non." },
    { title: 'Days without vaping', tagline: 'Even mango flavour is a no.' }],
  ['no-nicotine-pouches', 'body', '🚫', 'abstinence',
    { title: 'Jours sans snus ni sachets de nicotine', tagline: 'La nicotine discrète reste de la nicotine.' },
    { title: 'Days without snus or nicotine pouches', tagline: 'Discreet nicotine is still nicotine.' }],
  ['no-drugs', 'body', '💊', 'abstinence',
    { title: 'Jours sans drogue', tagline: 'Ton cerveau, version originale.' },
    { title: 'Days without drugs', tagline: 'Your brain, original version.' }],
  ['no-cannabis', 'body', '🌿', 'abstinence',
    { title: 'Jours sans cannabis', tagline: 'Redescendre, pour de bon.' },
    { title: 'Days without cannabis', tagline: 'Coming down, for good.' }],
  ['no-fast-food', 'body', '🍔', 'abstinence',
    { title: 'Jours sans fast food', tagline: 'Rapide à manger, long à éliminer.' },
    { title: 'Days without fast food', tagline: 'Fast to eat, slow to burn off.' }],
  ['no-sugar', 'body', '🍬', 'abstinence',
    { title: 'Jours sans sucre ajouté ni soda', tagline: "Ton pancréas t'envoie des bisous.", chip: 'Sans sucre' },
    { title: 'Days without added sugar or soda', tagline: 'Your pancreas sends its love.', chip: 'No sugar' }],
  ['no-energy-drink', 'body', '⚡', 'abstinence',
    { title: 'Jours sans energy drink', tagline: "L'énergie, la vraie : dormir." },
    { title: 'Days without energy drinks', tagline: 'Real energy: sleep.' }],
  ['no-late-snacking', 'body', '🌙', 'abstinence',
    { title: 'Jours sans grignotage le soir', tagline: 'Le frigo ferme à 21 h.' },
    { title: 'Days without late-night snacking', tagline: 'The fridge closes at 9 pm.' }],
  ['no-late-coffee', 'body', '☕', 'abstinence',
    { title: 'Jours sans café après 14 h', tagline: 'Dors mieux, sois moins zombie.' },
    { title: 'Days without coffee after 2 pm', tagline: 'Sleep better, be less of a zombie.' }],
  ['no-porn', 'relationships', '🔞', 'abstinence',
    { title: 'Jours sans porno', tagline: 'Reprends la main. Façon de parler.' },
    { title: 'Days without porn', tagline: 'Get a grip. So to speak.' }],
  ['no-masturbation', 'relationships', '✋', 'abstinence',
    { title: 'Jours sans masturbation', tagline: 'Défi accepté ?' },
    { title: 'Days without masturbation', tagline: 'Challenge accepted?' }],
  ['no-ex-contact', 'relationships', '📵', 'abstinence',
    { title: 'Jours sans contacter mon ex', tagline: "Il y a une raison pour laquelle c'est ton ex." },
    { title: 'Days without texting my ex', tagline: "There's a reason they're your ex." }],
  ['no-ex-stalking', 'relationships', '👀', 'abstinence',
    { title: 'Jours sans stalker mon ex sur les réseaux', tagline: 'Sa story ne te concerne plus.' },
    { title: 'Days without stalking my ex online', tagline: "Their story isn't your business anymore." }],
  ['no-dating-apps', 'relationships', '💘', 'abstinence',
    { title: 'Jours sans app de dating', tagline: 'Moins swiper, plus vivre.' },
    { title: 'Days without dating apps', tagline: 'Swipe less, live more.' }],
  ['no-gambling', 'money', '🎲', 'abstinence',
    { title: "Jours sans paris sportifs ni jeux d'argent", tagline: "La banque gagne toujours. Pas aujourd'hui." },
    { title: 'Days without sports betting or gambling', tagline: 'The house always wins. Not today.' }],
  ['no-impulse-buying', 'money', '🛍️', 'abstinence',
    { title: 'Jours sans achat impulsif ni shopping en ligne', tagline: 'Le panier peut dormir 24 h.' },
    { title: 'Days without impulse buys or online shopping', tagline: 'Your cart can wait 24 hours.' }],
  ['no-food-delivery', 'money', '🛵', 'abstinence',
    { title: 'Jours sans livraison de repas', tagline: "Ta cuisine existe, on l'a vue." },
    { title: 'Days without food delivery', tagline: "Your kitchen exists, we've seen it." }],
  ['no-trading', 'money', '📉', 'abstinence',
    { title: 'Jours sans trading ni crypto compulsifs', tagline: 'Le graphique bougera sans toi.' },
    { title: 'Days without compulsive trading or crypto', tagline: 'The chart will move without you.' }],
  ['no-loot-boxes', 'money', '💎', 'abstinence',
    { title: 'Jours sans achats in-game ni loot boxes', tagline: 'Le skin ne te rendra pas heureux.' },
    { title: 'Days without in-game purchases or loot boxes', tagline: "That skin won't make you happy." }],
  ['training-program', 'discipline', '🏋️', 'habit',
    { title: "Jours en respectant mon programme d'entraînement", tagline: "Le plan, c'est le plan." },
    { title: 'Days sticking to my training plan', tagline: 'The plan is the plan.' }],
  ['sport-20', 'discipline', '🏃', 'habit',
    { title: '20 min de sport par jour', tagline: '20 minutes. Même pas un épisode.', chip: 'Sport' },
    { title: '20 min of exercise a day', tagline: '20 minutes. Not even an episode.', chip: 'Exercise' }],
  ['sport-3-week', 'discipline', '💪', 'habit',
    { title: 'Sport 3×/semaine', tagline: 'Trois fois. Pas de débat.' },
    { title: 'Exercise 3×/week', tagline: 'Three times. No debate.' },
    { periodicity: 'weekly', target: 3 }],
  ['daily-goals', 'discipline', '🎯', 'habit',
    { title: 'Jours en fixant mes objectifs le matin', tagline: "Une journée sans cap, c'est une journée subie." },
    { title: 'Days setting my goals in the morning', tagline: 'A day without direction is a day you just endure.' }],
  ['reading', 'discipline', '📖', 'habit',
    { title: '30 min de lecture par jour', tagline: "Un chapitre de plus que ton fil d'actu.", chip: 'Lecture' },
    { title: '30 min of reading a day', tagline: 'One more chapter than your feed.', chip: 'Reading' }],
  ['read-20-pages', 'discipline', '📚', 'habit',
    { title: 'Lire 20 pages par jour', tagline: '20 pages par jour, 30 livres par an.' },
    { title: 'Read 20 pages a day', tagline: '20 pages a day, 30 books a year.' }],
  ['bed-before-23', 'discipline', '😴', 'habit',
    { title: 'Jours couché avant 23 h', tagline: 'Le toi de demain te remercie déjà.' },
    { title: 'Days in bed before 11 pm', tagline: 'Tomorrow-you is already grateful.' }],
  ['water', 'discipline', '💧', 'habit',
    { title: "Boire 1,5 L d'eau par jour", tagline: 'Ta peau, tes reins et ta tête approuvent.' },
    { title: 'Drink 1.5 L of water a day', tagline: 'Your skin, kidneys and head approve.' }],
  ['steps', 'discipline', '👟', 'habit',
    { title: '10 000 pas par jour', tagline: "Un pas après l'autre, littéralement." },
    { title: '10,000 steps a day', tagline: 'One step at a time, literally.' }],
  ['call-grandma', 'discipline', '👵', 'habit',
    { title: 'Mois en ayant appelé ma grand-mère', tagline: 'Elle attend ton appel. Vraiment.' },
    { title: 'Months calling my grandma', tagline: "She's waiting for your call. Really." },
    { periodicity: 'monthly', target: 1 }],
  ['meditation', 'mind', '🧘', 'habit',
    { title: '10 min de méditation', tagline: 'Ne rien faire, mais bien.', chip: 'Méditation' },
    { title: '10 min of meditation', tagline: 'Doing nothing, but well.', chip: 'Meditation' }],
  ['journal', 'mind', '✍️', 'habit',
    { title: 'Journal du soir (5 min)', tagline: 'Vide ta tête avant de dormir.' },
    { title: 'Evening journal (5 min)', tagline: 'Empty your head before bed.' }],
  ['gratitude', 'mind', '🙏', 'habit',
    { title: '3 gratitudes par jour', tagline: 'Trois trucs bien. Il y en a toujours.' },
    { title: '3 gratitudes a day', tagline: "Three good things. There's always some." }],
  ['no-complaining', 'mind', '🤐', 'abstinence',
    { title: 'Jours sans me plaindre', tagline: 'Essaie. Juste pour voir.' },
    { title: 'Days without complaining', tagline: 'Try it. Just to see.' }],
]

export const PRESETS: Preset[] = ROWS.map(([id, category, icon, kind, fr, en, period]) => ({
  id,
  category,
  icon,
  kind,
  periodicity: period?.periodicity ?? 'daily',
  ...(period ? { target: period.target } : {}),
  text: { fr, en },
}))

/** Puces mises en avant, dans l'ordre d'affichage. */
const FEATURED_IDS = ['no-alcohol', 'no-tobacco', 'sport-20', 'reading', 'meditation', 'no-sugar']

export const FEATURED_PRESETS: Preset[] = FEATURED_IDS.map((id) => {
  const preset = PRESETS.find((p) => p.id === id)
  if (!preset?.text.fr.chip || !preset.text.en.chip) throw new Error(`Puce manquante pour le preset « ${id} »`)
  return preset
})

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
