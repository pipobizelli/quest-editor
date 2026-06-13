# CLAUDE.md

## Project Overview

Quest Editor is a visual HeroQuest dungeon editor built as a React monorepo. It has AI-powered plugins that use LLM prompts enriched with official HeroQuest game rules.

## Commands

```bash
pnpm dev          # Start playground dev server (Vite)
pnpm build        # Build all packages (tsup)
pnpm test         # Run tests in watch mode (Vitest)
pnpm test:run     # Run tests once
```

## Architecture

- **Monorepo**: pnpm workspaces
- **`packages/core`** (`@quest-editor/core`): Pure TypeScript, no UI deps. Types, quest operations, board layout, monster stats, game rules constants, validation, tile utilities.
- **`packages/editor`** (`@quest-editor/editor`): React + Konva canvas, Zustand store, theme system, plugin system, lock system, event system, undo/redo, validation panel.
- **`packages/plugins/narrator`**: AI narration for room reveals. Creature lore, trap awareness, tone presets, cross-room context, generate-all, GM script export.
- **`packages/plugins/strategist`**: AI tactical advice for Zargon. Full rules knowledge.
- **`packages/plugins/reinforcements`**: AI monster placement. Validates subtypes and tile availability.
- **`packages/plugins/remix`**: AI quest remixing with difficulty levels. Extracted `apply.ts` with pure logic.
- **`apps/playground`**: Vite app for dev/testing. Loads `public/quests/barak_tor.json` as default quest.
- **`docs/`**: HeroQuest rules reference (rules, monsters, spells, armory, remix guidelines).

## Key Patterns

- **Immutable quest operations**: All functions in `core/quest.ts` return new Quest objects (no mutation).
- **Element types**: `hero`, `monster`, `npc`, `furniture`, `door`, `trap`, `treasure`, `marker`.
- **Doors**: Use `orientation` (vertical/horizontal) instead of `rotation`. Non-secret doors render on tile edges.
- **Game rules for LLM**: `core/game-rules.ts` exports rules as string constants. Plugins import and inject them into prompts via XML-structured tags.
- **Themes**: `editor/themes.ts` — default is `stone`. Four built-in: dark, stone, parchment, light.
- **Plugin prompts**: Use XML-structured tags (`<quest>`, `<room>`, `<rules>`, `<game_rules>`, etc.) for clear LLM context.
- **Lock system**: `lock(reason?)` / `unlock()` on store and via `QuestEditorHandle` ref. All mutating actions are guarded. `setQuest` is intentionally NOT guarded so plugins can apply changes. Visual: canvas at 0.45 opacity + SVG spinner.
- **Plugin props**: `PluginPanelProps` includes `quest`, `onUpdateQuest`, `llmProvider`, `lock`, `unlock`, `locked`, `emit`.
- **Undo/Redo**: History stack (max 50) in Zustand store. All quest-mutating actions push to history. Cmd+Z / Cmd+Shift+Z keyboard shortcuts. Exposed via `QuestEditorHandle`.
- **Events**: `onEvent` prop on QuestEditor. Store emits events for element add/remove/move/update/rotate, quest load/undo/redo. Plugins emit custom events via `emit(action, data)`.
- **Play-mode hooks**: In play mode, clicking a monster fires `monster:killed` (carries the element) — an **intercept** hook: the editor does NOT remove it. The host reacts (e.g. opens a "who killed it?" modal) and then removes via `handle.removeElement(id)`. Adding a new play hook = new `EditorEvent` variant + a trigger in `QuestEditor`/store. See the `apps/playground` App for a reference host implementation.
- **Validation**: `validateQuest()` in core returns errors/warnings. Real-time display in editor panel.
- **Grouped rooms**: L-shaped rooms share a `group` field. `getGroupedRooms()` combines them. Narrator generates one narration per group.
- **Multi-tile elements**: `getElementsByRoom` uses AABB overlap, not just origin position.
- **Tile validation**: `normalizeSubtype`, `isDisabledTile`, `isOccupiedTile`, `isTileBlocked` in `core/validation.ts`. Used by remix and reinforcements.

## Remix Plugin Internals

- **apply.ts**: Extracted pure functions — `applyRemix`, `resolveElement`, `createDefaultSelection`.
- **normalizeSubtype** (in core): Maps LLM aliases to valid catalog entries (e.g., `chaos_warrior` → `chaos`).
- **isTileBlocked** (in core): Rejects disabled tiles AND occupied tiles (including multi-tile furniture).
- **resolveElement**: 3-level fallback for when LLM returns wrong IDs: exact ID → subtype+position → position only → subtype only.
- **Monster families**: Living (goblin→orc→fimir→chaos→gargoyle) and Undead (skeleton→zombie→mummy) must never cross in upgrades.
- **Selective apply**: Per-change checkboxes. User can uncheck individual changes before applying.

## Narrator Plugin Internals

- **Tone presets**: Dark Fantasy, Gore, Humorous, Poetic, Suspense, Children-friendly + custom.
- **Cross-room context**: `buildPrompt` accepts `previousNarrations` — previous room texts are injected so the LLM builds a narrative arc.
- **Generate All**: Sequential generation of all pending rooms, with accumulated context.
- **GM Script Export**: `buildGMScript()` generates markdown with title, description, notes, and numbered narrations.
- **Grouped rooms**: L-shaped rooms generate one narration, elements collected from all parts.

## Testing

- 225 tests across 17 files. Run with `pnpm test:run`.
- Vitest workspace config includes: `packages/core`, `packages/editor`, and all 4 plugin packages.
- Core: quest, serialization, board-layout, rooms, validate
- Editor: store, lock, undo-redo, events
- Plugins: prompt tests for all 4, apply tests for remix, export-script for narrator

## Known Issues

- DTS build fails for plugins and editor due to `rootDir` cross-package resolution in tsup. ESM builds work fine. This does not affect development (Vite resolves source directly via `"development"` condition in package.json exports).

## Language

- User prefers Brazilian Portuguese for communication and plugin output.
- Plugin language is set via config: `NarratorPlugin({ language: 'pt' })`.
