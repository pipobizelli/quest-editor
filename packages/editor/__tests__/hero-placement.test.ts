import { describe, it, expect, vi } from 'vitest'
import { createQuest, createElement } from '@quest-editor/core'
import { createEditorStore } from '../src/store'
import type { EditorEvent } from '../src/events'

const PARTY = [{ subtype: 'barbarian' }, { subtype: 'dwarf' }, { subtype: 'elf' }, { subtype: 'wizard' }]

function questWithStairway() {
  // 2×2 stairway → 4 free start tiles (the marker itself doesn't block heroes).
  const stairway = createElement('marker', 'stairway', 1, 1, { width: 2, height: 2 })
  return createQuest({ name: 'With stairway', elements: [stairway] })
}

const heroes = (store: ReturnType<typeof createEditorStore>) =>
  store.getState().quest.elements.filter((e) => e.type === 'hero')

describe('hero placement', () => {
  it('auto-places the party around the stairway and emits heroes:placed', () => {
    const handler = vi.fn()
    const store = createEditorStore(questWithStairway(), handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().placeHeroes(PARTY)

    expect(heroes(store)).toHaveLength(4)
    expect(heroes(store).map((h) => h.subtype).sort()).toEqual(['barbarian', 'dwarf', 'elf', 'wizard'])
    expect(handler).toHaveBeenCalledWith({ type: 'heroes:placed', count: 4 })
    expect(store.getState().placingHeroes).toEqual([])
  })

  it('carries each hero label into the placed element metadata', () => {
    const store = createEditorStore(questWithStairway())
    store.getState().setMode('play')

    store.getState().placeHeroes([
      { subtype: 'barbarian', label: 'Conan' },
      { subtype: 'barbarian', label: 'Krull' },
      { subtype: 'elf', label: 'Legolas' },
      { subtype: 'wizard' },
    ])

    const byLabel = heroes(store).map((h) => h.metadata?.label)
    expect(byLabel).toContain('Conan')
    expect(byLabel).toContain('Krull') // two barbarians, distinguishable
    expect(byLabel).toContain('Legolas')
  })

  it('without a stairway, enters click-to-place mode and emits heroes:need-placement', () => {
    const handler = vi.fn()
    const store = createEditorStore(createQuest({ name: 'No stairway' }), handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().placeHeroes([{ subtype: 'barbarian' }, { subtype: 'elf' }])

    expect(heroes(store)).toHaveLength(0)
    expect(store.getState().placingHeroes).toHaveLength(2)
    expect(handler).toHaveBeenCalledWith({ type: 'heroes:need-placement', count: 2 })
  })

  it('placeNextHeroAt drops queued heroes one per click, then emits heroes:placed', () => {
    const handler = vi.fn()
    const store = createEditorStore(createQuest({ name: 'No stairway' }), handler)
    store.getState().setMode('play')
    store.getState().placeHeroes([{ subtype: 'barbarian' }, { subtype: 'elf' }])
    handler.mockClear()

    store.getState().placeNextHeroAt(5, 5)
    expect(heroes(store)).toHaveLength(1)
    expect(store.getState().placingHeroes).toHaveLength(1)

    store.getState().placeNextHeroAt(6, 5)
    expect(heroes(store)).toHaveLength(2)
    expect(store.getState().placingHeroes).toEqual([])
    expect(handler).toHaveBeenCalledWith({ type: 'heroes:placed', count: 2 })
  })

  it('placeNextHeroAt skips an occupied tile', () => {
    const store = createEditorStore(createQuest({ name: 'No stairway' }))
    store.getState().setMode('play')
    store.getState().placeHeroes([{ subtype: 'barbarian' }])
    // Drop on a tile already taken by furniture.
    store.getState().setMode('edit') // add furniture without play guards
    const table = createElement('furniture', 'table', 5, 5, { width: 1, height: 1 })
    store.getState().addElement(table)
    store.getState().setMode('play')
    store.getState().placeHeroes([{ subtype: 'barbarian' }])

    store.getState().placeNextHeroAt(5, 5) // occupied → no-op
    expect(heroes(store)).toHaveLength(0)
    store.getState().placeNextHeroAt(7, 7) // free
    expect(heroes(store)).toHaveLength(1)
  })

  it('reveals the room where a hero is placed (auto)', () => {
    // Stairway inside room r1 → auto-places heroes there → reveals r1.
    const room = { id: 'r1', x: 5, y: 5, width: 4, height: 4 }
    const stairway = createElement('marker', 'stairway', 6, 6, { width: 2, height: 2 })
    const store = createEditorStore(
      createQuest({ name: 'Stair room', layout: { rooms: [room], walls: [] }, elements: [stairway] }),
    )
    store.getState().setMode('play')
    expect(store.getState().revealedGroups.size).toBe(0)

    store.getState().placeHeroes([{ subtype: 'barbarian' }])

    expect(store.getState().revealedGroups.has('r1')).toBe(true)
  })

  it('reveals the room where a hero is dropped (manual click-to-place)', () => {
    const room = { id: 'r1', x: 5, y: 5, width: 4, height: 4 }
    const store = createEditorStore(
      createQuest({ name: 'No stairway', layout: { rooms: [room], walls: [] } }),
    )
    store.getState().setMode('play')
    store.getState().placeHeroes([{ subtype: 'barbarian' }])
    expect(store.getState().revealedGroups.has('r1')).toBe(false)

    store.getState().placeNextHeroAt(6, 6) // inside r1

    expect(store.getState().revealedGroups.has('r1')).toBe(true)
  })

  it('manual placement clears auto-placed heroes and re-enters click-to-place (even with a stairway)', () => {
    const handler = vi.fn()
    const store = createEditorStore(questWithStairway(), handler)
    store.getState().setMode('play')
    store.getState().placeHeroes(PARTY) // auto-places around the stairway
    expect(heroes(store)).toHaveLength(4)
    handler.mockClear()

    store.getState().placeHeroes(PARTY, { manual: true })

    expect(heroes(store)).toHaveLength(0) // cleared
    expect(store.getState().placingHeroes).toHaveLength(4)
    expect(handler).toHaveBeenCalledWith({ type: 'heroes:need-placement', count: 4 })
  })

  it('places a wandering monster on a free tile next to a hero, and reveals it', () => {
    const room = { id: 'r1', x: 5, y: 5, width: 4, height: 4 }
    const store = createEditorStore(createQuest({ name: 'WM', layout: { rooms: [room], walls: [] } }))
    store.getState().setMode('play')
    store.getState().placeHeroes([{ subtype: 'barbarian' }]) // no stairway → manual queue
    store.getState().placeNextHeroAt(6, 6)

    const placed = store.getState().placeMonsterNearHero('orc', 'barbarian')

    expect(placed).toBe(true)
    const monsters = store.getState().quest.elements.filter((e) => e.type === 'monster')
    expect(monsters).toHaveLength(1)
    const dx = Math.abs(monsters[0].position.x - 6)
    const dy = Math.abs(monsters[0].position.y - 6)
    expect(dx <= 1 && dy <= 1 && dx + dy > 0).toBe(true) // adjacent, not on top
  })

  it('placeMonsterNearHero returns false when the hero is not on the board', () => {
    const store = createEditorStore(createQuest({ name: 'WM' }))
    store.getState().setMode('play')
    expect(store.getState().placeMonsterNearHero('orc', 'barbarian')).toBe(false)
  })

  it('placeHeroes is a no-op outside play mode', () => {
    const handler = vi.fn()
    const store = createEditorStore(questWithStairway(), handler)
    handler.mockClear()

    store.getState().placeHeroes(PARTY)

    expect(heroes(store)).toHaveLength(0)
    expect(handler).not.toHaveBeenCalled()
  })

  it('clears the placement queue when leaving play mode', () => {
    const store = createEditorStore(createQuest({ name: 'No stairway' }))
    store.getState().setMode('play')
    store.getState().placeHeroes([{ subtype: 'barbarian' }])
    expect(store.getState().placingHeroes).toHaveLength(1)

    store.getState().setMode('edit')
    expect(store.getState().placingHeroes).toEqual([])
  })
})
