# Changelog

All notable changes to the published packages. This repo is a pnpm monorepo, so
versions are tracked per package. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## `@quest-editor/editor`

### Unreleased

#### Added
- `QuestEditorHandle.placeMonsterNearHero(monsterSubtype, heroSubtype)` — places a monster on a
  free tile next to a hero (for treasure "wandering monster" cards) and reveals it; returns false
  if the hero isn't on the board or there's no free adjacent tile.
- **Hero placement.** `QuestEditorHandle.placeHeroes(heroes, opts?)` — in play mode, auto-places
  the party on free tiles around the stairway; with no stairway (or `opts.manual`) it clears any
  placed heroes and enters click-to-place (`heroes:need-placement` → each board click drops the
  next hero → `heroes:placed`). `opts.manual` lets a host re-place heroes at custom start
  positions (e.g. quests whose entry is marked corners, not a stairway).

#### Changed
- **Play mode hides the element sidebar.** The catalog/edit tools aren't useful in play, so the
  220px panel is hidden and the canvas takes the full width; only a compact floating control
  remains — recenter (⌖) and the play↔edit toggle. New **`C` shortcut** recenters the board, and
  the view auto-recenters on mode change. New `showModeToggle` prop (default true) lets a host that
  owns the mode (e.g. a live session) hide the toggle and keep only recenter.
- Heroes are **always visible in play mode** — the party's own pieces are never fog-hidden.
- **Doors open from either bordering tile.** A door straddles the edge between two tiles
  (vertical → x/x+1, horizontal → y/y+1); in play mode, clicking EITHER tile now reveals its
  rooms — no need to hit the thin door sprite exactly.
- **Reveal follows hero placement, not the stairway.** Entering play mode no longer auto-reveals
  the stairway/its room (the stairway isn't always the start — it can be the objective). Instead,
  placing a hero reveals its room, or (in a corridor) its tile + line-of-sight corridors.
- **Search is right-click, and works in corridors.** Right-clicking a revealed tile in play mode
  emits `search:requested` ({groupId} for a room, {x,y} for a corridor) so the host opens a search
  menu. `searchRoom(groupId, kind)` / new `searchCorridor(x, y, kind)` reveal traps/secret doors
  and **return the count** (no longer emit `search:*`). Replaces the old left-click `room:activated`
  trigger and the `search:treasure/traps/secret` events; treasure is now host-only (room search).

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
