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

export const createEditorStore = (initialQuest?: Partial<Quest>) =>
  create<EditorState>((set) => ({
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

    setQuest: (quest) => set((s) => ({
      ...pushHistory(s, quest),
      selectedElementId: null,
      selectedElementIds: [],
    })),
    addElement: (element) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, addElement(s.quest, element))
      }),
    removeElement: (id) =>
      set((s) => {
        if (s.locked) return s
        return {
          ...pushHistory(s, removeElement(s.quest, id)),
          selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
          selectedElementIds: s.selectedElementIds.filter((i) => i !== id),
        }
      }),
    removeSelected: () =>
      set((s) => {
        if (s.locked) return s
        let quest = s.quest
        const ids = s.selectedElementIds.length > 0
          ? s.selectedElementIds
          : s.selectedElementId ? [s.selectedElementId] : []
        if (ids.length === 0) return s
        for (const id of ids) {
          quest = removeElement(quest, id)
        }
        return {
          ...pushHistory(s, quest),
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),
    updateElement: (id, updates) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, updateElement(s.quest, id, updates))
      }),
    moveElement: (id, x, y) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, moveElement(s.quest, id, x, y))
      }),
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
    rotateSelected: () =>
      set((s) => {
        if (s.locked) return s
        if (!s.selectedElementId) return s
        const el = s.quest.elements.find((e) => e.id === s.selectedElementId)
        if (!el) return s

        // Doors (non-secret) use orientation instead of rotation
        if (el.type === 'door' && el.subtype !== 'secret') {
          const newOrientation = el.orientation === 'vertical' ? 'horizontal' : 'vertical'
          return pushHistory(s, updateElement(s.quest, s.selectedElementId, {
            orientation: newOrientation,
          }))
        }

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
        return pushHistory(s, updateElement(s.quest, s.selectedElementId, updates))
      }),
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
    undo: () =>
      set((s) => {
        if (s.locked || s._history.length === 0) return s
        const history = [...s._history]
        const previous = history.pop()!
        return {
          quest: previous,
          _history: history,
          _future: [s.quest, ...s._future].slice(0, MAX_HISTORY),
          canUndo: history.length > 0,
          canRedo: true,
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),
    redo: () =>
      set((s) => {
        if (s.locked || s._future.length === 0) return s
        const future = [...s._future]
        const next = future.shift()!
        return {
          quest: next,
          _history: [...s._history, s.quest].slice(-MAX_HISTORY),
          _future: future,
          canUndo: true,
          canRedo: future.length > 0,
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),
  }))
