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

describe('play-mode search', () => {
  it('searchRoom reveals room traps and returns the count', () => {
    const { quest, trap } = searchQuest()
    const store = createEditorStore(quest)
    store.getState().setMode('play')

    const n = store.getState().searchRoom('r1', 'traps')

    expect(n).toBe(1)
    expect(store.getState().discoveredElements.has(trap.id)).toBe(true)
  })

  it('searchRoom reveals secret doors', () => {
    const { quest, secret } = searchQuest()
    const store = createEditorStore(quest)
    store.getState().setMode('play')

    expect(store.getState().searchRoom('r1', 'secret')).toBe(1)
    expect(store.getState().discoveredElements.has(secret.id)).toBe(true)
  })

  it('a secret door on a shared wall is found from BOTH adjacent rooms', () => {
    // Two directly-adjacent rooms (wall between x=4 and x=5). Real secret doors are
    // tile blocks with NO orientation; this one sits in A's last column, on the shared wall.
    const a = { id: 'a', x: 1, y: 1, width: 4, height: 4 } // tiles x=1..4
    const b = { id: 'b', x: 5, y: 1, width: 4, height: 4 } // tiles x=5..8
    const secret = createElement('door', 'secret', 4, 2) // no orientation, tile inside A on the B wall
    const store = createEditorStore(
      createQuest({ name: 'Two rooms', layout: { rooms: [a, b], walls: [] }, elements: [secret] }),
    )
    store.getState().setMode('play')

    expect(store.getState().searchRoom('a', 'secret')).toBe(1) // contains the tile
    expect(store.getState().searchRoom('b', 'secret')).toBe(1) // borders the tile (the bug)
    expect(store.getState().discoveredElements.has(secret.id)).toBe(true)
  })

  it('a room↔corridor secret door is found from BOTH the room and the corridor', () => {
    const room = { id: 'r1', x: 5, y: 5, width: 3, height: 3 } // tiles x=5..7
    // Tile block on the corridor side of the room's right wall, no orientation.
    const secret = createElement('door', 'secret', 8, 6)
    const store = createEditorStore(
      createQuest({ name: 'Shared secret', layout: { rooms: [room], walls: [] }, elements: [secret] }),
    )
    store.getState().setMode('play')

    expect(store.getState().searchCorridor(8, 6, 'secret')).toBe(1) // its own corridor tile
    expect(store.getState().searchRoom('r1', 'secret')).toBe(1) // the room it borders
  })

  it('searchRoom returns 0 for an empty room and outside play mode', () => {
    const store = createEditorStore(
      createQuest({ name: 'Empty', layout: { rooms: [{ id: 'r1', x: 5, y: 5, width: 3, height: 3 }], walls: [] } }),
    )
    expect(store.getState().searchRoom('r1', 'traps')).toBe(0) // edit mode
    store.getState().setMode('play')
    expect(store.getState().searchRoom('r1', 'traps')).toBe(0) // nothing there
  })

  it('searchCorridor reveals traps on the clicked corridor tile', () => {
    const room = { id: 'r1', x: 5, y: 5, width: 3, height: 3 }
    const corridorTrap = createElement('trap', 'pittrap', 10, 10) // outside any room
    const store = createEditorStore(
      createQuest({ name: 'Corridor', layout: { rooms: [room], walls: [] }, elements: [corridorTrap] }),
    )
    store.getState().setMode('play')

    const n = store.getState().searchCorridor(10, 10, 'traps')

    expect(n).toBe(1)
    expect(store.getState().discoveredElements.has(corridorTrap.id)).toBe(true)
  })

  it('requestSearch emits search:requested only for a revealed room', () => {
    const handler = vi.fn()
    const { quest } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    // Room not revealed yet → no-op.
    store.getState().requestSearch(6, 6)
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'search:requested')).toBe(false)

    store.getState().revealRoom('r1')
    handler.mockClear()
    store.getState().requestSearch(6, 6) // (6,6) is inside room r1

    expect(handler).toHaveBeenCalledWith({ type: 'search:requested', groupId: 'r1', x: 6, y: 6 })
  })

  it('disarmTrap emits trap:disarmed only after the trap is found, without removing it', () => {
    const handler = vi.fn()
    const { quest, trap } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')

    // Not discovered yet — disarm is a no-op.
    store.getState().disarmTrap(trap.id)
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'trap:disarmed')).toBe(false)

    store.getState().searchRoom('r1', 'traps')
    store.getState().disarmTrap(trap.id)

    expect(handler).toHaveBeenCalledWith({ type: 'trap:disarmed', element: trap })
    expect(store.getState().quest.elements).toContainEqual(trap) // intercept: stays
  })

  it('revealDiscovered restores found elements (play mode) without emitting events', () => {
    const handler = vi.fn()
    const { quest, secret } = searchQuest()
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().revealDiscovered([secret.id])

    expect(store.getState().discoveredElements.has(secret.id)).toBe(true)
    expect(handler.mock.calls.length).toBe(0)
  })

  it('revealDiscovered is a no-op outside play mode', () => {
    const { quest, secret } = searchQuest()
    const store = createEditorStore(quest)
    store.getState().revealDiscovered([secret.id])
    expect(store.getState().discoveredElements.size).toBe(0)
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
