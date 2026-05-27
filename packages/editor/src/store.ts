import { create } from 'zustand'
import type { Quest, QuestElement, CatalogEntry, Position } from '@quest-editor/core'
import {
  createQuest,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  toggleTile,
  toggleTilesRect,
} from '@quest-editor/core'
import type { EventEmitter } from './events'

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function shouldSwapDimensions(rotation: number): boolean {
  const r = normalizeRotation(rotation)
  return r === 90 || r === 270
}

const MAX_HISTORY = 50

export interface EditorState {
  quest: Quest
  selectedElementId: string | null
  selectedElementIds: string[]
  tool: 'select' | 'place' | 'erase' | 'disable'
  placingEntry: CatalogEntry | null
  placingRotation: number
  dragRect: { x1: number; y1: number; x2: number; y2: number } | null
  locked: boolean
  lockReason: string | null

  // History
  _history: Quest[]
  _future: Quest[]
  canUndo: boolean
  canRedo: boolean

  setQuest: (quest: Quest) => void
  addElement: (element: QuestElement) => void
  removeElement: (id: string) => void
  removeSelected: () => void
  updateElement: (id: string, updates: Partial<QuestElement>) => void
  moveElement: (id: string, x: number, y: number) => void
  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
  setTool: (tool: EditorState['tool']) => void
  startPlacing: (entry: CatalogEntry) => void
  stopPlacing: () => void
  rotatePlacing: () => void
  rotateSelected: () => void
  toggleDisabledTile: (x: number, y: number) => void
  toggleDisabledRect: (x1: number, y1: number, x2: number, y2: number) => void
  setDragRect: (rect: EditorState['dragRect']) => void
  lock: (reason?: string) => void
  unlock: () => void
  undo: () => void
  redo: () => void
}

/** Push current quest to history and return the new quest + history state */
function pushHistory(s: EditorState, newQuest: Quest): Partial<EditorState> {
  const history = [...s._history, s.quest].slice(-MAX_HISTORY)
  return {
    quest: newQuest,
    _history: history,
    _future: [],
    canUndo: true,
    canRedo: false,
  }
}

