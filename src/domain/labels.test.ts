import { describe, expect, it } from 'vitest'
import { bestLabel, confirmSubtitle, doneLabel, progressLabel, unitLabel, validatedPeriodLabel } from './labels.ts'

describe('labels fr', () => {
  it('unités : pluriel à partir de 2', () => {
    expect(unitLabel('daily', 0, 'fr')).toBe('jour')
    expect(unitLabel('daily', 1, 'fr')).toBe('jour')
    expect(unitLabel('daily', 2, 'fr')).toBe('jours')
    expect(unitLabel('weekly', 5, 'fr')).toBe('semaines')
    expect(unitLabel('weekly', 1, 'fr')).toBe('semaine')
    expect(unitLabel('monthly', 1, 'fr')).toBe('mois')
    expect(unitLabel('monthly', 3, 'fr')).toBe('mois')
  })
  it('best / done', () => {
    expect(bestLabel(33, 'fr')).toBe('Best : 33')
    expect(doneLabel('habit', 'fr')).toBe('Fait')
    expect(doneLabel('abstinence', 'fr')).toBe('Tenu')
  })
  it('sous-titre de confirmation', () => {
    expect(confirmSubtitle({ kind: 'habit', title: 'Sport' }, false, 'fr')).toBe("Tu as fait « Sport » aujourd'hui.")
    expect(confirmSubtitle({ kind: 'abstinence', title: 'Sans alcool' }, true, 'fr')).toBe('Tu as tenu « Sans alcool » hier.')
  })
  it('progression', () => {
    expect(progressLabel({ progress: { count: 2, target: 3 } }, 'weekly', 'fr')).toBe('2/3 cette semaine')
    expect(progressLabel({ progress: { count: 1, target: 4 } }, 'monthly', 'fr')).toBe('1/4 ce mois')
    expect(progressLabel({ progress: { count: 0, target: 1 } }, 'weekly', 'fr')).toBeNull()
    expect(progressLabel({ progress: { count: 0, target: 1 } }, 'daily', 'fr')).toBeNull()
  })
  it('période validée', () => {
    expect(validatedPeriodLabel('weekly', 'fr')).toBe('Semaine validée')
    expect(validatedPeriodLabel('monthly', 'fr')).toBe('Mois validé')
    expect(validatedPeriodLabel('daily', 'fr')).toBe('Validé')
  })
})

describe('labels en', () => {
  it('unités : singulier seulement pour 1', () => {
    expect(unitLabel('daily', 0, 'en')).toBe('days')
    expect(unitLabel('daily', 1, 'en')).toBe('day')
    expect(unitLabel('weekly', 2, 'en')).toBe('weeks')
    expect(unitLabel('monthly', 1, 'en')).toBe('month')
    expect(unitLabel('monthly', 3, 'en')).toBe('months')
  })
  it('best / done / confirmation / progression', () => {
    expect(bestLabel(33, 'en')).toBe('Best: 33')
    expect(doneLabel('abstinence', 'en')).toBe('Held')
    expect(confirmSubtitle({ kind: 'habit', title: 'Gym' }, true, 'en')).toBe('You did “Gym” yesterday.')
    expect(confirmSubtitle({ kind: 'abstinence', title: 'No alcohol' }, false, 'en')).toBe('You stuck to “No alcohol” today.')
    expect(progressLabel({ progress: { count: 2, target: 3 } }, 'weekly', 'en')).toBe('2/3 this week')
    expect(validatedPeriodLabel('monthly', 'en')).toBe('Month done')
  })
})
