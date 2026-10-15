import { Bell, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAppStore, type SeriesDraft } from '../../app/store.ts'
import { QUICK_EMOJIS, isSingleEmoji } from '../../domain/emoji.ts'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_TINT,
  FEATURED_PRESETS,
  PRESETS,
  getPreset,
  type Preset,
} from '../../domain/presets.ts'
import { TINT_KEYS, type Periodicity, type Series, type SeriesKind, type TintKey } from '../../domain/types.ts'
import { Button } from '../components/Button.tsx'
import { DoubleConfirm } from '../components/DoubleConfirm.tsx'
import { EmojiPicker } from '../components/EmojiPicker.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { Segmented } from '../components/Segmented.tsx'
import { Toggle } from '../components/Toggle.tsx'
import styles from './SeriesForm.module.css'

type PeriodChoice = 'daily' | 'weekly' | 'custom'
type CustomPeriod = 'weekly' | 'monthly'

interface FormState {
  title: string
  icon: string
  color: TintKey
  kind: SeriesKind
  choice: PeriodChoice
  customPeriod: CustomPeriod
  target: number
  reminderEnabled: boolean
  reminderTime: string
  presetId?: string
}

const INITIAL: FormState = {
  title: '',
  icon: QUICK_EMOJIS[0],
  color: 'orange',
  kind: 'habit',
  choice: 'daily',
  customPeriod: 'weekly',
  target: 1,
  reminderEnabled: true,
  reminderTime: '21:00',
}

const MAX_TARGET: Record<CustomPeriod, number> = { weekly: 7, monthly: 28 }

function periodState(
  periodicity: Periodicity,
  target: number | undefined,
): Pick<FormState, 'choice' | 'customPeriod' | 'target'> {
  const t = Math.max(1, target ?? 1)
  if (periodicity === 'daily') return { choice: 'daily', customPeriod: 'weekly', target: 1 }
  if (periodicity === 'weekly' && t === 1) return { choice: 'weekly', customPeriod: 'weekly', target: 1 }
  return { choice: 'custom', customPeriod: periodicity, target: t }
}

function fromSeries(s: Series): FormState {
  return {
    title: s.title,
    icon: s.icon,
    color: s.color ?? 'orange',
    kind: s.kind,
    ...periodState(s.periodicity, s.target),
    reminderEnabled: s.reminder.enabled,
    reminderTime: s.reminder.time,
    presetId: s.presetId,
  }
}

function applyPreset(f: FormState, p: Preset): FormState {
  return {
    ...f,
    title: p.title,
    icon: p.icon,
    kind: p.kind,
    color: CATEGORY_TINT[p.category],
    presetId: p.id,
    ...periodState(p.periodicity, p.target),
  }
}

function toDraft(f: FormState): SeriesDraft {
  const periodicity: Periodicity =
    f.choice === 'daily' ? 'daily' : f.choice === 'weekly' ? 'weekly' : f.customPeriod
  const target = f.choice === 'daily' ? undefined : f.choice === 'weekly' ? 1 : f.target
  return {
    title: f.title.trim(),
    icon: f.icon,
    color: f.color,
    kind: f.kind,
    periodicity,
    target,
    reminder: { enabled: f.reminderEnabled, time: f.reminderTime || '21:00' },
    presetId: f.presetId,
  }
}

const KINDS = [
  { value: 'habit', label: 'Habitude' },
  { value: 'abstinence', label: 'Jours sans' },
] as const

const CHOICES = [
  { value: 'daily', label: 'Jour' },
  { value: 'weekly', label: 'Semaine' },
  { value: 'custom', label: 'Perso' },
] as const

const CUSTOM_PERIODS = [
  { value: 'weekly', label: 'Semaine' },
  { value: 'monthly', label: 'Mois' },
] as const

export function SeriesForm() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const series = useAppStore((s) => s.series.find((x) => x.id === id))
  if (id && !series) return <Navigate to="/" replace />
  return <FormBody key={id ?? 'new'} existing={series} initialPresetId={search.get('preset')} />
}

