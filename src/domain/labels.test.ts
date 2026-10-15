import { describe, expect, it } from 'vitest'
import { bestLabel, confirmSubtitle, doneLabel, progressLabel, unitLabel, validatedPeriodLabel } from './labels.ts'

describe('labels', () => {
  it('unités : pluriel à partir de 2', () => {
    expect(unitLabel('daily', 0)).toBe('jour')
    expect(unitLabel('daily', 1)).toBe('jour')
    expect(unitLabel('daily', 2)).toBe('jours')
    expect(unitLabel('weekly', 5)).toBe('semaines')
    expect(unitLabel('weekly', 1)).toBe('semaine')
    expect(unitLabel('monthly', 1)).toBe('mois')
    expect(unitLabel('monthly', 3)).toBe('mois')
  })
  it('best / done', () => {
    expect(bestLabel(33)).toBe('Best : 33')
    expect(doneLabel('habit')).toBe('Fait')
    expect(doneLabel('abstinence')).toBe('Tenu')
  })
  it('sous-titre de confirmation', () => {
    expect(confirmSubtitle({ kind: 'habit', title: 'Sport' }, false)).toBe("Tu as fait « Sport » aujourd'hui.")
    expect(confirmSubtitle({ kind: 'abstinence', title: 'Sans alcool' }, true)).toBe('Tu as tenu « Sans alcool » hier.')
  })
  it('progression', () => {
    expect(progressLabel({ progress: { count: 2, target: 3 } }, 'weekly')).toBe('2/3 cette semaine')
    expect(progressLabel({ progress: { count: 1, target: 4 } }, 'monthly')).toBe('1/4 ce mois')
    expect(progressLabel({ progress: { count: 0, target: 1 } }, 'weekly')).toBeNull()
    expect(progressLabel({ progress: { count: 0, target: 1 } }, 'daily')).toBeNull()
  })
  it('période validée', () => {
    expect(validatedPeriodLabel('weekly')).toBe('Semaine validée')
    expect(validatedPeriodLabel('monthly')).toBe('Mois validé')
    expect(validatedPeriodLabel('daily')).toBe('Validé')
  })
})
