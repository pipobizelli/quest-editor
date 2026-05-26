import { describe, it, expect } from 'vitest'
import { createElement } from '@quest-editor/core'
import { createEditorStore } from '../src/store'

describe('undo/redo', () => {
  it('starts with no undo/redo available', () => {
    const store = createEditorStore()
    expect(store.getState().canUndo).toBe(false)
    expect(store.getState().canRedo).toBe(false)
  })

  it('can undo after adding an element', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    expect(store.getState().quest.elements).toHaveLength(1)
    expect(store.getState().canUndo).toBe(true)

    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(0)
    expect(store.getState().canUndo).toBe(false)
  })

  it('can redo after undo', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().undo()
    expect(store.getState().canRedo).toBe(true)

    store.getState().redo()
    expect(store.getState().quest.elements).toHaveLength(1)
    expect(store.getState().canRedo).toBe(false)
  })

  it('clears redo stack on new action', () => {
    const store = createEditorStore()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().undo()
    expect(store.getState().canRedo).toBe(true)

    // New action should clear redo
    store.getState().addElement(createElement('monster', 'orc', 8, 7))
    expect(store.getState().canRedo).toBe(false)
  })

  it('handles multiple undo steps', () => {
    const store = createEditorStore()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().addElement(createElement('monster', 'orc', 8, 7))
    store.getState().addElement(createElement('monster', 'skeleton', 10, 2))
    expect(store.getState().quest.elements).toHaveLength(3)

    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(2)
    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(1)
    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(0)
    expect(store.getState().canUndo).toBe(false)
  })

  it('handles multiple redo steps', () => {
    const store = createEditorStore()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().addElement(createElement('monster', 'orc', 8, 7))
    store.getState().undo()
    store.getState().undo()

    store.getState().redo()
    expect(store.getState().quest.elements).toHaveLength(1)
    store.getState().redo()
    expect(store.getState().quest.elements).toHaveLength(2)
    expect(store.getState().canRedo).toBe(false)
  })

  it('tracks moveElement', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().moveElement(goblin.id, 10, 10)
    expect(store.getState().quest.elements[0].position).toEqual({ x: 10, y: 10 })

    store.getState().undo()
    expect(store.getState().quest.elements[0].position).toEqual({ x: 5, y: 3 })
  })

  it('tracks removeElement', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().removeElement(goblin.id)
    expect(store.getState().quest.elements).toHaveLength(0)

    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(1)
    expect(store.getState().quest.elements[0].subtype).toBe('goblin')
  })

  it('tracks setQuest (plugin apply)', () => {
    const store = createEditorStore()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    const originalName = store.getState().quest.name

    store.getState().setQuest({
      ...store.getState().quest,
      name: 'Remixed Quest',
      elements: [],
    })
    expect(store.getState().quest.name).toBe('Remixed Quest')
    expect(store.getState().quest.elements).toHaveLength(0)

    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(1)
    expect(store.getState().quest.name).toBe(originalName)
  })

  it('tracks toggleDisabledTile', () => {
    const store = createEditorStore()
    store.getState().toggleDisabledTile(5, 5)
    expect(store.getState().quest.disabledTiles).toHaveLength(1)

    store.getState().undo()
    expect(store.getState().quest.disabledTiles).toHaveLength(0)
  })

  it('tracks rotateSelected', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    store.getState().rotateSelected()
    expect(store.getState().quest.elements[0].rotation).toBe(90)

    store.getState().undo()
    expect(store.getState().quest.elements[0].rotation).toBeUndefined()
  })

  it('does nothing when undo with empty history', () => {
    const store = createEditorStore()
    store.getState().undo()
    expect(store.getState().quest.name).toBe('Untitled Quest')
  })

  it('does nothing when redo with empty future', () => {
    const store = createEditorStore()
    store.getState().redo()
    expect(store.getState().quest.name).toBe('Untitled Quest')
  })

  it('does not undo when locked', () => {
    const store = createEditorStore()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().lock()
    store.getState().undo()
    expect(store.getState().quest.elements).toHaveLength(1)
  })

  it('does not redo when locked', () => {
    const store = createEditorStore()
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().undo()
    store.getState().lock()
    store.getState().redo()
    expect(store.getState().quest.elements).toHaveLength(0)
  })

  it('clears selection on undo/redo', () => {
    const store = createEditorStore()
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    expect(store.getState().selectedElementId).toBe(goblin.id)

    store.getState().undo()
    expect(store.getState().selectedElementId).toBeNull()
  })
})
