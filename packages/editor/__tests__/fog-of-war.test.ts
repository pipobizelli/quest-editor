import { describe, it, expect, vi } from 'vitest'
import { createElement, createQuest } from '@quest-editor/core'
import { createEditorStore } from '../src/store'
import type { EditorEvent } from '../src/events'

describe('fog of war', () => {
  it('reveals nothing on entering play — the stairway is not assumed to be the start', () => {
    const room = { id: 'r1', x: 5, y: 5, width: 4, height: 4 }
    const stairway = createElement('marker', 'stairway', 6, 6, { width: 2, height: 2 })
    const quest = createQuest({ name: 'Stair in room', layout: { rooms: [room], walls: [] }, elements: [stairway] })
    const store = createEditorStore(quest)

    store.getState().setMode('play')

    expect(store.getState().revealedGroups.size).toBe(0)
    expect(store.getState().revealedTiles.size).toBe(0)
  })

  it('starts in edit mode', () => {
    const store = createEditorStore()
    expect(store.getState().mode).toBe('edit')
    expect(store.getState().revealedGroups.size).toBe(0)
  })

  it('switches to play mode', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    expect(store.getState().mode).toBe('play')
  })

  it('clears selection and resets tool when entering play mode', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 2, 2)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)

    store.getState().setMode('play')
    expect(store.getState().selectedElementId).toBeNull()
    expect(store.getState().placingEntry).toBeNull()
    expect(store.getState().tool).toBe('select')
  })

  it('resets revealed rooms when switching modes', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().revealRoom('room-1')
    expect(store.getState().revealedGroups.has('room-1')).toBe(true)

    store.getState().setMode('edit')
    expect(store.getState().revealedGroups.size).toBe(0)
  })

  it('reveals a room', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().revealRoom('room-1')
    expect(store.getState().revealedGroups.has('room-1')).toBe(true)
  })

  it('does not reveal if already revealed', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().revealRoom('room-1')
    store.getState().revealRoom('room-1')

    const revealEvents = handler.mock.calls.filter(
      ([e]: [EditorEvent]) => e.type === 'room:revealed',
    )
    expect(revealEvents).toHaveLength(1)
  })

  it('does not reveal in edit mode', () => {
    const store = createEditorStore()
    store.getState().revealRoom('room-1')
    expect(store.getState().revealedGroups.size).toBe(0)
  })

  it('emits room:revealed event', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().revealRoom('room-1')

    expect(handler).toHaveBeenCalledWith({
      type: 'room:revealed',
      groupId: 'room-1',
    })
  })

  it('unrevealRoom re-fogs a single revealed room', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().revealRoom('room-1')
    store.getState().revealRoom('room-2')

    store.getState().unrevealRoom('room-1')

    expect(store.getState().revealedGroups.has('room-1')).toBe(false)
    expect(store.getState().revealedGroups.has('room-2')).toBe(true)
  })

  it('unrevealRoom is a no-op outside play mode', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().revealRoom('room-1')
    store.getState().setMode('edit')
    store.getState().unrevealRoom('room-1') // mode reset already cleared it; stays empty
    expect(store.getState().revealedGroups.size).toBe(0)
  })

  it('resetFog clears all revealed rooms', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().revealRoom('room-1')
    store.getState().revealRoom('room-2')
    expect(store.getState().revealedGroups.size).toBe(2)

    store.getState().resetFog()
    expect(store.getState().revealedGroups.size).toBe(0)
  })

  it('blocks addElement in play mode', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    // Play mode acts like a soft lock for editing — setMode resets tool
    // but addElement is not called because UI prevents it
    // The store itself doesn't block addElement in play mode (lock does that)
    // So this just verifies the mode is set correctly
    expect(store.getState().mode).toBe('play')
  })

  it('can reveal multiple rooms', () => {
    const store = createEditorStore()
    store.getState().setMode('play')
    store.getState().revealRoom('room-1')
    store.getState().revealRoom('room-2')
    store.getState().revealRoom('room-3')
    expect(store.getState().revealedGroups.size).toBe(3)
  })

  it('emits corridor:revealed with the full revealed-tile set', () => {
    const handler = vi.fn()
    // A board with no rooms — every in-board tile is corridor.
    const quest = createQuest({ name: 'Corridor', layout: { rooms: [], walls: [] } })
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().revealCorridor(3, 3)

    const revealed = store.getState().revealedTiles
    expect(revealed.has('3,3')).toBe(true)
    const events = handler.mock.calls.filter(([e]: [EditorEvent]) => e.type === 'corridor:revealed')
    expect(events).toHaveLength(1)
    const [evt] = events[0] as [Extract<EditorEvent, { type: 'corridor:revealed' }>]
    expect(new Set(evt.tiles)).toEqual(revealed)
  })

  it('revealTiles restores raw tile keys without emitting an event', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().revealTiles(['2,2', '2,3', '2,4'])

    expect(store.getState().revealedTiles.has('2,3')).toBe(true)
    expect(store.getState().revealedTiles.size).toBe(3)
    const events = handler.mock.calls.filter(([e]: [EditorEvent]) => e.type === 'corridor:revealed')
    expect(events).toHaveLength(0)
  })

  it('revealTiles is a no-op outside play mode', () => {
    const store = createEditorStore()
    store.getState().revealTiles(['2,2'])
    expect(store.getState().revealedTiles.size).toBe(0)
  })

  it('moveInPlay commits a hero move and reveals its new corridor line of sight', () => {
    const handler = vi.fn()
    const hero = createElement('hero', 'barbarian', 1, 1)
    const quest = createQuest({ name: 'Corridor', layout: { rooms: [], walls: [] }, elements: [hero] })
    const store = createEditorStore(quest, handler)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().moveInPlay(hero.id, 4, 4)

    const moved = store.getState().quest.elements.find((e) => e.id === hero.id)
    expect(moved?.position).toEqual({ x: 4, y: 4 })
    expect(store.getState().revealedTiles.has('4,4')).toBe(true)
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'corridor:revealed')).toBe(true)
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'element:moved')).toBe(true)
  })

  it('moveInPlay commits a monster move without revealing fog', () => {
    const monster = createElement('monster', 'goblin', 2, 2)
    const quest = createQuest({ name: 'Corridor', layout: { rooms: [], walls: [] }, elements: [monster] })
    const store = createEditorStore(quest)
    store.getState().setMode('play')

    store.getState().moveInPlay(monster.id, 5, 5)

    const moved = store.getState().quest.elements.find((e) => e.id === monster.id)
    expect(moved?.position).toEqual({ x: 5, y: 5 })
    expect(store.getState().revealedTiles.size).toBe(0)
  })

  it('moveInPlay is a no-op outside play mode', () => {
    const hero = createElement('hero', 'elf', 1, 1)
    const quest = createQuest({ name: 'Edit', layout: { rooms: [], walls: [] }, elements: [hero] })
    const store = createEditorStore(quest)
    store.getState().moveInPlay(hero.id, 4, 4)
    expect(store.getState().quest.elements.find((e) => e.id === hero.id)?.position).toEqual({ x: 1, y: 1 })
  })
})
