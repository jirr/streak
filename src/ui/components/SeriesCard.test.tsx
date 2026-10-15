import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { nextCheckTarget } from '../../domain/checkins.ts'
import { computeStats } from '../../domain/streaks.ts'
import type { Series } from '../../domain/types.ts'
import { at, checks, makeSeries } from '../../test/fixtures.ts'
import { SeriesCard } from './SeriesCard.tsx'

const now = at(2026, 10, 15, 10)

function renderCard(series: Series, days: string[], view: 'grid' | 'list' = 'grid') {
  const data = checks(series.id, days, series.periodicity)
  render(
    <SeriesCard
      series={series}
      stats={computeStats(series, data, now, 4)}
      graceHour={4}
      target={nextCheckTarget(series, data, now, 4)}
      view={view}
      onOpen={() => {}}
      onAction={() => {}}
    />,
  )
}

describe('SeriesCard', () => {
  it('abstinence cochée : « Tenu ✓ »', () => {
    renderCard(makeSeries({ kind: 'abstinence' }), ['2026-10-14', '2026-10-15'])
    expect(screen.getByRole('button', { name: /Tenu ✓/ })).toBeInTheDocument()
  })

  it('habitude cochée : « Fait ✓ »', () => {
    renderCard(makeSeries({ kind: 'habit' }), ['2026-10-15'], 'list')
    expect(screen.getByRole('button', { name: /Fait ✓/ })).toBeInTheDocument()
  })

  it('à cocher : bouton « Cocher » actif', () => {
    renderCard(makeSeries(), [])
    expect(screen.getByRole('button', { name: /Cocher/ })).toBeEnabled()
  })

  it('weekly cible atteinte un autre jour : « Semaine validée » désactivé, progression affichée', () => {
    const weekly = makeSeries({ periodicity: 'weekly', target: 2 })
    renderCard(weekly, ['2026-10-12', '2026-10-13'])
    expect(screen.getByRole('button', { name: /Semaine validée/ })).toBeDisabled()
  })

  it('weekly en cours : progression « 1/3 cette semaine »', () => {
    renderCard(makeSeries({ periodicity: 'weekly', target: 3 }), ['2026-10-12'])
    expect(screen.getByText('1/3 cette semaine')).toBeInTheDocument()
  })
})
