import type { Quest, QuestElement } from '@quest-editor/core'

export type EditorEvent =
  | { type: 'element:added'; element: QuestElement }
  | { type: 'element:removed'; element: QuestElement }
  | { type: 'element:moved'; element: QuestElement; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: 'element:updated'; element: QuestElement; changes: Partial<QuestElement> }
  | { type: 'element:rotated'; element: QuestElement }
  | { type: 'quest:loaded'; quest: Quest }
  | { type: 'quest:undo'; quest: Quest }
  | { type: 'quest:redo'; quest: Quest }
  | { type: 'plugin:event'; pluginId: string; action: string; data?: unknown }

export type EventEmitter = (event: EditorEvent) => void
