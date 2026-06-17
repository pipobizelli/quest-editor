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
  | { type: 'room:revealed'; groupId: string }
  // Play-mode: corridor tiles were revealed (clicking a corridor tile reveals it
  // plus its line-of-sight neighbours). `tiles` is the FULL revealed-tile set after
  // the reveal (keys "x,y") — a host persists it wholesale and restores via revealTiles.
  // Not emitted during restore (revealTiles is silent).
  | { type: 'corridor:revealed'; tiles: string[] }
  // Play-mode: a revealed location was right-clicked to search it. `groupId` is the
  // room when the tile is inside one, else null (corridor — use x,y). The host opens
  // a search menu, then calls `searchRoom(groupId, kind)` or `searchCorridor(x, y, kind)`.
  // Fires only for already-revealed rooms / corridor tiles.
  | { type: 'search:requested'; groupId: string | null; x: number; y: number }
  // Play-mode hook: fired when a monster is clicked in play mode. The editor does
  // NOT remove it — the host resolves who killed it (e.g. via a modal) and then
  // calls `removeElement(element.id)` on the QuestEditorHandle to take it off the board.
  | { type: 'monster:killed'; element: QuestElement }
  // Play-mode intercept hook (like monster:killed): a discovered trap was clicked.
  // The editor does NOT remove it — the host attributes the disarm and removes via removeElement.
  | { type: 'trap:disarmed'; element: QuestElement }
  // Hero placement (play mode), driven by `placeHeroes(heroes)` on the handle.
  // With a stairway, heroes auto-place around it → `heroes:placed`. Without one,
  // the editor enters click-to-place mode → `heroes:need-placement` (host shows a
  // hint; each board click drops the next hero) → `heroes:placed` when done.
  | { type: 'heroes:need-placement'; count: number }
  | { type: 'heroes:placed'; count: number }
  // Edit/play mode toggled. Entering play resets fog (a host restoring persisted fog
  // should re-apply it here); a host that logs play-only actions can gate on this.
  | { type: 'mode:changed'; mode: 'edit' | 'play' }
  | { type: 'plugin:event'; pluginId: string; action: string; data?: unknown }

export type EventEmitter = (event: EditorEvent) => void