export const createEditorStore = (initialQuest?: Partial<Quest>, emit?: EventEmitter) => {
  const emitEvent: EventEmitter = emit ?? (() => {})

  return create<EditorState>((set, get) => ({
    quest: createQuest(initialQuest),
    selectedElementId: null,
    selectedElementIds: [],
    tool: 'select',
    placingEntry: null,
    placingRotation: 0,
    dragRect: null,
    locked: false,
    lockReason: null,
    _history: [],
    _future: [],
    canUndo: false,
    canRedo: false,

    setQuest: (quest) => {
      set((s) => ({
        ...pushHistory(s, quest),
        selectedElementId: null,
        selectedElementIds: [],
      }))
      emitEvent({ type: 'quest:loaded', quest })
    },
    addElement: (element) => {
      const s = get()
      if (s.locked) return
      set((s) => pushHistory(s, addElement(s.quest, element)))
      emitEvent({ type: 'element:added', element })
    },
    removeElement: (id) => {
      const s = get()
      if (s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      set((s) => ({
        ...pushHistory(s, removeElement(s.quest, id)),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
        selectedElementIds: s.selectedElementIds.filter((i) => i !== id),
      }))
      if (el) emitEvent({ type: 'element:removed', element: el })
    },
    removeSelected: () => {
      const s = get()
      if (s.locked) return
      const ids = s.selectedElementIds.length > 0
        ? s.selectedElementIds
        : s.selectedElementId ? [s.selectedElementId] : []
      if (ids.length === 0) return
      const removed = ids.map((id) => s.quest.elements.find((e) => e.id === id)).filter(Boolean) as QuestElement[]
      let quest = s.quest
      for (const id of ids) {
        quest = removeElement(quest, id)
      }
      set((s) => ({
        ...pushHistory(s, quest),
        selectedElementId: null,
        selectedElementIds: [],
      }))
      for (const el of removed) {
        emitEvent({ type: 'element:removed', element: el })
      }
    },
    updateElement: (id, updates) => {
      const s = get()
      if (s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      set((s) => pushHistory(s, updateElement(s.quest, id, updates)))
      if (el) emitEvent({ type: 'element:updated', element: el, changes: updates })
    },
    moveElement: (id, x, y) => {
      const s = get()
      if (s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      set((s) => pushHistory(s, moveElement(s.quest, id, x, y)))
      if (el) emitEvent({ type: 'element:moved', element: el, from: { ...el.position }, to: { x, y } })
    },
    selectElement: (id) =>
      set((s) => {
        if (s.locked) return s
        return { selectedElementId: id, selectedElementIds: id ? [id] : [] }
      }),
    selectElements: (ids) =>
      set((s) => {
        if (s.locked) return s
        return {
          selectedElementIds: ids,
          selectedElementId: ids.length === 1 ? ids[0] : null,
        }
      }),
    setTool: (tool) =>
      set((s) => {
        if (s.locked) return s
        return {
          tool,
          placingEntry: tool !== 'place' ? null : undefined as any,
          selectedElementId: null,
          selectedElementIds: [],
          dragRect: null,
        }
      }),
    startPlacing: (entry) =>
      set((s) => {
        if (s.locked) return s
        return {
          tool: 'place', placingEntry: entry, placingRotation: 0,
          selectedElementId: null, selectedElementIds: [],
        }
      }),
    stopPlacing: () =>
      set((s) => {
        if (s.locked) return s
        return { tool: 'select', placingEntry: null }
      }),
    rotatePlacing: () =>
      set((s) => {
        if (s.locked) return s
        return { placingRotation: normalizeRotation(s.placingRotation + 90) }
      }),
    rotateSelected: () => {
      const s = get()
      if (s.locked || !s.selectedElementId) return
      const el = s.quest.elements.find((e) => e.id === s.selectedElementId)
      if (!el) return

      if (el.type === 'door' && el.subtype !== 'secret') {
        const newOrientation = el.orientation === 'vertical' ? 'horizontal' : 'vertical'
        set((s) => pushHistory(s, updateElement(s.quest, s.selectedElementId!, {
          orientation: newOrientation,
        })))
      } else {
        const currentRotation = el.rotation ?? 0
        const newRotation = normalizeRotation(currentRotation + 90)
        const w = el.width ?? 1
        const h = el.height ?? 1
        const wasSwapped = shouldSwapDimensions(currentRotation)
        const willSwap = shouldSwapDimensions(newRotation)
        const updates: Partial<QuestElement> = { rotation: newRotation }
        if (wasSwapped !== willSwap) {
          updates.width = h
          updates.height = w
        }
        set((s) => pushHistory(s, updateElement(s.quest, s.selectedElementId!, updates)))
      }
      emitEvent({ type: 'element:rotated', element: el })
    },
    toggleDisabledTile: (x, y) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, toggleTile(s.quest, x, y))
      }),
    toggleDisabledRect: (x1, y1, x2, y2) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, toggleTilesRect(s.quest, x1, y1, x2, y2))
      }),
    setDragRect: (rect) =>
      set((s) => {
        if (s.locked) return s
        return { dragRect: rect }
      }),
    lock: (reason) => set({
      locked: true,
      lockReason: reason ?? null,
      selectedElementId: null,
      selectedElementIds: [],
      placingEntry: null,
      tool: 'select',
    }),
    unlock: () => set({ locked: false, lockReason: null }),
    undo: () => {
      const s = get()
      if (s.locked || s._history.length === 0) return
      const history = [...s._history]
      const previous = history.pop()!
      set({
        quest: previous,
        _history: history,
        _future: [s.quest, ...s._future].slice(0, MAX_HISTORY),
        canUndo: history.length > 0,
        canRedo: true,
        selectedElementId: null,
        selectedElementIds: [],
      })
      emitEvent({ type: 'quest:undo', quest: previous })
    },
    redo: () => {
      const s = get()
      if (s.locked || s._future.length === 0) return
      const future = [...s._future]
      const next = future.shift()!
      set({
        quest: next,
        _history: [...s._history, s.quest].slice(-MAX_HISTORY),
        _future: future,
        canUndo: true,
        canRedo: future.length > 0,
        selectedElementId: null,
        selectedElementIds: [],
      })
      emitEvent({ type: 'quest:redo', quest: next })
    },
  }))
}
