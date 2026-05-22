import { create } from 'zustand'
import type { Quest, QuestElement, CatalogEntry } from '@quest-editor/core'
import {
  createQuest,
  addElement,
  removeElement,
  updateElement,
  moveElement,
} from '@quest-editor/core'

export interface EditorState {
  quest: Quest
  selectedElementId: string | null
  tool: 'select' | 'place' | 'erase'
  placingEntry: CatalogEntry | null

  setQuest: (quest: Quest) => void
  addElement: (element: QuestElement) => void
  removeElement: (id: string) => void
  removeSelected: () => void
  updateElement: (id: string, updates: Partial<QuestElement>) => void
  moveElement: (id: string, x: number, y: number) => void
  selectElement: (id: string | null) => void
  setTool: (tool: EditorState['tool']) => void
  startPlacing: (entry: CatalogEntry) => void
  stopPlacing: () => void
}

export const createEditorStore = (initialQuest?: Partial<Quest>) =>
  create<EditorState>((set) => ({
    quest: createQuest(initialQuest),
    selectedElementId: null,
    tool: 'select',
    placingEntry: null,

    setQuest: (quest) => set({ quest, selectedElementId: null }),
    addElement: (element) =>
      set((s) => ({ quest: addElement(s.quest, element) })),
    removeElement: (id) =>
      set((s) => ({
        quest: removeElement(s.quest, id),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
      })),
    removeSelected: () =>
      set((s) => {
        if (!s.selectedElementId) return s
        return {
          quest: removeElement(s.quest, s.selectedElementId),
          selectedElementId: null,
        }
      }),
    updateElement: (id, updates) =>
      set((s) => ({ quest: updateElement(s.quest, id, updates) })),
    moveElement: (id, x, y) =>
      set((s) => ({ quest: moveElement(s.quest, id, x, y) })),
    selectElement: (id) => set({ selectedElementId: id }),
    setTool: (tool) => set({ tool, placingEntry: tool !== 'place' ? null : undefined as any }),
    startPlacing: (entry) => set({ tool: 'place', placingEntry: entry, selectedElementId: null }),
    stopPlacing: () => set({ tool: 'select', placingEntry: null }),
  }))
