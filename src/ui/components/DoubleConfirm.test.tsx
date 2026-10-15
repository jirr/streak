import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DoubleConfirm } from './DoubleConfirm.tsx'

function setup(onConfirm: () => void | Promise<void> = vi.fn()) {
  const onCancel = vi.fn()
  render(<DoubleConfirm open subtitle="Tu as tenu « X » aujourd'hui." onConfirm={onConfirm} onCancel={onCancel} />)
  return { onConfirm, onCancel, user: userEvent.setup() }
}

describe('DoubleConfirm', () => {
  it('Oui puis Oui : onConfirm appelé une fois ; le texte de l’étape 2 n’apparaît qu’après le 1er Oui', async () => {
    const { onConfirm, user } = setup()
    expect(screen.getByText("C'est vrai ?")).toBeInTheDocument()
    expect(screen.queryByText("T'es pas en train de te mentir à toi-même ?")).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Oui' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText("T'es pas en train de te mentir à toi-même ?")).toBeInTheDocument()
    expect(screen.getByText('Personne ne vérifie. À part toi.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Oui' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('Non à l’étape 1 : message puis onCancel, jamais de confirmation', async () => {
    const { onConfirm, onCancel, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Non' }))
    expect(screen.getByText("Pas grave. L'honnêteté, ça compte aussi.")).toBeInTheDocument()
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1), { timeout: 2500 })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Oui puis Non : pas de confirmation', async () => {
    const { onConfirm, onCancel, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Oui' }))
    await user.click(screen.getByRole('button', { name: 'Non' }))
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1), { timeout: 2500 })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Escape équivaut à Non', async () => {
    const { onConfirm, onCancel, user } = setup()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1), { timeout: 2500 })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('double-clic rapide sur Oui (étape 2) : onConfirm une seule fois', async () => {
    let release!: () => void
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (release = resolve)))
    const { user } = setup(onConfirm)
    await user.click(screen.getByRole('button', { name: 'Oui' }))
    await user.dblClick(screen.getByRole('button', { name: 'Oui' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    release()
  })

  it('le focus va sur Oui à chaque étape', async () => {
    const { user } = setup()
    expect(screen.getByRole('button', { name: 'Oui' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Oui' }))
    expect(screen.getByRole('button', { name: 'Oui' })).toHaveFocus()
  })
})
