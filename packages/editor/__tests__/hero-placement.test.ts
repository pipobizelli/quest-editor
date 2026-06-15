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
