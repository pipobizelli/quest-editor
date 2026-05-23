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

export interface EditorState {
  quest: Quest
  selectedElementId: string | null
  selectedElementIds: string[]
  tool: 'select' | 'place' | 'erase' | 'disable'
  placingEntry: CatalogEntry | null
  placingRotation: number
  dragRect: { x1: number; y1: number; x2: number; y2: number } | null

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

    setQuest: (quest) => set({ quest, selectedElementId: null, selectedElementIds: [] }),
    addElement: (element) =>
      set((s) => ({ quest: addElement(s.quest, element) })),
    removeElement: (id) =>
      set((s) => ({
        quest: removeElement(s.quest, id),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
        selectedElementIds: s.selectedElementIds.filter((i) => i !== id),
      })),
    removeSelected: () =>
      set((s) => {
        let quest = s.quest
        const ids = s.selectedElementIds.length > 0
          ? s.selectedElementIds
          : s.selectedElementId ? [s.selectedElementId] : []
        for (const id of ids) {
          quest = removeElement(quest, id)
        }
        return { quest, selectedElementId: null, selectedElementIds: [] }
      }),
    updateElement: (id, updates) =>
      set((s) => ({ quest: updateElement(s.quest, id, updates) })),
    moveElement: (id, x, y) =>
      set((s) => ({ quest: moveElement(s.quest, id, x, y) })),
    selectElement: (id) => set({ selectedElementId: id, selectedElementIds: id ? [id] : [] }),
    selectElements: (ids) => set({
      selectedElementIds: ids,
      selectedElementId: ids.length === 1 ? ids[0] : null,
    }),
    setTool: (tool) => set({
      tool,
      placingEntry: tool !== 'place' ? null : undefined as any,
      selectedElementId: null,
      selectedElementIds: [],
      dragRect: null,
    }),
    startPlacing: (entry) => set({
      tool: 'place', placingEntry: entry, placingRotation: 0,
      selectedElementId: null, selectedElementIds: [],
    }),
    stopPlacing: () => set({ tool: 'select', placingEntry: null }),
    rotatePlacing: () =>
      set((s) => ({ placingRotation: normalizeRotation(s.placingRotation + 90) })),
    rotateSelected: () =>
      set((s) => {
        if (!s.selectedElementId) return s
        const el = s.quest.elements.find((e) => e.id === s.selectedElementId)
        if (!el) return s
        const currentRotation = el.rotation ?? 0
        const newRotation = normalizeRotation(currentRotation + 90)
        const w = el.width ?? 1
        const h = el.height ?? 1
        // Swap dimensions when going between 0/180 and 90/270
        const wasSwapped = shouldSwapDimensions(currentRotation)
        const willSwap = shouldSwapDimensions(newRotation)
        const updates: Partial<QuestElement> = { rotation: newRotation }
        if (wasSwapped !== willSwap) {
          updates.width = h
          updates.height = w
        }
        return {
          quest: updateElement(s.quest, s.selectedElementId, updates),
        }
      }),
    toggleDisabledTile: (x, y) =>
      set((s) => ({ quest: toggleTile(s.quest, x, y) })),
    toggleDisabledRect: (x1, y1, x2, y2) =>
      set((s) => ({ quest: toggleTilesRect(s.quest, x1, y1, x2, y2) })),
    setDragRect: (rect) => set({ dragRect: rect }),
  }))
