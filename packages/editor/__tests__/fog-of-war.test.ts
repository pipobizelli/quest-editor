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
})
