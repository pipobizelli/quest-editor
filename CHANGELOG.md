# Changelog

All notable changes to the published packages. This repo is a pnpm monorepo, so
versions are tracked per package. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## `@quest-editor/editor`

### Unreleased

#### Added
- **Hero placement.** `QuestEditorHandle.placeHeroes(heroes)` — in play mode, auto-places
  the party on free tiles around the stairway; with no stairway it enters click-to-place
  (`heroes:need-placement` → each board click drops the next hero → `heroes:placed`).

#### Changed
- Heroes are **always visible in play mode** — the party's own pieces are never fog-hidden.

#### Fixed
- Entering play mode now also reveals the **room the stairway sits in**. A stairway placed
  inside a room previously left the whole board fogged (ray-cast finds no corridor to reveal)
  — i.e. a black screen at session start.

### 0.1.5 — 2026-06-13

#### Changed
- **Play-mode kill/disarm is now a delete gesture, not a click.** Clicking a monster
  or discovered trap in play mode now **selects** it (selection is shown in play mode);
  pressing **Delete/Backspace** fires `monster:killed` / `trap:disarmed`. Clicking no
  longer fires the hook directly. The events are unchanged, so hosts need no changes.

### 0.1.4 — 2026-06-13

#### Added
- `room:activated` event — clicking a revealed room's floor in play mode emits it
  (with `groupId`), so a host can open a search menu for that room and then call
  `searchRoom`. Fires only for already-revealed rooms.

### 0.1.3 — 2026-06-13

#### Added
- **Play-mode discovery layer + search hooks.** Room traps and secret doors now
  stay hidden in play mode even after their room is revealed — they're found only
  by searching (corridor traps are unchanged, revealed with the corridor tile).
- `QuestEditorHandle.searchRoom(groupId, 'treasure' | 'traps' | 'secret')` — reveals
  matching hidden elements and emits `search:traps` / `search:secret` with a `found`
  array, or `search:treasure` (abstract — no board element).
- `trap:disarmed` intercept hook — clicking a discovered trap emits it without
  removing; the host attributes the disarm and removes via `removeElement`.

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
