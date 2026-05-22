import { describe, it, expect } from 'vitest'
import { createElement, type CatalogEntry } from '@quest-editor/core'
import { createEditorStore } from '../src/store'

describe('editor store', () => {
  it('initializes with a default quest', () => {
    const store = createEditorStore()
    const state = store.getState()
    expect(state.quest.name).toBe('Untitled Quest')
    expect(state.selectedElementId).toBeNull()
    expect(state.tool).toBe('select')
  })

  it('adds and removes elements', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)

    store.getState().addElement(goblin)
    expect(store.getState().quest.elements).toHaveLength(1)

    store.getState().removeElement(goblin.id)
    expect(store.getState().quest.elements).toHaveLength(0)
  })

  it('moves an element', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)

    store.getState().addElement(goblin)
    store.getState().moveElement(goblin.id, 10, 10)

    expect(store.getState().quest.elements[0].position).toEqual({ x: 10, y: 10 })
  })

  it('selects and deselects elements', () => {
    const store = createEditorStore()
    store.getState().selectElement('abc')
    expect(store.getState().selectedElementId).toBe('abc')

    store.getState().selectElement(null)
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('clears selection when removing selected element', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)

    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    store.getState().removeElement(goblin.id)

    expect(store.getState().selectedElementId).toBeNull()
  })

  it('replaces quest with setQuest', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 1, 1)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)

    store.getState().setQuest({
      id: 'new',
      name: 'New Quest',
      description: '',
      board: { width: 10, height: 10, cellSize: 32 },
      layout: { rooms: [], walls: [] },
      elements: [],
    })

    expect(store.getState().quest.name).toBe('New Quest')
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('removeSelected removes the selected element', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    store.getState().removeSelected()

    expect(store.getState().quest.elements).toHaveLength(0)
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('removeSelected does nothing when nothing is selected', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().removeSelected()

    expect(store.getState().quest.elements).toHaveLength(1)
  })

  it('startPlacing sets tool to place and stores entry', () => {
    const store = createEditorStore()
    const entry: CatalogEntry = { type: 'monster', subtype: 'goblin', label: 'Goblin', width: 1, height: 1 }
    store.getState().startPlacing(entry)

    expect(store.getState().tool).toBe('place')
    expect(store.getState().placingEntry).toEqual(entry)
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('stopPlacing resets tool and clears entry', () => {
    const store = createEditorStore()
    const entry: CatalogEntry = { type: 'monster', subtype: 'goblin', label: 'Goblin', width: 1, height: 1 }
    store.getState().startPlacing(entry)
    store.getState().stopPlacing()

    expect(store.getState().tool).toBe('select')
    expect(store.getState().placingEntry).toBeNull()
  })
})