function FormBody({ existing, initialPresetId }: { existing?: Series; initialPresetId: string | null }) {
  const navigate = useNavigate()
  const createSeries = useAppStore((s) => s.createSeries)
  const updateSeries = useAppStore((s) => s.updateSeries)
  const archiveSeries = useAppStore((s) => s.archiveSeries)
  const deleteSeries = useAppStore((s) => s.deleteSeries)

  const [form, setForm] = useState<FormState>(() => {
    if (existing) return fromSeries(existing)
    const preset = initialPresetId ? getPreset(initialPresetId) : undefined
    return preset ? applyPreset(INITIAL, preset) : INITIAL
  })
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }))
  const titleLen = form.title.trim().length
  const valid = titleLen >= 1 && titleLen <= 60 && isSingleEmoji(form.icon)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const pickPreset = (p: Preset) => {
    setForm((f) => applyPreset(f, p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    if (existing) await updateSeries(existing.id, toDraft(form))
    else await createSeries(toDraft(form))
    navigate('/', { replace: true })
  }

  const icons = QUICK_EMOJIS.includes(form.icon) ? QUICK_EMOJIS : [...QUICK_EMOJIS, form.icon]
  const unit = form.customPeriod === 'weekly' ? 'semaine' : 'mois'

  return (
    <div className={styles.page}>
      <PageHeader title={existing ? 'Modifier la série' : 'Nouvelle série'} back="/" />
      <form className={styles.form} onSubmit={submit}>
        <section aria-labelledby="sugg">
          <h2 id="sugg" className={styles.eyebrow}>
            SUGGESTIONS
          </h2>
          <div className={styles.chips}>
            {FEATURED_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={form.presetId === p.id ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                onClick={() => pickPreset(p)}
              >
                {p.chip}
              </button>
            ))}
          </div>
          <button type="button" className={styles.link} onClick={() => setCatalogOpen((o) => !o)} aria-expanded={catalogOpen}>
            {catalogOpen ? 'Masquer le catalogue' : 'Voir tout le catalogue'}
          </button>
          {catalogOpen ? (
            <div className={styles.catalog}>
              {CATEGORY_ORDER.map((cat) => {
                const open = openCategories.has(cat)
                const items = PRESETS.filter((p) => p.category === cat)
                return (
                  <div key={cat} className={styles.category}>
                    <button
                      type="button"
                      className={styles.categoryHead}
                      aria-expanded={open}
                      onClick={() =>
                        setOpenCategories((prev) => {
                          const next = new Set(prev)
                          if (next.has(cat)) next.delete(cat)
                          else next.add(cat)
                          return next
                        })
                      }
                    >
                      <span>{CATEGORY_LABELS[cat]}</span>
                      {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    {open
                      ? items.map((p) => (
                          <button key={p.id} type="button" className={styles.preset} onClick={() => pickPreset(p)}>
                            <span className={styles.presetTile} style={{ background: `var(--tint-${CATEGORY_TINT[cat]})` }}>
                              {p.icon}
                            </span>
                            <span className={styles.presetText}>
                              <strong>{p.title}</strong>
                              <small>{p.tagline}</small>
                            </span>
                          </button>
                        ))
                      : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ou invente la tienne</h2>

          <label className={styles.field}>
            <span className={styles.label}>Titre</span>
            <input
              className={styles.input}
              value={form.title}
              maxLength={60}
              placeholder="Ex. Jours sans grignoter"
              onChange={(e) => patch({ title: e.target.value, presetId: undefined })}
            />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Icône</span>
            <div className={styles.icons}>
              {icons.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={form.icon === e ? `${styles.icon} ${styles.iconActive}` : styles.icon}
                  onClick={() => patch({ icon: e })}
                  aria-label={`Icône ${e}`}
                  aria-pressed={form.icon === e}
                >
                  {e}
                </button>
              ))}
              <button type="button" className={`${styles.icon} ${styles.iconAdd}`} onClick={() => setPickerOpen(true)} aria-label="Plus d'icônes">
                <Plus size={22} />
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Couleur</span>
            <div className={styles.colors}>
              {TINT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={form.color === k ? `${styles.color} ${styles.colorActive}` : styles.color}
                  style={{ background: `var(--tint-${k})` }}
                  onClick={() => patch({ color: k })}
                  aria-label={`Couleur ${k}`}
                  aria-pressed={form.color === k}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.field}>
          <span className={styles.label}>Type</span>
          <Segmented label="Type" options={[...KINDS]} value={form.kind} onChange={(v) => v && patch({ kind: v })} />
        </section>

        <section className={styles.field}>
          <span className={styles.label}>Périodicité</span>
          <Segmented
            label="Périodicité"
            options={[...CHOICES]}
            value={form.choice}
            onChange={(v) => v && patch({ choice: v })}
          />
          {form.choice === 'custom' ? (
            <div className={styles.custom}>
              <span className={styles.label}>Période</span>
              <Segmented
                label="Période"
                options={[...CUSTOM_PERIODS]}
                value={form.customPeriod}
                onChange={(v) => v && patch({ customPeriod: v, target: Math.min(form.target, MAX_TARGET[v]) })}
              />
              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepBtn}
                  aria-label="Moins"
                  disabled={form.target <= 1}
                  onClick={() => patch({ target: form.target - 1 })}
                >
                  <Minus size={20} />
                </button>
                <span aria-live="polite">
                  Objectif : <strong>{form.target}</strong> jour{form.target >= 2 ? 's' : ''} par {unit}
                </span>
                <button
                  type="button"
                  className={styles.stepBtn}
                  aria-label="Plus"
                  disabled={form.target >= MAX_TARGET[form.customPeriod]}
                  onClick={() => patch({ target: form.target + 1 })}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className={`${styles.card} ${styles.reminder}`}>
          <Bell size={22} />
          <div className={styles.reminderText}>
            <strong>Rappel quotidien</strong>
            <small>Tous les jours à {form.reminderTime || '21:00'}</small>
          </div>
          <Toggle label="Rappel quotidien" checked={form.reminderEnabled} onChange={(v) => patch({ reminderEnabled: v })} />
          {form.reminderEnabled ? (
            <input
              className={`${styles.input} ${styles.time}`}
              type="time"
              aria-label="Heure du rappel"
              value={form.reminderTime}
              onChange={(e) => patch({ reminderTime: e.target.value })}
            />
          ) : null}
        </section>

        {existing ? (
          <section className={styles.danger}>
            <Button
              variant="secondary"
              fullWidth
              onClick={async () => {
                await archiveSeries(existing.id)
                navigate('/', { replace: true })
              }}
            >
              Archiver la série
            </Button>
            <Button variant="danger" fullWidth onClick={() => setConfirmDelete(true)}>
              Supprimer la série
            </Button>
          </section>
        ) : null}

        <div className={styles.sticky}>
          <Button type="submit" fullWidth disabled={!valid || busy}>
            {existing ? 'Enregistrer' : 'Lancer la série'}
          </Button>
        </div>
      </form>

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(e) => {
          patch({ icon: e })
          setPickerOpen(false)
        }}
      />

      {existing ? (
        <DoubleConfirm
          open={confirmDelete}
          titles={[`Supprimer « ${existing.title} » ?`, "Tout l'historique part avec. Sûr ?"]}
          subtitle=""
          finalSubtitle={null}
          declineMessage="Ok, on ne touche à rien."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteSeries(existing.id)
            navigate('/', { replace: true })
          }}
        />
      ) : null}
    </div>
  )
}
