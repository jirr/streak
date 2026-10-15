import { describe, expect, it } from 'vitest'
import { at, checks, makeSeries } from '../test/fixtures.ts'
import { buildBackup, parseBackup, shouldNudgeBackup } from './backup.ts'
import { DEFAULT_SETTINGS, type Profile } from './types.ts'

const profile: Profile = { id: 'p1', pseudo: 'Baptiste', gender: 'male', authProvider: 'local', createdAt: '2026-01-01T00:00:00.000Z' }
const series = [makeSeries({ presetId: 'no-alcohol' }), makeSeries({ id: 's2', periodicity: 'weekly', target: 3, archivedAt: '2026-05-01T00:00:00.000Z' })]
const backup = buildBackup(
  { profile, settings: { ...DEFAULT_SETTINGS, graceHour: 2, lastBackupAt: '2026-10-01T00:00:00.000Z' }, series, checkIns: checks('s1', ['2026-10-14', '2026-10-15']) },
  at(2026, 10, 15),
)

describe('backup', () => {
  it('aller-retour identique', () => {
    const r = parseBackup(JSON.stringify(backup))
    expect(r).toEqual({ ok: true, backup })
  })

  it('fusionne les réglages manquants avec les défauts, profil absent → null', () => {
    const r = parseBackup(JSON.stringify({ app: 'series', schemaVersion: 1, exportedAt: 'x', series: [], checkIns: [], settings: { graceHour: 1 } }))
    expect(r).toMatchObject({ ok: true, backup: { profile: null, settings: { ...DEFAULT_SETTINGS, graceHour: 1 } } })
  })

  const error = (v: unknown) => {
    const r = parseBackup(typeof v === 'string' ? v : JSON.stringify(v))
    return r.ok ? null : r.error
  }

  it('rejette JSON invalide et mauvais app', () => {
    expect(error('{pas du json')).toBe("Ce fichier n'est pas une sauvegarde Séries.")
    expect(error({ ...backup, app: 'autre' })).toBe("Ce fichier n'est pas une sauvegarde Séries.")
    expect(error([])).toBe("Ce fichier n'est pas une sauvegarde Séries.")
  })

  it('rejette schemaVersion 2', () => {
    expect(error({ ...backup, schemaVersion: 2 })).toBe('Version de sauvegarde non supportée.')
  })

  it('rejette un check-in sans dayKey ou avec dayKey malformé', () => {
    const { dayKey: _unused, ...broken } = backup.checkIns[0]
    expect(error({ ...backup, checkIns: [broken] })).toMatch(/^Sauvegarde corrompue : checkIns\[0\]\.dayKey/)
    expect(error({ ...backup, checkIns: [{ ...backup.checkIns[0], dayKey: '15/10/2026' }] })).toMatch(/dayKey invalide/)
  })

  it('rejette tableaux manquants et séries invalides', () => {
    expect(error({ ...backup, series: undefined })).toMatch(/series doit être un tableau/)
    expect(error({ ...backup, checkIns: 'x' })).toMatch(/checkIns doit être un tableau/)
    expect(error({ ...backup, series: [{ ...series[0], kind: 'zzz' }] })).toMatch(/series\[0\]\.kind invalide/)
    expect(error({ ...backup, series: [{ ...series[0], reminder: null }] })).toMatch(/reminder invalide/)
    expect(error({ ...backup, series: [{ ...series[0], target: 0 }] })).toMatch(/target invalide/)
    expect(error({ ...backup, series: [{ ...series[0], title: 3 }] })).toMatch(/title manquant/)
    expect(error({ ...backup, series: [null] })).toMatch(/series\[0\] invalide/)
    expect(error({ ...backup, profile: 'x' })).toMatch(/profile invalide/)
    expect(error({ ...backup, settings: 'x' })).toMatch(/settings invalide/)
  })
})

describe('shouldNudgeBackup', () => {
  const now = at(2026, 10, 15)
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000).toISOString()

  it('jamais sauvegardé, assez de coches : oui ; trop peu de coches : non', () => {
    expect(shouldNudgeBackup(7, DEFAULT_SETTINGS, now)).toBe(true)
    expect(shouldNudgeBackup(6, DEFAULT_SETTINGS, now)).toBe(false)
  })
  it('sauvegarde récente (≤ 14 j) : non ; ancienne : oui', () => {
    expect(shouldNudgeBackup(10, { ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(3) }, now)).toBe(false)
    expect(shouldNudgeBackup(10, { ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(20) }, now)).toBe(true)
  })
  it('rappel écarté récemment : non ; écarté il y a longtemps : oui', () => {
    expect(shouldNudgeBackup(10, { ...DEFAULT_SETTINGS, backupNudgeDismissedAt: daysAgo(2) }, now)).toBe(false)
    expect(shouldNudgeBackup(10, { ...DEFAULT_SETTINGS, backupNudgeDismissedAt: daysAgo(15) }, now)).toBe(true)
  })
})
