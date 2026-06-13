import { describe, it, expect, vi } from 'vitest'
import { createQuest, createElement } from '@quest-editor/core'
import { createEditorStore } from '../src/store'
import type { EditorEvent } from '../src/events'

/** A quest with one room ('r1') holding a pit trap and a secret door. */
function searchQuest() {
  const room = { id: 'r1', x: 5, y: 5, width: 3, height: 3 }
  const trap = createElement('trap', 'pittrap', 6, 6)
  const secret = createElement('door', 'secret', 5, 5)
  const quest = createQuest({
    name: 'Search test',
    layout: { rooms: [room], walls: [] },
    elements: [trap, secret],
  })
  return { quest, trap, secret }
}

describe('play-mode search hooks', () => {
  it('search:traps reveals room traps and reports what was found', () => {
    const handler = vi.fn()
    const { quest, trap } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().searchRoom('r1', 'traps')

    expect(store.getState().discoveredElements.has(trap.id)).toBe(true)
    expect(handler).toHaveBeenCalledWith({ type: 'search:traps', groupId: 'r1', found: [trap] })
  })

  it('search:secret reveals secret doors', () => {
    const handler = vi.fn()
    const { quest, secret } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().searchRoom('r1', 'secret')

    expect(store.getState().discoveredElements.has(secret.id)).toBe(true)
    const evt = handler.mock.calls.map(([e]: [EditorEvent]) => e).find((e) => e.type === 'search:secret')
    expect(evt).toEqual({ type: 'search:secret', groupId: 'r1', found: [secret] })
  })

  it('search:treasure is abstract — emits without touching the board', () => {
    const handler = vi.fn()
    const { quest } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().searchRoom('r1', 'treasure')

    expect(store.getState().discoveredElements.size).toBe(0)
    expect(handler).toHaveBeenCalledWith({ type: 'search:treasure', groupId: 'r1' })
  })

  it('searching an empty room reports found: [] (searched, nothing there)', () => {
    const handler = vi.fn()
    const store = createEditorStore(createQuest({ name: 'Empty', layout: { rooms: [{ id: 'r1', x: 5, y: 5, width: 3, height: 3 }], walls: [] } }), handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().searchRoom('r1', 'traps')

    expect(handler).toHaveBeenCalledWith({ type: 'search:traps', groupId: 'r1', found: [] })
  })

  it('searchRoom is a no-op outside play mode', () => {
    const handler = vi.fn()
    const { quest } = searchQuest()
    const store = createEditorStore(quest, handler)
    handler.mockClear()

    store.getState().searchRoom('r1', 'traps')

    expect(handler).not.toHaveBeenCalled()
    expect(store.getState().discoveredElements.size).toBe(0)
  })

  it('disarmTrap emits trap:disarmed only for a discovered trap, without removing it', () => {
    const handler = vi.fn()
    const { quest, trap } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')

    // Not discovered yet — disarm is a no-op.
    store.getState().disarmTrap(trap.id)
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'trap:disarmed')).toBe(false)

    store.getState().searchRoom('r1', 'traps')
    handler.mockClear()
    store.getState().disarmTrap(trap.id)

    expect(handler).toHaveBeenCalledWith({ type: 'trap:disarmed', element: trap })
    // Intercept: trap stays until the host removes it.
    expect(store.getState().quest.elements).toContainEqual(trap)
  })

  it('activateRoom emits room:activated only for a revealed room in play mode', () => {
    const handler = vi.fn()
    const { quest } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    // Not revealed yet — no-op.
    store.getState().activateRoom('r1')
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'room:activated')).toBe(false)

    store.getState().revealRoom('r1')
    handler.mockClear()
    store.getState().activateRoom('r1')
    expect(handler).toHaveBeenCalledWith({ type: 'room:activated', groupId: 'r1' })
  })

  it('resets discovery when leaving play mode', () => {
    const { quest } = searchQuest()
    const store = createEditorStore(quest)
    store.getState().setMode('play')
    store.getState().searchRoom('r1', 'traps')
    expect(store.getState().discoveredElements.size).toBe(1)

    store.getState().setMode('edit')
    expect(store.getState().discoveredElements.size).toBe(0)
  })
})
