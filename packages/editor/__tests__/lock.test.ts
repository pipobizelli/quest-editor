import { describe, it, expect } from 'vitest'
import { createElement, type CatalogEntry } from '@quest-editor/core'
import { createEditorStore } from '../src/store'

describe('editor lock system', () => {
  it('starts unlocked', () => {
    const store = createEditorStore()
    expect(store.getState().locked).toBe(false)
    expect(store.getState().lockReason).toBeNull()
  })

  it('locks with a reason', () => {
    const store = createEditorStore()
    store.getState().lock('Generating...')
    expect(store.getState().locked).toBe(true)
    expect(store.getState().lockReason).toBe('Generating...')
  })

  it('locks without a reason', () => {
    const store = createEditorStore()
    store.getState().lock()
    expect(store.getState().locked).toBe(true)
    expect(store.getState().lockReason).toBeNull()
  })

  it('unlocks', () => {
    const store = createEditorStore()
    store.getState().lock('test')
    store.getState().unlock()
    expect(store.getState().locked).toBe(false)
    expect(store.getState().lockReason).toBeNull()
  })

  it('clears selection when locking', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    expect(store.getState().selectedElementId).toBe(goblin.id)

    store.getState().lock()
    expect(store.getState().selectedElementId).toBeNull()
    expect(store.getState().selectedElementIds).toEqual([])
  })

  it('resets tool to select when locking', () => {
    const store = createEditorStore()
    const entry: CatalogEntry = { type: 'monster', subtype: 'goblin', label: 'Goblin', width: 1, height: 1 }
    store.getState().startPlacing(entry)
    expect(store.getState().tool).toBe('place')

    store.getState().lock()
    expect(store.getState().tool).toBe('select')
    expect(store.getState().placingEntry).toBeNull()
  })

  it('blocks addElement when locked', () => {
    const store = createEditorStore()
    store.getState().lock()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    expect(store.getState().quest.elements).toHaveLength(0)
  })

  it('blocks removeElement when locked', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().lock()
    store.getState().removeElement(goblin.id)
    expect(store.getState().quest.elements).toHaveLength(1)
  })

  it('blocks moveElement when locked', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().lock()
    store.getState().moveElement(goblin.id, 10, 10)
    expect(store.getState().quest.elements[0].position).toEqual({ x: 5, y: 3 })
  })

  it('blocks updateElement when locked', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().lock()
    store.getState().updateElement(goblin.id, { subtype: 'orc' })
    expect(store.getState().quest.elements[0].subtype).toBe('goblin')
  })

  it('blocks selectElement when locked', () => {
    const store = createEditorStore()
    store.getState().lock()
    store.getState().selectElement('abc')
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('blocks setTool when locked', () => {
    const store = createEditorStore()
    store.getState().lock()
    store.getState().setTool('disable')
    expect(store.getState().tool).toBe('select')
  })

  it('blocks rotateSelected when locked', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    store.getState().lock()
    // lock clears selection, so rotateSelected has nothing to do
    store.getState().rotateSelected()
    expect(store.getState().quest.elements[0].rotation).toBeUndefined()
  })

  it('blocks removeSelected when locked', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    store.getState().lock()
    store.getState().removeSelected()
    expect(store.getState().quest.elements).toHaveLength(1)
  })

  it('allows setQuest even when locked (for plugin apply)', () => {
    const store = createEditorStore()
    store.getState().lock()
    store.getState().setQuest({
      id: 'new',
      name: 'Applied',
      description: '',
      board: { width: 10, height: 10, cellSize: 32 },
      layout: { rooms: [], walls: [] },
      elements: [],
    })
    expect(store.getState().quest.name).toBe('Applied')
  })
})
