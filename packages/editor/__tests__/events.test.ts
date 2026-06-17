import { describe, it, expect, vi } from 'vitest'
import { createElement } from '@quest-editor/core'
import { createEditorStore } from '../src/store'
import type { EditorEvent } from '../src/events'

describe('editor events', () => {
  it('emits element:added', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)

    expect(handler).toHaveBeenCalledWith({
      type: 'element:added',
      element: goblin,
    })
  })

  it('emits element:removed with the removed element', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    handler.mockClear()

    store.getState().removeElement(goblin.id)

    expect(handler).toHaveBeenCalledWith({
      type: 'element:removed',
      element: goblin,
    })
  })

  it('emits element:removed for each element in removeSelected', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const g1 = createElement('monster', 'goblin', 5, 3)
    const g2 = createElement('monster', 'orc', 8, 7)
    store.getState().addElement(g1)
    store.getState().addElement(g2)
    store.getState().selectElements([g1.id, g2.id])
    handler.mockClear()

    store.getState().removeSelected()

    const removed = handler.mock.calls.filter(([e]: [EditorEvent]) => e.type === 'element:removed')
    expect(removed).toHaveLength(2)
  })

  it('emits element:moved with from/to positions', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    handler.mockClear()

    store.getState().moveElement(goblin.id, 10, 10)

    expect(handler).toHaveBeenCalledWith({
      type: 'element:moved',
      element: goblin,
      from: { x: 5, y: 3 },
      to: { x: 10, y: 10 },
    })
  })

  it('setElementPosition repositions WITHOUT emitting element:moved', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    handler.mockClear()

    store.getState().setElementPosition(goblin.id, 2, 2)

    expect(store.getState().quest.elements.find((e) => e.id === goblin.id)?.position).toEqual({ x: 2, y: 2 })
    expect(handler.mock.calls.some(([e]: [EditorEvent]) => e.type === 'element:moved')).toBe(false)
  })

  it('emits element:updated with changes', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    handler.mockClear()

    store.getState().updateElement(goblin.id, { subtype: 'orc' })

    expect(handler).toHaveBeenCalledWith({
      type: 'element:updated',
      element: goblin,
      changes: { subtype: 'orc' },
    })
  })

  it('emits element:rotated', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().selectElement(goblin.id)
    handler.mockClear()

    store.getState().rotateSelected()

    expect(handler).toHaveBeenCalledWith({
      type: 'element:rotated',
      element: goblin,
    })
  })

  it('emits quest:loaded on setQuest', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const quest = { ...store.getState().quest, name: 'New Quest' }
    store.getState().setQuest(quest)

    expect(handler).toHaveBeenCalledWith({
      type: 'quest:loaded',
      quest,
    })
  })

  it('emits quest:undo', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    handler.mockClear()

    store.getState().undo()

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quest:undo' }),
    )
  })

  it('emits quest:redo', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().undo()
    handler.mockClear()

    store.getState().redo()

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quest:redo' }),
    )
  })

  it('emits monster:killed on killMonster in play mode without removing', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().killMonster(goblin.id)

    expect(handler).toHaveBeenCalledWith({ type: 'monster:killed', element: goblin })
    // Intercept semantics: monster stays on the board until the host removes it
    expect(store.getState().quest.elements).toContainEqual(goblin)
  })

  it('killMonster is a no-op outside play mode', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const goblin = createElement('monster', 'goblin', 5, 3)
    store.getState().addElement(goblin)
    handler.mockClear()

    store.getState().killMonster(goblin.id)

    expect(handler).not.toHaveBeenCalled()
  })

  it('killMonster ignores non-monster elements', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    const block = createElement('furniture', 'block', 5, 3)
    store.getState().addElement(block)
    store.getState().setMode('play')
    handler.mockClear()

    store.getState().killMonster(block.id)

    const killed = handler.mock.calls.filter(([e]: [EditorEvent]) => e.type === 'monster:killed')
    expect(killed).toHaveLength(0)
  })

  it('does not emit when locked', () => {
    const handler = vi.fn()
    const store = createEditorStore(undefined, handler)
    store.getState().lock()
    handler.mockClear()

    store.getState().addElement(createElement('monster', 'goblin', 5, 3))
    store.getState().undo()

    expect(handler).not.toHaveBeenCalled()
  })
})
