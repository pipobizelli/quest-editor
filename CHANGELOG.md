# Changelog

All notable changes to the published packages. This repo is a pnpm monorepo, so
versions are tracked per package. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## `@quest-editor/editor`

### 0.1.2 — 2026-06-12

#### Added
- **Play-mode `monster:killed` hook.** Clicking a monster in play mode emits
  `monster:killed` (carrying the element). It is an **intercept** hook — the editor
  does **not** remove the monster. The host reacts (e.g. opens a "who killed it?"
  modal) and removes the piece via the new `removeElement` handle method.
- `QuestEditorHandle.removeElement(id)` — lets a host remove an element (e.g. a
  killed monster) after handling a play-mode hook.

### 0.1.1 — earlier

#### Added
- React 19 support in peer dependencies (`^18.0.0 || ^19.0.0`).
- Fog-restore API on `QuestEditorHandle`: `revealRoom(groupId)` and
  `getRevealedGroups()`, so a host can persist and restore play-mode fog state.
- `room:revealed` event emitted when a room group is revealed in play mode.

### 0.1.0 — initial publish

#### Added
- `QuestEditor` React/Konva component with Zustand store, themes (dark, stone,
  parchment, light), undo/redo, lock system, validation panel, and fog-of-war play
  mode.
- Event system (`onEvent`): element add/remove/move/update/rotate, quest
  load/undo/redo, and `plugin:event` for plugin-emitted custom events.
- Plugin system (`EditorPlugin`) and the narrator / strategist / reinforcements /
  remix plugins.

## `@quest-editor/core`

### 0.1.0 — initial publish

#### Added
- Pure TypeScript core: quest types and immutable operations, board layout, tile
  utilities, validation, catalog, monster/hero stats, and game-rules constants for
  LLM prompts. No UI dependencies.
